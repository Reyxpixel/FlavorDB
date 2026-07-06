
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiPath } from '../apiPath';
import { CatTag, TableWrap } from './Shared';

const AUTOCOMPLETE_LIMIT = 64;
const AUTOCOMPLETE_FETCH_SIZE = 400;
const ROWS_PER_PAGE = 10;
const JSME_DEMO_URL = 'https://jmol.sourceforge.net/demo/JSME.html';

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`fdb-tab ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    ['molecules', 'Flavor Molecules'],
    ['entities', 'Entities/Ingredients'],
    ['sources', 'Natural Sources'],
    ['pairing', 'Flavor Pairing'],
  ];

  return (
    <div className="fdb-tabs" role="tablist" aria-label="FlavorDB search tabs">
      {tabs.map(([key, label]) => (
        <TabButton
          key={key}
          active={activeTab === key}
          onClick={() => setActiveTab(key)}
        >
          {label}
        </TabButton>
      ))}
    </div>
  );
}

function ResultPager({ page, pageCount, onPage }) {
  const safePage = Math.min(page, pageCount - 1);

  const items = useMemo(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => ({ type: 'page', page: i }));
    }

    const out = [{ type: 'page', page: 0 }];

    if (safePage <= 2) {
      for (let p = 1; p <= Math.min(4, pageCount - 2); p++) out.push({ type: 'page', page: p });
      if (pageCount > 5) out.push({ type: 'ellipsis' });
      out.push({ type: 'page', page: pageCount - 1 });
      return out;
    }

    if (safePage >= pageCount - 3) {
      out.push({ type: 'ellipsis' });
      for (let p = Math.max(1, pageCount - 5); p <= pageCount - 2; p++) out.push({ type: 'page', page: p });
      out.push({ type: 'page', page: pageCount - 1 });
      return out;
    }

    out.push({ type: 'ellipsis' });
    out.push({ type: 'page', page: safePage - 1 });
    out.push({ type: 'page', page: safePage });
    out.push({ type: 'page', page: safePage + 1 });
    out.push({ type: 'ellipsis' });
    out.push({ type: 'page', page: pageCount - 1 });
    return out;
  }, [pageCount, safePage]);

  return (
    <div className="fdb-pagination">
      <button className="pag-btn" disabled={safePage <= 0} onClick={() => onPage(Math.max(0, safePage - 1))}>
        ← Previous
      </button>

      {items.map((item, idx) => {
        if (item.type === 'ellipsis') {
          return <span key={`ell-${idx}`} className="pag-ellipsis">…</span>;
        }
        return (
          <button
            key={`p-${item.page}`}
            className={`pag-btn ${safePage === item.page ? 'is-current' : ''}`}
            onClick={() => onPage(item.page)}
          >
            {item.page + 1}
          </button>
        );
      })}

      <button className="pag-btn" disabled={safePage >= pageCount - 1} onClick={() => onPage(Math.min(pageCount - 1, safePage + 1))}>
        Next →
      </button>
    </div>
  );
}

function EntitySearchPane({ mode = 'entities', onOpenMolecules, onOpenPairings }) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [entities, setEntities] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(null);
  const [totalElements, setTotalElements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          apiPath(`/api/search?q=${encodeURIComponent(q)}&page=0&size=${AUTOCOMPLETE_FETCH_SIZE}`)
        );
        const data = await res.json();
        const prefix = q.toLowerCase();
        const items = Array.isArray(data.entities) ? data.entities : [];
        const allowLooseMatch = prefix.length > 1;

        const scored = [];
        for (const ent of items) {
          const name = String(ent?.name || '').trim().toLowerCase();
          if (!name) continue;

          const tokens = name.split(/[^a-z0-9]+/).filter(Boolean);
          const startsWhole = name.startsWith(prefix);
          const startsToken = tokens.some(token => token.startsWith(prefix));
          const contains = allowLooseMatch && name.includes(prefix);

          if (!startsWhole && !startsToken && !contains) continue;

          const score = startsWhole ? 0 : startsToken ? 1 : 2;
          scored.push({ ent, score, name });
        }

        scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));

        const seen = new Set();
        const deduped = [];
        for (const { ent } of scored) {
          if (ent && !seen.has(ent.id)) {
            seen.add(ent.id);
            deduped.push(ent);
          }
        }

        if (!cancelled) {
          setSuggestions(deduped.slice(0, AUTOCOMPLETE_LIMIT));
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const showSuggestions = suggestionsOpen && query.trim().length > 0;

  async function doSearch(q, pg = 0) {
    if (!q.trim()) return;
    setLoading(true);
    setNotFound(false);
    setEntities([]);
    setSuggestionsOpen(false);

    try {
      const res = await fetch(apiPath(`/api/search?q=${encodeURIComponent(q)}&page=${pg}&size=24`));
      const data = await res.json();
      if (!data.entities || data.entities.length === 0) {
        setNotFound(true);
      } else {
        setEntities(data.entities);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setPage(pg);
        setSubmitted(q);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      doSearch(query, 0);
    }
  }

  function handleSuggestionSelect(ent) {
    setSuggestionsOpen(false);
    onOpenMolecules(ent);
  }

  function handleAction(ent) {
    if (mode === 'pairing') onOpenPairings(ent);
    else onOpenMolecules(ent);
  }

  return (
    <div>
      <div className="fdb-search-wrap">
        <div className="fdb-search-label">Entity / Ingredient Name</div>

        <div className="fdb-search-shell">
          <div className="fdb-search-row">
            <input
              ref={inputRef}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (query.trim()) setSuggestionsOpen(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setSuggestionsOpen(false), 120);
              }}
              onKeyDown={handleKey}
              placeholder="e.g. Apple, Vanilla, Garlic…"
              autoComplete="off"
            />
            <button className="btn" onClick={() => doSearch(query, 0)} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          {showSuggestions && (suggestionsLoading || suggestions.length > 0) && (
            <div className="fdb-autocomplete" role="listbox" aria-label="Autocomplete suggestions">
              {suggestionsLoading && suggestions.length === 0 ? (
                <div className="fdb-autocomplete-empty">Loading suggestions…</div>
              ) : (
                suggestions.map(ent => (
                  <button
                    key={ent.id}
                    type="button"
                    className="fdb-autocomplete-item"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSuggestionSelect(ent)}
                  >
                    <div className="fdb-autocomplete-main">
                      <div className="fdb-autocomplete-name">{ent.name}</div>
                      <div className="fdb-autocomplete-sub">
                        {ent.category || '—'}{ent.source ? ` · ${ent.source}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {showSuggestions && !suggestionsLoading && suggestions.length === 0 && (
            <div className="fdb-autocomplete" role="listbox" aria-label="Autocomplete suggestions">
              <div className="fdb-autocomplete-empty">No autocomplete matches</div>
            </div>
          )}
        </div>
      </div>

      {!submitted && !loading && !notFound && (
        <div className="fdb-welcome">
          <div className="icon">🌶</div>
          <h2>Search for an ingredient to get started!</h2>
        </div>
      )}

      {notFound && (
        <div className="fdb-not-found">
          <h2>Oops, we couldn't find that.</h2>
          <p>No ingredients matched your search.</p>
          <span className="query-tag">"{query}"</span>
        </div>
      )}

      {entities.length > 0 && (
        <>
          <div className="fdb-result-info">
            We found <b>{totalElements != null ? `${totalElements} ` : ''}results</b> for your query: entity: <b>{submitted}</b>
          </div>

          <TableWrap
            title="Results"
            meta={mode === 'pairing'
              ? 'Click Entity Name for more info · Pair It to explore shared flavor molecules'
              : 'Click Entity Name for more info · Pair It to jump straight to pairings'}
          >
            <table className="fdb-table">
              <thead>
                <tr>
                  <th>Entity Name</th>
                  <th>Category</th>
                  <th>Natural Source</th>
                  <th className="right" style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.map(ent => (
                  <tr key={ent.id}>
                    <td>
                      <span className="ent-link" onClick={() => onOpenMolecules(ent)}>
                        {ent.name}
                      </span>
                    </td>
                    <td><CatTag category={ent.category} /></td>
                    <td className="muted">{ent.source || '—'}</td>
                    <td className="right">
                      <button className={mode === 'pairing' ? 'pair-link' : 'pair-link'} onClick={() => handleAction(ent)}>
                        'Pair It'
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          {totalPages ? (
            <ResultPager page={page} pageCount={totalPages} onPage={(nextPage) => doSearch(submitted, nextPage)} />
          ) : null}
        </>
      )}
    </div>
  );
}

function SourceSearchPane() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(null);
  const [totalElements, setTotalElements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function doSearch(q, pg = 0) {
    if (!q.trim()) return;
    setLoading(true);
    setNotFound(false);
    setRows([]);

    try {
      const res = await fetch(apiPath(`/api/natural-sources/search?q=${encodeURIComponent(q)}&page=${pg}&size=24`));
      const data = await res.json();
      const items = Array.isArray(data.sources) ? data.sources : [];
      if (!items.length) {
        setNotFound(true);
      } else {
        setRows(items);
        setPage(pg);
        setSubmitted(q);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="fdb-search-wrap">
        <div className="fdb-search-label">Natural Source</div>
        <div className="fdb-search-row">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch(query, 0)}
            placeholder="e.g. wine, maize, orange…"
            autoComplete="off"
          />
          <button className="btn" onClick={() => doSearch(query, 0)} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {!submitted && !loading && !notFound && (
        <div className="fdb-welcome">
          <div className="icon">🍃</div>
          <h2>Search by natural source to discover ingredients.</h2>
        </div>
      )}

      {notFound && (
        <div className="fdb-not-found">
          <h2>Oops, we couldn't find that.</h2>
          <p>No natural sources matched your search.</p>
          <span className="query-tag">"{query}"</span>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="fdb-result-info">
            We found <b>{totalElements != null ? `${totalElements} ` : ''}results</b> for your query: natural source: <b>{submitted}</b>
          </div>

          <TableWrap title="Results" meta="Click Natural Source for more info">
            <table className="fdb-table">
              <thead>
                <tr>
                  <th>Natural Source</th>
                  <th>Category</th>
                  <th>Entity Count</th>
                  <th>Sample Ingredients</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.source}>
                    <td><span className="ent-link">{row.source}</span></td>
                    <td><CatTag category={row.category} /></td>
                    <td>{row.entityCount ?? '—'}</td>
                    <td className="muted">{Array.isArray(row.examples) ? row.examples.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          {totalPages ? (
            <ResultPager page={page} pageCount={totalPages} onPage={(nextPage) => doSearch(submitted, nextPage)} />
          ) : null}
        </>
      )}
    </div>
  );
}

function MoleculeSearchPane() {
  const [form, setForm] = useState({
    commonName: '',
    functionalGroup: '',
    flavorProfile: '',
    femaFlavorProfile: '',
    mwFrom: '',
    mwTo: '',
    hbd: '',
    hba: '',
    moleculeType: 'All',
  });
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(null);
  const [totalElements, setTotalElements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function doSearch(pg = 0) {
    const q = String(form.commonName || '').trim();
    setQuery(q);
    setLoading(true);
    setNotFound(false);
    setRows([]);

    try {
      const params = new URLSearchParams({
        q,
        page: String(pg),
        size: '24',
        functionalGroup: form.functionalGroup,
        flavorProfile: form.flavorProfile,
        femaFlavorProfile: form.femaFlavorProfile,
        mwFrom: form.mwFrom,
        mwTo: form.mwTo,
        hbd: form.hbd,
        hba: form.hba,
        moleculeType: form.moleculeType,
      });

      const res = await fetch(apiPath(`/api/flavor-molecules/search?${params.toString()}`));
      const data = await res.json();
      const items = Array.isArray(data.molecules) ? data.molecules : [];
      if (!items.length) {
        setNotFound(true);
      } else {
        setRows(items);
        setPage(pg);
        setSubmitted(q || 'All molecules');
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="fdb-search-wrap">
        <div className="fdb-search-label">Search based on physicochemical properties of Flavor Molecules</div>
        <p className="fdb-subnote">Use one or more search parameters. You may leave any field empty.</p>

        <div className="molecule-advanced-grid">
          <label>
            <span>Common Name</span>
            <input value={form.commonName} onChange={(e) => updateField('commonName', e.target.value)} placeholder="Common Name" />
          </label>
          <label>
            <span>Functional Group</span>
            <input value={form.functionalGroup} onChange={(e) => updateField('functionalGroup', e.target.value)} placeholder="Functional Group" />
          </label>
          <label>
            <span>Flavor Profile</span>
            <input value={form.flavorProfile} onChange={(e) => updateField('flavorProfile', e.target.value)} placeholder="Flavor Profile" />
          </label>
          <label>
            <span>FEMA Flavor profile</span>
            <input value={form.femaFlavorProfile} onChange={(e) => updateField('femaFlavorProfile', e.target.value)} placeholder="FEMA Flavor" />
          </label>
          <label>
            <span>Range of molecular weight (g/mol) — From</span>
            <input value={form.mwFrom} onChange={(e) => updateField('mwFrom', e.target.value)} placeholder="Default" />
          </label>
          <label>
            <span>To</span>
            <input value={form.mwTo} onChange={(e) => updateField('mwTo', e.target.value)} placeholder="Disabled" />
          </label>
          <label>
            <span>Hydrogen bond donors</span>
            <input value={form.hbd} onChange={(e) => updateField('hbd', e.target.value)} placeholder="Default" />
          </label>
          <label>
            <span>Hydrogen bond acceptors</span>
            <input value={form.hba} onChange={(e) => updateField('hba', e.target.value)} placeholder="Default" />
          </label>
          <label className="molecule-advanced-wide">
            <span>Type of molecules</span>
            <select value={form.moleculeType} onChange={(e) => updateField('moleculeType', e.target.value)}>
              <option>All</option>
              <option>Natural</option>
              <option>Synthetic</option>
              <option>Unknown</option>
            </select>
          </label>
        </div>

        <div className="fdb-search-row fdb-search-row--end">
          <button className="btn" onClick={() => doSearch(0)} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="fdb-molecule-layout">
        <div className="fdb-molecule-editor">
          <div className="fdb-panel-title">JSME Molecular Editor by Peter Ertl and Bruno Bienfait</div>
          <iframe title="JSME Molecular Editor" src={JSME_DEMO_URL} className="fdb-jsme-frame" />
          <div className="fdb-panel-caption">Drag out MOL or RXN file.</div>
        </div>

        <div className="fdb-molecule-results">
          {!submitted && !loading && !notFound && (
            <div className="fdb-welcome">
              <div className="icon">🧪</div>
              <h2>Search flavor molecules by name or structure.</h2>
            </div>
          )}

          {notFound && (
            <div className="fdb-not-found">
              <h2>Oops, we couldn't find that.</h2>
              <p>No flavor molecules matched your search.</p>
              <span className="query-tag">"{query || 'current filters'}"</span>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="fdb-result-info">
                We found <b>{totalElements != null ? `${totalElements} ` : ''}results</b> for your query: molecule: <b>{submitted}</b>
              </div>

              <TableWrap title="Results" meta="Click Common Name to open the original FlavorDB molecule page">
                <table className="fdb-table">
                  <thead>
                    <tr>
                      <th>Common Name</th>
                      <th>PubChem ID</th>
                      <th>Contained In</th>
                      <th>Rarity</th>
                      <th>Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.pubchem_id}>
                        <td>{row.name}</td>
                        <td>{row.pubchem_id}</td>
                        <td>{row.entityCount ?? '—'}</td>
                        <td>{row.rarity?.label || '—'}</td>
                        <td>
                          <a
                            className="pair-link"
                            href={`https://cosylab.iiitd.edu.in/flavordb/molecules_details?id=${row.pubchem_id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            More Info
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>

              {totalPages ? (
                <ResultPager page={page} pageCount={totalPages} onPage={(nextPage) => doSearch(nextPage)} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage({ onOpenMolecules, onOpenPairings }) {
  const [activeTab, setActiveTab] = useState('molecules');

  return (
    <div>
      <div className="fdb-tabs-card">
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="fdb-tab-panel">
          {activeTab === 'molecules' && <MoleculeSearchPane />}
          {activeTab === 'entities' && (
            <EntitySearchPane
              mode="entities"
              onOpenMolecules={onOpenMolecules}
              onOpenPairings={onOpenPairings}
            />
          )}
          {activeTab === 'sources' && <SourceSearchPane />}
          {activeTab === 'pairing' && (
            <EntitySearchPane
              mode="pairing"
              onOpenMolecules={onOpenMolecules}
              onOpenPairings={onOpenPairings}
            />
          )}
        </div>
      </div>
    </div>
  );
}
