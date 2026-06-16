import React, { useEffect, useState } from 'react';
import { Spinner, CatTag, RarityChip, TableWrap, ImpBar } from './Shared';

export default function MoleculesPage({ entity, onBack, onPairIt, onOpenMolecule }) {
  const [ranked,  setRanked]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [progress,setProgress]= useState(null);

  useEffect(() => {
    if (!entity) return;
    setRanked([]); setLoading(true); setError(null); setProgress(null);

    const ctrl = new AbortController();
    fetch(`/api/molecules/${entity.id}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setRanked(data.ranked || []);
      })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [entity?.id]);

  if (!entity) return null;

  const maxImp = ranked.length ? ranked[0].importance : 1;
  const uniqueCount = ranked.filter(r => r.df === 1).length;
  const rareCount   = ranked.filter(r => r.df > 1 && r.df <= 5).length;
  const totalScore  = ranked.reduce((s, r) => s + r.importance, 0);

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
          &nbsp;·&nbsp; Entity ID: {entity.id}
        </div>
      </div>

      {loading && <Spinner text={`Loading flavor molecules for ${entity.name}…`} progress={progress} />}
      {error   && <p style={{ color: '#c62828', padding: '0.5rem 0' }}>Error: {error}</p>}

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
              <div className="fdb-stat-label">Rare (df≤5)</div>
            </div>
            <div className="fdb-stat-box">
              <div className="fdb-stat-val">{totalScore.toFixed(2)}</div>
              <div className="fdb-stat-label">Total rarity score</div>
            </div>
          </div>

          <TableWrap
            title={`Flavor Molecules in ${entity.name}`}
            meta="Ranked by importance = 1/df(m)"
          >
            <table className="fdb-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Common Name</th>
                  <th>PubChem ID</th>
                  <th>Frequency</th>
                  <th className="right">Relevance Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row, i) => {
                  const idx = i + 1;
                  const pct = maxImp ? (row.importance / maxImp * 100) : 0;
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
          </TableWrap>

          <div className="snote">
            Importance = 1/df(m) · df(m) = number of ingredients containing that molecule
          </div>
        </>
      )}
    </div>
  );
}
