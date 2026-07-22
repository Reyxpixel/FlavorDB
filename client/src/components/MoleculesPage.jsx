import React, { useEffect, useState } from 'react';
import { apiPath } from '../apiPath';
import { Spinner, CatTag, RarityChip, TableWrap, ImpBar, InfoTip, Pagination } from './Shared';

const ROWS_PER_PAGE = 10;

export default function MoleculesPage({ entity, onBack, onPairIt, onOpenMolecule }) {
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [page, setPage] = useState(0);
  const [images, setImages] = useState(null);

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

  useEffect(() => {
    if (!entity?.name) return;
    setImages(null);
    const ctrl = new AbortController();
    fetch(apiPath(`/api/entity-image/${encodeURIComponent(entity.name)}`), { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => setImages(data?.imageUrl ? data : null))
      .catch((e) => {
        if (e.name !== 'AbortError') setImages(null);
      });
    return () => ctrl.abort();
  }, [entity?.name]);

  if (!entity) return null;

  const maxImp = ranked.length ? ranked[0].importance : 1;
  const uniqueCount = ranked.filter((r) => r.df === 1).length;
  const rareCount = ranked.filter((r) => r.df > 1 && r.df <= 5).length;
  const totalScore = ranked.reduce((s, r) => s + r.importance, 0);

  const pageCount = Math.max(1, Math.ceil(ranked.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * ROWS_PER_PAGE;
  const visibleRows = ranked.slice(startIndex, startIndex + ROWS_PER_PAGE);

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

      {images && images.imageUrl && (
        <div className="entity-image-row">
          <div className="entity-image-card">
            <img
              src={images.imageUrl}
              alt={entity.name}
              onError={(e) => {
                const placeholder = 'https://cosylab.iiitd.edu.in/flavordb2/static/images/placeholder.png';
                if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder;
              }}
            />
            <div className="entity-image-caption">{entity.name}</div>
          </div>

          {images.naturalSourceImageUrl && (
            <div className="entity-image-card">
              <img
                src={images.naturalSourceImageUrl}
                alt={images.naturalSourceName || 'Natural source'}
                onError={(e) => {
                  const placeholder = 'https://cosylab.iiitd.edu.in/flavordb2/static/images/placeholder.png';
                  if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder;
                }}
              />
              <div className="entity-image-caption">
                Natural Source:{' '}
                {images.naturalSourceUrl ? (
                  <a href={images.naturalSourceUrl} target="_blank" rel="noreferrer">
                    {images.naturalSourceName || 'Link'}
                  </a>
                ) : (
                  images.naturalSourceName || '—'
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
                  <th className="right">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      Relevance Score
                      <span className="fdb-infotip">
                        <svg className="fdb-infotip-mark" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                        </svg>
                        <span className="fdb-infotip-bubble fdb-infotip-bubble-right" style={{ fontWeight: 'normal', textTransform: 'none', textAlign: 'left' }}>
                          The Relevance Score of a molecule captures its uniqueness. It is calculated as the inverse of its document frequency: 1/df(m), where df(m) is the total number of ingredients that contain this molecule.
                        </span>
                      </span>
                    </div>
                  </th>
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
                      <td>
                        <a 
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${row.pubchem_id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="ent-link"
                          style={{ fontWeight: 'normal', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {row.pubchem_id}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </td>
                      <td className="muted">
                        {onOpenMolecule ? (
                          <button
                            type="button"
                            className="ent-link"
                            style={{ fontWeight: 'normal', textAlign: 'left' }}
                            onClick={() => onOpenMolecule(row, { scrollTo: 'entities' })}
                          >
                            {row.df} ingredient{row.df !== 1 ? 's' : ''}
                          </button>
                        ) : (
                          `${row.df} ingredient${row.df !== 1 ? 's' : ''}`
                        )}
                      </td>
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

            <Pagination
              page={safePage}
              totalPages={pageCount}
              onPageChange={setPage}
              totalElements={ranked.length}
              pageSize={ROWS_PER_PAGE}
            />
          </TableWrap>
        </>
      )}
    </div>
  );
}
