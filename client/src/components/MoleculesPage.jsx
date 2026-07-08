import React, { useEffect, useMemo, useState } from 'react';
import { apiPath } from '../apiPath';
import { Spinner, CatTag, RarityChip, TableWrap, ImpBar, InfoTip } from './Shared';

const ROWS_PER_PAGE = 10;

export default function MoleculesPage({ entity, onBack, onPairIt, onOpenMolecule }) {
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!entity) return;
    setRanked([]);
    setLoading(true);
    setError(null);
    setProgress(null);
    setPage(0);

    const ctrl = new AbortController();
    fetch(apiPath(`/api/molecules/${entity.id}`), { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRanked(data.ranked || []);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [entity?.id]);

  if (!entity) return null;

  const maxImp = ranked.length ? ranked[0].importance : 1;
  const uniqueCount = ranked.filter((r) => r.df === 1).length;
  const rareCount = ranked.filter((r) => r.df > 1 && r.df <= 5).length;
  const totalScore = ranked.reduce((s, r) => s + r.importance, 0);

  const pageCount = Math.max(1, Math.ceil(ranked.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * ROWS_PER_PAGE;
  const visibleRows = ranked.slice(startIndex, startIndex + ROWS_PER_PAGE);

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

  return (
    <div>
      <div className="fdb-breadcrumb">
        <span className="cur">Browse</span>
        <span className="sep">›</span>
        <span className="cur">{entity.name}</span>
        <span className="sep">›</span>
        <span>Flavor Molecules</span>
      </div>

      <div className="fdb-nav-row">
        <button className="btn btn-back" onClick={onBack}>← Back</button>
        <button className="btn btn-green" onClick={onPairIt}>Pair It →</button>
      </div>

      <div className="fdb-page-header">
        <h2>{entity.name}</h2>
        <div className="meta">
          Category: <CatTag category={entity.category} />
        </div>
      </div>

      {loading && <Spinner text={`Loading flavor molecules for ${entity.name}…`} progress={progress} />}
      {error && <p style={{ color: '#c62828', padding: '0.5rem 0' }}>Error: {error}</p>}

      {!loading && ranked.length > 0 && (
        <>
          <div className="fdb-stats">
            <div className="fdb-stat-box">
              <div className="fdb-stat-val">{ranked.length}</div>
              <div className="fdb-stat-label">Total molecules</div>
            </div>
            <div className="fdb-stat-box">
              <div className="fdb-stat-val">{uniqueCount}</div>
              <div className="fdb-stat-label">Unique to {entity.name}</div>
            </div>
            <div className="fdb-stat-box">
              <div className="fdb-stat-val">{rareCount}</div>
              <div className="fdb-stat-label">
                Rare
                <InfoTip
                  label="What does Rare mean?"
                  text="A molecule is counted as Rare when it appears in 5 or fewer entities/ingredients."
                />
              </div>
            </div>
            <div className="fdb-stat-box">
              <div className="fdb-stat-val">{totalScore.toFixed(2)}</div>
              <div className="fdb-stat-label">
                Total rarity score
                <InfoTip
                  label="What is the Total Rarity Score?"
                  text="Total Rarity Score captures the extent to which this entity/ingredient is built from molecules that are rare across all entities/ingredients. It is the sum of each molecule's rarity weight over all molecules in this entity/ingredient: Score = Σ 1/df(m), where df(m) is the number of entities/ingredients that contain molecule m."
                />
              </div>
            </div>
          </div>

          <TableWrap title={`Flavor Molecules in ${entity.name}`}>
            <table className="fdb-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Common Name</th>
                  <th>PubChem ID</th>
                  <th>Present In</th>
                  <th className="right">Relevance Score</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const idx = startIndex + i + 1;
                  const pct = maxImp ? (row.importance / maxImp) * 100 : 0;
                  const topStyle = idx <= 3 ? { fontWeight: 700, color: '#e65100' } : {};
                  return (
                    <tr key={row.pubchem_id}>
                      <td style={{ width: 36, textAlign: 'center', ...topStyle }}>{idx}</td>
                      <td>
                        {onOpenMolecule ? (
                          <button
                            type="button"
                            className="ent-link"
                            onClick={() => onOpenMolecule(row)}
                          >
                            {row.name}
                          </button>
                        ) : (
                          <span className="ent-link">{row.name}</span>
                        )}
                        <RarityChip rarity={row.rarity} />
                      </td>
                      <td className="muted mono">{row.pubchem_id}</td>
                      <td className="muted">{row.df} ingredient{row.df !== 1 ? 's' : ''}</td>
                      <td className="right" style={{ whiteSpace: 'nowrap' }}>
                        <ImpBar pct={pct} />
                        <span className="mono" style={{ color: '#1565c0', fontWeight: 600 }}>
                          {row.importance.toFixed(6)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pageCount > 1 && (
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
            )}
          </TableWrap>
        </>
      )}
    </div>
  );
}
