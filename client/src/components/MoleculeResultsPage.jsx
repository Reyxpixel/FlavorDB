import React, { useEffect, useState } from 'react';
import { apiPath } from '../apiPath';
import { Spinner, TableWrap, formatTags, Pagination, TableSearchBox, normalizeText } from './Shared';

const PAGE_SIZE = 20;


function describeQuery(query) {
  const labels = {
    common_name: 'Common Name',
    functional_group: 'Functional Group',
    flavor_profile: 'Flavor Profile',
    fema_flavor_profile: 'FEMA Flavor Profile',
    fooddb_flavor_profile: 'FooDB Flavor Profile',
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

function matchesSearch(row, q) {
  if (!q) return true;
  if (normalizeText(row.name).includes(q)) return true;
  if (normalizeText(row.flavor_profile).includes(q)) return true;
  if (String(row.pubchem_id || '').includes(q)) return true;
  return false;
}

export default function MoleculeResultsPage({ query, onBack, onOpenMolecule }) {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSearchQuery('');
    setPage(0);

    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v !== '' && v != null) params.set(k, v);
    });

    // Fetches the full matching set in one call rather than one page at a
    // time - pagination and the search box below both operate on it
    // entirely client-side, so "search within results" actually searches
    // every match, not just whatever page happens to be on screen.
    fetch(apiPath(`/api/flavor-molecules/search?${params.toString()}`))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Search failed');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setAllRows(data.molecules || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Search failed');
        setAllRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const q = normalizeText(searchQuery);
  const filteredRows = q ? allRows.filter((row) => matchesSearch(row, q)) : allRows;

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * PAGE_SIZE;
  const visibleRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

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

      {!loading && !error && allRows.length === 0 && (
        <div className="fdb-empty-box">No molecules matched your query.</div>
      )}

      {!loading && !error && allRows.length > 0 && (
        <TableWrap
          title="Results"
          meta={`Found ${allRows.length} molecules`}
          search={<TableSearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search these results…" />}
        >
          {filteredRows.length === 0 ? (
            <div className="fdb-empty-box">No results match "{searchQuery}".</div>
          ) : (
            <>
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
                  {visibleRows.map((row) => (
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

              <Pagination
                page={safePage}
                totalPages={pageCount}
                onPageChange={setPage}
                totalElements={filteredRows.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </TableWrap>
      )}
    </div>
  );
}
