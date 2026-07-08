import React from 'react';
import { CatTag, TableWrap } from './Shared';

// Fields like flavor_profile / fema_flavor_profile store several values per
// molecule joined with '@' (e.g. "odorless@bitter"). Render them as a normal
// comma-separated list instead of leaking the raw delimiter to the user.
export function formatMultiValue(raw) {
  const text = String(raw || '').trim();
  if (!text) return '—';
  const parts = text.split('@').map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function ResultPagination({ page, totalPages, onPageChange }) {
  const safeTotal = Math.max(1, totalPages || 1);
  return (
    <div className="fdb-pagination">
      <button className="pag-btn" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>← Previous</button>
      <span className="snote">Page {page + 1} of {safeTotal}</span>
      <button className="pag-btn" disabled={page >= safeTotal - 1} onClick={() => onPageChange(page + 1)}>Next →</button>
    </div>
  );
}

export function MoleculeResults({ rows = [], totalElements = 0, page = 0, totalPages = 1, onPageChange, onOpenMoleculeDetail }) {
  if (!rows.length) return null;
  return (
    <TableWrap title="Results" meta="Search results for flavor molecules">
      <table className="fdb-table">
        <thead>
          <tr>
            <th>Common Name</th>
            <th>Flavor Profile</th>
            <th>FEMA Profile</th>
            <th>Type</th>
            <th className="right">PubChem ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pubchem_id}>
              <td>
                {onOpenMoleculeDetail ? (
                  <button type="button" className="ent-link" onClick={() => onOpenMoleculeDetail(row)}>
                    {row.name || '—'}
                  </button>
                ) : row.name || '—'}
              </td>
              <td>{formatMultiValue(row.flavor_profile)}</td>
              <td>{formatMultiValue(row.fema_flavor_profile)}</td>
              <td><CatTag category={row.type || '—'} /></td>
              <td className="right mono">{row.pubchem_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fdb-results-summary">Found {totalElements} molecules.</div>
      <ResultPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </TableWrap>
  );
}

export function EntityResults({ rows = [], totalElements = 0, page = 0, totalPages = 1, onPageChange, onOpenMolecules, onOpenPairings }) {
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
              <td className="right"><button className="pair-link" onClick={() => onOpenPairings(ent)}>Pair It</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fdb-results-summary">Found {totalElements} entities.</div>
      <ResultPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </TableWrap>
  );
}

export function SourceResults({ rows = [], totalElements = 0, page = 0, totalPages = 1, onPageChange, onOpenMolecules, onOpenPairings }) {
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
              <td className="right"><button className="pair-link" onClick={() => onOpenPairings(ent)}>Pair It</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fdb-results-summary">Found {totalElements} entities for this source.</div>
      <ResultPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </TableWrap>
  );
}
