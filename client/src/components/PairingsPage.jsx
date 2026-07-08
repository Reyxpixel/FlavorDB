import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Spinner, CatTag, RarityChip, PairBar, Expander } from './Shared';
import { catColor } from '../categories';

const ROWS_PER_PAGE = 10;

export default function PairingsPage({ entity, onBackToMolecules }) {
  const [pairRows, setPairRows] = useState([]);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const esRef = useRef(null);

  useEffect(() => {
    if (!entity) return;

    setPairRows([]);
    setPage(0);
    setDone(false);
    setError(null);
    setStatus('Connecting…');
    setProgress(null);

    const url = `/api/pairings/${entity.id}?entityName=${encodeURIComponent(entity.name)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'status') {
          setStatus(msg.msg);
        }
        if (msg.type === 'progress') {
          setProgress(msg.done / msg.total);
        }
        if (msg.type === 'done') {
          setPairRows(msg.pairRows || []);
          setDone(true);
          setStatus('');
          es.close();
        }
        if (msg.type === 'error') {
          setError(msg.msg);
          es.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setError('Connection error. Is the server running?');
      es.close();
    };

    return () => es.close();
  }, [entity?.id, entity?.name]);

  if (!entity) return null;

  const maxScore = pairRows.length ? pairRows[0].score : 1;
  const pageCount = Math.max(1, Math.ceil(pairRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * ROWS_PER_PAGE;
  const visibleRows = pairRows.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const paginationItems = useMemo(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => ({ type: 'page', page: i }));
    }

    const items = [{ type: 'page', page: 0 }];

    if (safePage <= 2) {
      for (let p = 1; p <= Math.min(4, pageCount - 2); p++) {
        items.push({ type: 'page', page: p });
      }
      if (pageCount > 5) items.push({ type: 'ellipsis' });
      items.push({ type: 'page', page: pageCount - 1 });
      return items;
    }

    if (safePage >= pageCount - 3) {
      items.push({ type: 'ellipsis' });
      for (let p = Math.max(1, pageCount - 5); p <= pageCount - 2; p++) {
        items.push({ type: 'page', page: p });
      }
      items.push({ type: 'page', page: pageCount - 1 });
      return items;
    }

    items.push({ type: 'ellipsis' });
    items.push({ type: 'page', page: safePage - 1 });
    items.push({ type: 'page', page: safePage });
    items.push({ type: 'page', page: safePage + 1 });
    items.push({ type: 'ellipsis' });
    items.push({ type: 'page', page: pageCount - 1 });

    return items;
  }, [pageCount, safePage]);

  const openMoleculesPage = (row) => {
    const params = new URLSearchParams({
      action: 'open',
      eid: String(row.id),
      ename: row.name || '',
      ecat: row.category || '',
    });

    window.location.href = `?${params.toString()}`;
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="fdb-breadcrumb">
        <span className="cur">Browse</span>
        <span className="sep">›</span>
        <span>{entity.name}</span>
        <span className="sep">›</span>
        <span className="cur">Flavor Pairing</span>
      </div>

      {/* Nav */}
      <div className="fdb-nav-row">
        <button className="btn btn-back" onClick={onBackToMolecules}>
          ← Molecules
        </button>
      </div>

      {/* Header */}
      <div className="fdb-page-header">
        <h2>Flavor Pairing Analysis — {entity.name}</h2>
        <div className="meta">
          Category: <CatTag category={entity.category} />
          &nbsp;·&nbsp; Pairing score over shared molecules
          &nbsp;·&nbsp; scored against all ~936 FlavorDB ingredients
        </div>
      </div>

      {/* Loading */}
      {!done && !error && (
        <Spinner text={status || 'Computing pairings…'} progress={progress} />
      )}
      {error && (
        <p style={{ color: '#c62828', padding: '0.5rem 0' }}>
          Error: {error}
        </p>
      )}

      {/* Results */}
      {pairRows.length > 0 && (
        <>
          <div
            className="fdb-table-wrap"
            style={{ marginBottom: 0, borderBottom: 'none' }}
          >
            <div className="fdb-table-header">
              <span className="fdb-table-title">
                Ingredients sharing flavor molecules with {entity.name}
              </span>
              <span className="fdb-table-meta">
                Showing {startIndex + 1}-{Math.min(startIndex + ROWS_PER_PAGE, pairRows.length)} of {pairRows.length} · Only ingredients with ≥1 shared molecule shown
              </span>
            </div>
            <table className="fdb-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 36 }} />
                <col />
                <col style={{ width: 130 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 180 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Entity Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Shared Molecules</th>
                  <th className="right">Pairing Score</th>
                </tr>
              </thead>
            </table>
          </div>

          {visibleRows.map((row, i) => {
            const idx = startIndex + i + 1;
            const scorePct = maxScore ? (row.score / maxScore) * 100 : 0;
            const pColor = catColor(row.category);
            const catD = row.category
              ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
              : '—';
            const topStyle =
              idx <= 3 ? { fontWeight: 700, color: '#e65100' } : {};

            return (
              <div key={row.id} className="pair-row-wrap">
                <table className="fdb-table" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 36 }} />
                    <col />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 180 }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', ...topStyle }}>
                        {idx}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ent-link"
                          onClick={() => openMoleculesPage(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {row.name}
                        </button>
                      </td>
                      <td>
                        <span className="cat-tag" style={{ background: pColor }}>
                          {catD}
                        </span>
                      </td>
                      <td className="muted" style={{ textAlign: 'center' }}>
                        {row.sharedCount}
                      </td>
                      <td className="right" style={{ whiteSpace: 'nowrap' }}>
                        <PairBar pct={scorePct} />
                        <span
                          className="mono"
                          style={{ color: '#2e7d32', fontWeight: 600 }}
                        >
                          {row.score.toFixed(6)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {row.sharedRows && row.sharedRows.length > 0 && (
                  <div style={{ padding: '0 0.9rem 0.5rem' }}>
                    <Expander
                      title={`Shared molecules with ${row.name} (${row.sharedCount})`}
                    >
                      {row.sharedRows.map((sr, si) => (
                        <p key={sr.pubchem_id}>
                          {si + 1}. <strong>{sr.name}</strong>
                          <RarityChip rarity={sr.rarity} />
                          &nbsp; PubChem <code>{sr.pubchem_id}</code>
                          &nbsp;· df={sr.df}
                          &nbsp;· importance=
                          <code>{sr.importance.toFixed(8)}</code>
                        </p>
                      ))}
                    </Expander>
                  </div>
                )}
              </div>
            );
          })}

          <div className="fdb-pagination fdb-pagination-centered">
            <button
              className="pag-btn"
              disabled={safePage <= 0}
              onClick={() => setPage(Math.max(0, safePage - 1))}
            >
              ← Previous
            </button>

            {paginationItems.map((item, idx) => {
              if (item.type === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="pag-ellipsis">
                    …
                  </span>
                );
              }

              const isActive = item.page === safePage;
              return (
                <button
                  key={item.page}
                  className={`pag-btn${isActive ? ' active' : ''}`}
                  onClick={() => setPage(item.page)}
                >
                  {item.page + 1}
                </button>
              );
            })}

            <button
              className="pag-btn"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {done && pairRows.length === 0 && (
        <p style={{ color: '#555', padding: '1rem 0' }}>
          No pairings with shared molecules found for this ingredient.
        </p>
      )}
    </div>
  );
}
