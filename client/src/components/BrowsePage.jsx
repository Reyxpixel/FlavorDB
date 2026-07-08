import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiPath } from '../apiPath';
import { CatTag, TableWrap } from './Shared';

const AUTOCOMPLETE_LIMIT = 64;
const AUTOCOMPLETE_FETCH_SIZE = 400;

export default function BrowsePage({ onOpenMolecules, onOpenPairings }) {
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

  function handleSearchClick() {
    doSearch(query, 0);
  }

  return (
    <div>
      {/* Search box */}
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
            <button className="btn" onClick={handleSearchClick} disabled={loading}>
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

      {/* Welcome */}
      {!submitted && !loading && !notFound && (
        <div className="fdb-welcome">
          <div className="icon">🌶</div>
          <h2>Search for an ingredient to get started!</h2>
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div className="fdb-not-found">
          <h2>Oops, we couldn't find that.</h2>
          <p>No ingredients matched your search.</p>
          <span className="query-tag">"{query}"</span>
        </div>
      )}

      {/* Results */}
      {entities.length > 0 && (
        <>
          <div className="fdb-result-info">
            We found <b>{totalElements != null ? totalElements + ' ' : ''}results</b> for your query: entity: <b>{submitted}</b>
          </div>

          <TableWrap
            title="Results"
            meta="Click ingredient name to view molecules · Pair It to jump straight to pairings"
          >
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
                      <button className="pair-link" onClick={() => onOpenPairings(ent)}>
                        Pair It
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          {/* Pagination */}
          <div className="fdb-pagination">
            <button className="pag-btn" disabled={page <= 0}
                    onClick={() => doSearch(submitted, page - 1)}>
              ← Previous
            </button>
            {totalPages && page < totalPages - 1 && (
              <button className="pag-btn" onClick={() => doSearch(submitted, page + 1)}>
                Next →
              </button>
            )}
            {totalPages && (
              <span className="snote" style={{ marginLeft: '0.5rem' }}>
                Page {page + 1} of {totalPages}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
