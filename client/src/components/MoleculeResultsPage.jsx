import React, { useEffect, useState } from 'react';
import { apiPath } from '../apiPath';
import { Spinner, TableWrap, formatTags } from './Shared';

const PAGE_SIZE = 20;


function describeQuery(query) {
  const labels = {
    common_name: 'Common Name',
    functional_group: 'Functional Group',
    flavor_profile: 'Flavor Profile',
    fema_flavor_profile: 'FEMA Flavor Profile',
    type: 'Type',
    from: 'Weight from',
    to: 'Weight to',
    hbd: 'H-bond donors',
    hba: 'H-bond acceptors',
    smiles: 'SMILES',
  };
  const parts = Object.entries(query || {})
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${labels[k] || k}: ${v}`);
  return parts.length ? parts.join(' · ') : 'All molecules';
}

export default function MoleculeResultsPage({ query, onBack, onOpenMolecule }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v !== '' && v != null) params.set(k, v);
    });
    params.set('page', String(page));
    params.set('size', String(PAGE_SIZE));

    fetch(apiPath(`/api/flavor-molecules/search?${params.toString()}`))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Search failed');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data.molecules || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Search failed');
        setRows([]);
        setTotalElements(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, page]);

  const safeTotal = Math.max(1, totalPages || 1);

  return (
    <div>
      <div className="fdb-breadcrumb">
        <span className="cur">Search</span>
        <span className="sep">›</span>
        <span>Flavor Molecules</span>
      </div>

      <div className="fdb-nav-row">
        <button className="btn btn-back" onClick={onBack}>← Back</button>
      </div>

      <div className="fdb-page-header">
        <h2>Flavor Molecules</h2>
        <div className="meta">{describeQuery(query)}</div>
      </div>

      {loading && <Spinner text="Searching flavor molecules…" />}
      {error && <div className="fdb-error-box">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="fdb-empty-box">No molecules matched your query.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <TableWrap title="Results" meta={`Found ${totalElements} molecules`}>
          <table className="fdb-table">
            <thead>
              <tr>
                <th>Common Name</th>
                <th>PubChem ID</th>
                <th>Flavor Profile</th>
                <th className="right">More Info.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.pubchem_id}>
                  <td>
                    {onOpenMolecule ? (
                      <button type="button" className="ent-link" onClick={() => onOpenMolecule(row)}>
                        {row.name || '—'}
                      </button>
                    ) : (
                      row.name || '—'
                    )}
                  </td>
                  <td>
                    <a
                      className="ent-link mono"
                      href={`https://pubchem.ncbi.nlm.nih.gov/compound/${row.pubchem_id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.pubchem_id}
                    </a>
                  </td>
                  <td>{formatTags(row.flavor_profile)}</td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn fdb-moreinfo-btn"
                      onClick={() => onOpenMolecule && onOpenMolecule(row)}
                    >
                      More info.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {safeTotal > 1 && (
            <div className="fdb-pagination">
              <button className="pag-btn" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                ← Previous
              </button>
              <span className="snote">Page {page + 1} of {safeTotal}</span>
              <button
                className="pag-btn"
                disabled={page >= safeTotal - 1}
                onClick={() => setPage((p) => Math.min(safeTotal - 1, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </TableWrap>
      )}
    </div>
  );
}
