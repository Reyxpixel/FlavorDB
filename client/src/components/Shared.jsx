import React, { useMemo, useState } from 'react';
import { catColor } from '../categories';

export function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

// The "Search:" box every results table gets, filtering whatever rows are
// already loaded client-side - same contains() matching used everywhere
// else in the app (autocomplete, common_name molecule search, etc).
export function TableSearchBox({ value, onChange, placeholder = 'Search results…' }) {
  return (
    <div className="fdb-table-search">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Spinner({ text = 'Loading…', progress = null }) {
  return (
    <div>
      <div className="fdb-spinner">
        <div className="spinner-ring" />
        <span>{text}</span>
      </div>
      {progress !== null && (
        <div className="fdb-progress">
          <div className="fdb-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

export function CatTag({ category }) {
  const color = catColor(category);
  return (
    <span className="cat-tag" style={{ background: color }}>
      {category || '—'}
    </span>
  );
}

export function RarityChip({ rarity }) {
  if (!rarity) return null;
  return <span className={`rarity-chip ${rarity.cls}`}>{rarity.label}</span>;
}

export function Expander({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="expander">
      <div className="expander-header" onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        {title}
      </div>
      {open && <div className="expander-body">{children}</div>}
    </div>
  );
}

export function TableWrap({ title, meta, search, children }) {
  return (
    <div className="fdb-table-wrap">
      {(title || meta || search) && (
        <div className="fdb-table-header">
          {title && <span className="fdb-table-title">{title}</span>}
          <div className="fdb-table-header-right">
            {meta && <span className="fdb-table-meta">{meta}</span>}
            {search}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}



export function formatTags(value) {
  if (!value) return '—';
  const parts = String(value)
    .split('@')
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}


export function InfoTip({ text, label = 'More information' }) {
  return (
    <span className="fdb-infotip" tabIndex={0} role="img" aria-label={label}>
      <svg className="fdb-infotip-mark" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>
      <span className="fdb-infotip-bubble" role="tooltip">{text}</span>
    </span>
  );
}

export function ImpBar({ pct }) {
  return (
    <span className="imp-bar-wrap">
      <span className="imp-bar-fill" style={{ display: 'block', width: `${pct.toFixed(1)}%` }} />
    </span>
  );
}

export function PairBar({ pct }) {
  return (
    <span className="pair-bar-wrap">
      <span className="pair-bar-fill" style={{ display: 'block', width: `${pct.toFixed(1)}%` }} />
    </span>
  );
}

// Shared numbered pager (Previous / 1 2 3 … N / Next) used by every
// paginated result table, so ingredient molecule lists, flavor molecule
// search, entity search, and source search all page the same way.
export function Pagination({ page, totalPages, onPageChange, totalElements, pageSize }) {
  const pageCount = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(page || 0, 0), pageCount - 1);
  const hasCounts = totalElements != null && pageSize != null;
  const showingFrom = hasCounts && totalElements > 0 ? safePage * pageSize + 1 : 0;
  const showingTo = hasCounts ? Math.min((safePage + 1) * pageSize, totalElements) : 0;

  const items = useMemo(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => ({ type: 'page', page: i }));
    }

    const out = [{ type: 'page', page: 0 }];

    if (safePage <= 2) {
      for (let p = 1; p <= Math.min(4, pageCount - 2); p++) {
        out.push({ type: 'page', page: p });
      }
      if (pageCount > 5) out.push({ type: 'ellipsis' });
      out.push({ type: 'page', page: pageCount - 1 });
      return out;
    }

    if (safePage >= pageCount - 3) {
      out.push({ type: 'ellipsis' });
      for (let p = Math.max(1, pageCount - 5); p <= pageCount - 2; p++) {
        out.push({ type: 'page', page: p });
      }
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

  if (pageCount <= 1 && !hasCounts) return null;

  return (
    <div className="fdb-pagination-footer">
      {hasCounts && (
        <div className="fdb-showing-entries">
          Showing {showingFrom} to {showingTo} of {totalElements} entries
        </div>
      )}

      {pageCount > 1 && (
        <div className="fdb-pagination fdb-pagination-centered">
          <button
            type="button"
            className="pag-btn"
            disabled={safePage <= 0}
            onClick={() => onPageChange(Math.max(0, safePage - 1))}
          >
            ← Previous
          </button>

          {items.map((item, idx) =>
            item.type === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="pag-ellipsis">…</span>
            ) : (
              <button
                key={item.page}
                type="button"
                className={`pag-btn${item.page === safePage ? ' active' : ''}`}
                onClick={() => onPageChange(item.page)}
              >
                {item.page + 1}
              </button>
            )
          )}

          <button
            type="button"
            className="pag-btn"
            disabled={safePage >= pageCount - 1}
            onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
