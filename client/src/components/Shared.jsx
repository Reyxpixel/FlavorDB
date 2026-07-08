import React, { useState } from 'react';
import { catColor } from '../categories';

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

export function TableWrap({ title, meta, children }) {
  return (
    <div className="fdb-table-wrap">
      {(title || meta) && (
        <div className="fdb-table-header">
          {title && <span className="fdb-table-title">{title}</span>}
          {meta  && <span className="fdb-table-meta">{meta}</span>}
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
