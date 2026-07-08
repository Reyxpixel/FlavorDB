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

// Turns an '@'-delimited multi-value field (e.g. "odorless@bitter") into a
// clean, human-readable "odorless, bitter". Returns '—' when empty.
export function formatTags(value) {
  if (!value) return '—';
  const parts = String(value)
    .split('@')
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

// A small "?" badge that reveals an explanatory message on hover/focus.
export function InfoTip({ text, label = 'More information' }) {
  return (
    <span className="fdb-infotip" tabIndex={0} role="img" aria-label={label}>
      <span className="fdb-infotip-mark" aria-hidden="true">?</span>
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
