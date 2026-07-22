import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiPath } from '../apiPath';
import { CatTag, TableWrap, Pagination } from './Shared';
import { catColor } from '../categories';
import PairingsPage from './PairingsPage';

const MOLECULE_FIELDS = [
  { key: 'common_name', label: 'Common Name', placeholder: 'Common Name' },
  { key: 'functional_group', label: 'Functional Group', placeholder: 'Functional Group' },
  { key: 'flavor_profile', label: 'Flavor Profile', placeholder: 'Flavor Profile' },
  { key: 'fema_flavor_profile', label: 'FEMA Flavor profile', placeholder: 'FEMA Flavor' },
];

const HBD_OPTIONS = [
  { value: '', label: 'Default' },
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2-3', label: '2-3' },
  { value: '0-5', label: '0-5' },
  { value: '6+', label: '6+' },
];

const HBA_OPTIONS = [
  { value: '', label: 'Default' },
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '5-6', label: '5-6' },
  { value: '0-10', label: '0-10' },
  { value: '7+', label: '7+' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'natural', label: 'Natural' },
  { value: 'synthetic', label: 'Synthetic' },
  { value: 'unknown', label: 'Unknown' },
];

const WEIGHT_FROM_OPTIONS = [
  { value: '', label: 'Default' },
  { value: '0', label: '0' },
  { value: '100', label: '100' },
  { value: '120', label: '120' },
  { value: '140', label: '140' },
  { value: '160', label: '160' },
  { value: '180', label: '180' },
  { value: '200', label: '200' },
  { value: '250', label: '250' },
  { value: '300', label: '300' },
];

const WEIGHT_TO_OPTIONS = [
  { value: '', label: 'Disabled' },
  { value: '100', label: '100' },
  { value: '120', label: '120' },
  { value: '140', label: '140' },
  { value: '160', label: '160' },
  { value: '180', label: '180' },
  { value: '200', label: '200' },
  { value: '250', label: '250' },
  { value: '300', label: '300' },
];

const ENTITY_CATEGORIES = [
  'additive', 'animalproduct', 'bakery', 'beverage', 'beveragealcoholic',
  'beveragecaffeinated', 'cereal', 'maize', 'dairy', 'dish', 'essentialoil',
  'fish', 'seafood', 'flower', 'fruit', 'berry', 'fruitcitrus', 'fruitessence',
  'fungus', 'herb', 'meat', 'legume', 'nutseed', 'plant', 'plantderivative',
  'spice', 'vegetable', 'cabbage', 'vegetablefruit', 'vegetablegourd',
  'vegetableroot', 'vegetablestem', 'vegetabletuber',
];

const PAGE_SIZE = 20;
const AUTOCOMPLETE_MIN = 2;
const AUTOCOMPLETE_LIMIT = 50;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function formatRangeLabel(from, to) {
  const left = from || 'Any';
  const right = to || 'Any';
  return `${left} → ${right}`;
}

function useDebouncedValue(value, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function AutocompleteField({
  value,
  onChange,
  placeholder,
  fetchUrl,
  minChars = AUTOCOMPLETE_MIN,
  onSelect,
  disabled = false,
  className = '',
  label,
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const fetchUrlRef = useRef(fetchUrl);
  const debounced = useDebouncedValue(value, 200);

  useEffect(() => {
    fetchUrlRef.current = fetchUrl;
  }, [fetchUrl]);

  useEffect(() => {
    if (!debounced || normalize(debounced).length < minChars) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(apiPath(fetchUrlRef.current(debounced)))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : Array.isArray(data.entities) ? data.entities : Array.isArray(data.molecules) ? data.molecules : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, minChars]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const prefix = normalize(value);
  const filtered = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    const seen = new Set();
    const out = [];
    for (const item of arr) {
      const text = normalize(item.label || item.name || item.common_name || item.entity_alias_readable || item.entity_alias || item.natural_source_name || item.category || '');
      if (!text) continue;
      if (prefix.length >= minChars && !text.includes(prefix)) continue;
      const key = normalize(item.id ?? item.pubchem_id ?? item.name ?? item.label ?? text);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= AUTOCOMPLETE_LIMIT) break;
    }
    return out;
  }, [items, minChars, prefix]);

  return (
    <div className={`fdb-autocomplete-field ${className}`} ref={wrapRef}>
      {label && <label className="fdb-field-label">{label}</label>}
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 100)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && normalize(value).length >= minChars && (
        <div className="fdb-autocomplete-menu">
          {loading && filtered.length === 0 ? (
            <div className="fdb-autocomplete-empty">Loading…</div>
          ) : filtered.length ? (
            filtered.map((item, idx) => (
              <button
                key={`${item.id ?? item.pubchem_id ?? item.name ?? idx}`}
                type="button"
                className="fdb-autocomplete-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                {item.name || item.label || item.common_name || item.entity_alias_readable || item.natural_source_name || item.category}
              </button>
            ))
          ) : (
            <div className="fdb-autocomplete-empty">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

// Loads the self-hosted JSME bootstrap script and resolves once
// `window.JSApplet.JSME` is actually available.
//
// This deliberately does NOT rely solely on the script's `load` event or on












function loadJsmeScript() {
  const src = `${process.env.PUBLIC_URL || ''}/jsme/jsme.nocache.js`;
  window.__JSME_LOADERS = window.__JSME_LOADERS || {};
  if (window.__JSME_LOADERS[src]) return window.__JSME_LOADERS[src];

  const promise = new Promise((resolve, reject) => {
    if (window.JSApplet?.JSME) {
      resolve();
      return;
    }

    const previousOnLoad = window.jsmeOnLoad;
    window.jsmeOnLoad = () => {
      if (previousOnLoad) previousOnLoad();
      resolve();
    };

    if (!document.getElementById('jsme-script-loader')) {
      const script = document.createElement('script');
      script.id = 'jsme-script-loader';
      script.src = src;
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load JSME script'));
      document.head.appendChild(script);
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (window.JSApplet?.JSME) {
        window.clearInterval(timer);
        resolve();
      } else if (tries >= 400) { 
        window.clearInterval(timer);
        reject(new Error('JSME did not finish loading'));
      }
    }, 50);
  });

  window.__JSME_LOADERS[src] = promise;
  promise.catch(() => {
    delete window.__JSME_LOADERS[src];
  });

  return promise;
}

function JsmeEditor({ onSmilesChange }) {
  const containerId = useRef(`fdb-jsme-${Math.random().toString(36).slice(2)}`);
  const editorRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [smiles, setSmiles] = useState('');
  const [error, setError] = useState('');
  const onChangeRef = useRef(onSmilesChange);

  useEffect(() => {
    onChangeRef.current = onSmilesChange;
  }, [onSmilesChange]);

  // The editor always mounts with a blank canvas (nothing carries over
  // visually), but the parent's molForm.smiles can still hold a value from
  // an earlier visit to this tab. Sync it back to blank so a stale drawing
  // can't get submitted invisibly — what's on screen and what gets searched
  // now always match.
  useEffect(() => {
    onChangeRef.current?.('');
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadJsmeScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        console.error('JSME failed to load:', err);
        if (!cancelled) setError(err.message || 'Failed to load JSME');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !window.JSApplet?.JSME) return undefined;

    const el = document.getElementById(containerId.current);
    if (!el || el.childNodes.length > 0) return undefined;

    try {
      const applet = new window.JSApplet.JSME(containerId.current, '100%', '420px', {
        options: 'oldlook,query,marker,noatommovebutton,fgmenu',
      });
      applet.setCallBack('AfterStructureModified', () => {
        try {
          const value = applet?.smiles?.() || '';
          setSmiles(value);
          if (onChangeRef.current) onChangeRef.current(value);
        } catch {
          // ignore
        }
      });
      editorRef.current = applet;
    } catch (err) {
      setError(err?.message || 'Failed to initialize JSME');
    }

    return () => {
      editorRef.current = null;
      if (el) el.innerHTML = '';
    };
  }, [ready]);

  return (
    <div className="fdb-jsme-card">
      <div className="fdb-jsme-head">
        <span>JSME Molecular Builder</span>
        <button
          type="button"
          className="fdb-jsme-clear"
          onClick={() => {
            try {
              editorRef.current?.reset?.();
              setSmiles('');
              onSmilesChange?.('');
            } catch {
              // ignore
            }
          }}
        >
          Clear
        </button>
      </div>
      <div className="fdb-jsme-host" id={containerId.current} />
      <div className="fdb-jsme-footer">
        <span>{error || (ready ? 'Draw a structure and submit alongside the text filters.' : 'Loading editor…')}</span>
        <span className="mono">{smiles ? `SMILES: ${smiles}` : ''}</span>
      </div>
    </div>
  );
}

function ResultPagination({ page, totalPages, onPageChange, totalElements }) {
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      totalElements={totalElements}
      pageSize={PAGE_SIZE}
    />
  );
}

function EntityResults({ rows = [], totalElements = 0, page = 0, totalPages = 1, onPageChange, onOpenMolecules, onOpenPairings }) {
  if (!rows.length) return null;
  return (
    <TableWrap title="Results" meta="Click Entity Name for more info">
      <table className="fdb-table">
        <thead>
          <tr>
            <th>Entity Name</th>
            <th>Category</th>
            <th>Natural Source</th>
            <th className="right" style={{ width: 90 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ent) => (
            <tr key={ent.id}>
              <td>
                <button type="button" className="ent-link" onClick={() => onOpenMolecules(ent)}>
                  {ent.name}
                </button>
              </td>
              <td><CatTag category={ent.category} /></td>
              <td>{ent.source || '—'}</td>
              <td className="right"><button type="button" className="pair-link" onClick={() => onOpenPairings(ent)}>Pair It</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ResultPagination page={page} totalPages={totalPages} onPageChange={onPageChange} totalElements={totalElements} />
    </TableWrap>
  );
}

function SourceResults({ rows = [], totalElements = 0, page = 0, totalPages = 1, onPageChange, onOpenMolecules, onOpenPairings }) {
  if (!rows.length) return null;
  return (
    <TableWrap title="Results" meta="Click Natural Source for more info">
      <table className="fdb-table">
        <thead>
          <tr>
            <th>Natural Source</th>
            <th>Category</th>
            <th>Entity Name</th>
            <th className="right" style={{ width: 90 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ent) => (
            <tr key={ent.id}>
              <td>{ent.source || '—'}</td>
              <td><CatTag category={ent.category} /></td>
              <td>
                <button type="button" className="ent-link" onClick={() => onOpenMolecules(ent)}>
                  {ent.name}
                </button>
              </td>
              <td className="right"><button type="button" className="pair-link" onClick={() => onOpenPairings(ent)}>Pair It</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ResultPagination page={page} totalPages={totalPages} onPageChange={onPageChange} totalElements={totalElements} />
    </TableWrap>
  );
}

export default function SearchPage({
  initialMolForm,
  onOpenMolecules,
  onOpenPairings,
  onOpenMoleculeResults,
}) {
  const [activeTab, setActiveTab] = useState('entities');

  
  const [molForm, setMolForm] = useState(() => ({
    common_name: '',
    functional_group: '',
    flavor_profile: '',
    fema_flavor_profile: '',
    fooddb_flavor_profile: '',
    from: '',
    to: '',
    hbd: '',
    hba: '',
    type: '',
    smiles: '',
    ...(initialMolForm || {}),
  }));

  // Entity tab
  const [entityQuery, setEntityQuery] = useState('');
  const [entityCategory, setEntityCategory] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityError, setEntityError] = useState('');
  const [entitySubmitted, setEntitySubmitted] = useState(false);
  const [entityPage, setEntityPage] = useState(0);
  const [entityTotalPages, setEntityTotalPages] = useState(1);
  const [entityTotal, setEntityTotal] = useState(0);

  // Natural source tab
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceResults, setSourceResults] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const [sourceSubmitted, setSourceSubmitted] = useState(false);
  const [sourcePage, setSourcePage] = useState(0);
  const [sourceTotalPages, setSourceTotalPages] = useState(1);
  const [sourceTotal, setSourceTotal] = useState(0);

  // Pairing tab
  const [pairQuery, setPairQuery] = useState('');
  const [pairEntity, setPairEntity] = useState(null);
  const [pairError, setPairError] = useState('');

  const moleculeAutocomplete = (field) => (query) => {
    const key = encodeURIComponent(query);
    return `/api/autocomplete/molecules?field=${field}&q=${key}`;
  };

  const entityAutocomplete = (field) => (query) => `/api/autocomplete/entities?field=${field}&q=${encodeURIComponent(query)}`;
  const sourceAutocomplete = (query) => `/api/autocomplete/sources?q=${encodeURIComponent(query)}`;

  const hasMoleculeCriteria = Object.values(molForm).some((v) => v !== '' && v != null);

  const runMoleculeSearch = () => {
    // Flavor Molecule results now live on their own dedicated page/route so the
    // browser Back button returns here; hand the criteria up to the router.
    onOpenMoleculeResults(molForm);
  };

  const runEntitySearch = async (page = 0) => {
    setEntityLoading(true);
    setEntityError('');
    setEntitySubmitted(true);
    try {
      const params = new URLSearchParams();
      if (entityQuery.trim()) params.set('entity_alias', entityQuery.trim());
      if (entityCategory.trim()) params.set('category', entityCategory.trim());
      params.set('page', String(page));
      params.set('size', String(PAGE_SIZE));
      const res = await fetch(apiPath(`/api/entities/search?${params.toString()}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search failed');

      const results = data.entities || [];
      if (results.length === 1 && page === 0) {
        onOpenMolecules(results[0]);
        setEntityLoading(false);
        return;
      }

      setEntityResults(results);
      setEntityTotal(data.totalElements || 0);
      setEntityTotalPages(data.totalPages || 1);
      setEntityPage(page);
    } catch (err) {
      setEntityError(err.message || 'Search failed');
      setEntityResults([]);
      setEntityTotal(0);
      setEntityTotalPages(1);
    } finally {
      setEntityLoading(false);
    }
  };

  const runSourceSearch = async (page = 0) => {
    setSourceLoading(true);
    setSourceError('');
    setSourceSubmitted(true);
    try {
      const params = new URLSearchParams();
      if (sourceQuery.trim()) params.set('natural_source_name', sourceQuery.trim());
      params.set('page', String(page));
      params.set('size', String(PAGE_SIZE));
      const res = await fetch(apiPath(`/api/natural-sources/search?${params.toString()}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search failed');
      setSourceResults(data.entities || []);
      setSourceTotal(data.totalElements || 0);
      setSourceTotalPages(data.totalPages || 1);
      setSourcePage(page);
    } catch (err) {
      setSourceError(err.message || 'Search failed');
      setSourceResults([]);
      setSourceTotal(0);
      setSourceTotalPages(1);
    } finally {
      setSourceLoading(false);
    }
  };

  const runPairSearch = async () => {
    const q = pairQuery.trim();
    if (!q) return;
    try {
      const res = await fetch(apiPath(`/api/entities/search?entity_alias=${encodeURIComponent(q)}&page=0&size=8`));
      const data = await res.json();
      const ent = Array.isArray(data.entities) ? data.entities[0] : null;
      if (!ent) throw new Error('No entity found');
      setPairEntity(ent);
      setPairError('');
    } catch (err) {
      setPairError(err.message || 'Failed to resolve entity');
      setPairEntity(null);
    }
  };

  const activeTabLabel = useMemo(() => {
    if (activeTab === 'entities') return 'Ingredients';
    if (activeTab === 'molecules') return 'Molecules';
    if (activeTab === 'sources') return 'Sources';
    return 'Pairing';
  }, [activeTab]);

  return (
    <div className="fdb-search-hub">
      <div className="fdb-tabs" role="tablist" aria-label="FlavorDB search tabs">
        {[
          ['entities', 'Ingredients'],
          ['molecules', 'Molecules'],
          ['sources', 'Sources'],
          ['pairing', 'Pairing'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`fdb-tab${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
            role="tab"
            aria-selected={activeTab === key}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="fdb-tab-content">
        {activeTab === 'molecules' && (
          <form
            className="fdb-two-col"
            onSubmit={(e) => {
              e.preventDefault();
              if (hasMoleculeCriteria) runMoleculeSearch();
            }}
          >
            <div>
              <div className="fdb-search-banner">
                <span>Search based on physicochemical properties of Flavor Molecules</span>
              </div>

              <div className="fdb-form-grid">
                <AutocompleteField
                  label="Common Name"
                  value={molForm.common_name}
                  onChange={(v) => setMolForm((s) => ({ ...s, common_name: v }))}
                  placeholder="Common Name"
                  fetchUrl={moleculeAutocomplete('common_name')}
                  onSelect={(item) => setMolForm((s) => ({ ...s, common_name: item.name || item.common_name || '' }))}
                />
                <AutocompleteField
                  label="Functional Group"
                  value={molForm.functional_group}
                  onChange={(v) => setMolForm((s) => ({ ...s, functional_group: v }))}
                  placeholder="Functional Group"
                  fetchUrl={moleculeAutocomplete('functional_group')}
                  onSelect={(item) => setMolForm((s) => ({ ...s, functional_group: item.name || item.label || '' }))}
                />
                <AutocompleteField
                  label="Flavor Profile"
                  value={molForm.flavor_profile}
                  onChange={(v) => setMolForm((s) => ({ ...s, flavor_profile: v }))}
                  placeholder="Flavor Profile"
                  fetchUrl={moleculeAutocomplete('flavor_profile')}
                  onSelect={(item) => setMolForm((s) => ({ ...s, flavor_profile: item.name || item.label || '' }))}
                />
                <AutocompleteField
                  label="FEMA Flavor profile"
                  value={molForm.fema_flavor_profile}
                  onChange={(v) => setMolForm((s) => ({ ...s, fema_flavor_profile: v }))}
                  placeholder="FEMA Flavor"
                  fetchUrl={moleculeAutocomplete('fema_flavor_profile')}
                  onSelect={(item) => setMolForm((s) => ({ ...s, fema_flavor_profile: item.name || item.label || '' }))}
                />
                <AutocompleteField
                  label="FooDB Flavor profile"
                  value={molForm.fooddb_flavor_profile}
                  onChange={(v) => setMolForm((s) => ({ ...s, fooddb_flavor_profile: v }))}
                  placeholder="FooDB Flavor"
                  fetchUrl={moleculeAutocomplete('fooddb_flavor_profile')}
                  onSelect={(item) => setMolForm((s) => ({ ...s, fooddb_flavor_profile: item.name || item.label || '' }))}
                />
                <div className="fdb-range-row">
                  <div className="fdb-field-label">Range of molecular weight (g/mol)</div>
                  <div className="fdb-range-grid">
                    <div>
                      <label className="fdb-mini-label">From</label>
                      <select value={molForm.from} onChange={(e) => setMolForm((s) => ({ ...s, from: e.target.value }))}>
                        {WEIGHT_FROM_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="fdb-mini-label">To</label>
                      <select value={molForm.to} onChange={(e) => setMolForm((s) => ({ ...s, to: e.target.value }))}>
                        {WEIGHT_TO_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="fdb-field-label">Hydrogen bond donors</label>
                  <select className="fdb-select" value={molForm.hbd} onChange={(e) => setMolForm((s) => ({ ...s, hbd: e.target.value }))}>
                    {HBD_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fdb-field-label">Hydrogen bond acceptors</label>
                  <select className="fdb-select" value={molForm.hba} onChange={(e) => setMolForm((s) => ({ ...s, hba: e.target.value }))}>
                    {HBA_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fdb-field-label">Type of molecules</label>
                  <select className="fdb-select" value={molForm.type} onChange={(e) => setMolForm((s) => ({ ...s, type: e.target.value }))}>
                    {TYPE_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn fdb-search-btn"
                disabled={!hasMoleculeCriteria}
              >
                Search
              </button>
            </div>

            <JsmeEditor onSmilesChange={(smiles) => setMolForm((s) => ({ ...s, smiles }))} />
          </form>
        )}

        {activeTab === 'entities' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runEntitySearch(0);
            }}
          >
            <div className="fdb-search-banner">
              <span>Search based on Food Entities or Natural Ingredients</span>
            </div>
            <div className="fdb-form-grid fdb-form-grid-entities">
              <AutocompleteField
                label="Entity/Ingredient Name"
                value={entityQuery}
                onChange={setEntityQuery}
                placeholder="Entity / Ingredient Name"
                fetchUrl={entityAutocomplete('name')}
                onSelect={(item) => {
                  const name = item.name || item.entity_alias_readable || item.entity_alias || '';
                  setEntityQuery(name);
                  if (item.id) {
                    onOpenMolecules({
                      id: item.id,
                      name: name,
                      category: item.category || ''
                    });
                  }
                }}
              />
              <AutocompleteField
                label="Category"
                value={entityCategory}
                onChange={setEntityCategory}
                placeholder="Category"
                fetchUrl={entityAutocomplete('category')}
                onSelect={(item) => setEntityCategory(item.name || '')}
              />
            </div>
            <button type="submit" className="btn fdb-search-btn" disabled={entityLoading}>
              {entityLoading ? 'Searching…' : 'Search'}
            </button>
            {entityError && <div className="fdb-error-box">{entityError}</div>}
            {entitySubmitted && entityResults.length > 0 && (
              <EntityResults
                rows={entityResults}
                totalElements={entityTotal}
                page={entityPage}
                totalPages={entityTotalPages}
                onPageChange={runEntitySearch}
                onOpenMolecules={onOpenMolecules}
                onOpenPairings={onOpenPairings}
              />
            )}
            {entitySubmitted && !entityLoading && !entityResults.length && !entityError && (
              <div className="fdb-empty-box">No entities matched your query.</div>
            )}
          </form>
        )}

        {activeTab === 'sources' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSourceSearch(0);
            }}
          >
            <div className="fdb-search-banner">
              <span>Search based on the Natural Sources of Food Entities or Ingredients</span>
            </div>
            <div className="fdb-form-grid fdb-form-grid-entities">
              <AutocompleteField
                label="Natural Source"
                value={sourceQuery}
                onChange={setSourceQuery}
                placeholder="Natural Source"
                fetchUrl={sourceAutocomplete}
                onSelect={(item) => setSourceQuery(item.name || item.natural_source_name || '')}
              />
            </div>
            <button type="submit" className="btn fdb-search-btn" disabled={sourceLoading}>
              {sourceLoading ? 'Searching…' : 'Search'}
            </button>
            {sourceError && <div className="fdb-error-box">{sourceError}</div>}
            {sourceSubmitted && sourceResults.length > 0 && (
              <SourceResults
                rows={sourceResults}
                totalElements={sourceTotal}
                page={sourcePage}
                totalPages={sourceTotalPages}
                onPageChange={runSourceSearch}
                onOpenMolecules={onOpenMolecules}
                onOpenPairings={onOpenPairings}
              />
            )}
            {sourceSubmitted && !sourceLoading && !sourceResults.length && !sourceError && (
              <div className="fdb-empty-box">No sources matched your query.</div>
            )}
          </form>
        )}

        {activeTab === 'pairing' && (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runPairSearch();
              }}
            >
              <div className="fdb-search-banner">
                <span>Search for Ingredients Entities that share flavor molecules and profiles</span>
              </div>
              <div className="fdb-form-grid fdb-form-grid-entities">
                <AutocompleteField
                  label="Entity Name"
                  value={pairQuery}
                  onChange={setPairQuery}
                  placeholder="Entity Name"
                  fetchUrl={entityAutocomplete('name')}
                  onSelect={(item) => setPairQuery(item.name || '')}
                />
              </div>
              <button type="submit" className="btn fdb-search-btn">
                Pair It
              </button>
              {pairError && <div className="fdb-error-box">{pairError}</div>}
            </form>
            {pairEntity && (
              <div className="fdb-inline-panel">
                <PairingsPage entity={pairEntity} onBackToMolecules={() => setPairEntity(null)} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fdb-active-tab-note">{ }</div>
    </div>
  );
}
