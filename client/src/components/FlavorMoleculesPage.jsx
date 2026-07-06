
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiPath } from '../apiPath';
import { Spinner, TableWrap } from './Shared';
import MoleculeDetailPage from './MoleculeDetailPage';

const ROWS_PER_PAGE = 24;
const AUTOCOMPLETE_DEBOUNCE_MS = 220;
const AUTOCOMPLETE_LIMIT = 12;

const MW_OPTIONS = ['Default', '0', '100', '120', '140', '160', '180', '200', '250', '300'];
const HBD_OPTIONS = ['Default', '0', '1', '2-3', '0-5', '6+'];
const HBA_OPTIONS = ['Default', '0', '1', '2', '4', '5-6', '0-10', '7+'];
const TYPE_OPTIONS = ['All', 'Natural', 'Synthetic', 'Unknown'];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function splitValues(value) {
  return String(value || '')
    .split(/[|;,/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page') || 'search';

  const form = {
    commonName: params.get('commonName') || '',
    functionalGroup: params.get('functionalGroup') || '',
    flavorProfile: params.get('flavorProfile') || '',
    femaFlavorProfile: params.get('femaFlavorProfile') || '',
    mwFrom: params.get('mwFrom') || 'Default',
    mwTo: params.get('mwTo') || 'Disabled',
    hbd: params.get('hbd') || 'Default',
    hba: params.get('hba') || 'Default',
    moleculeType: params.get('moleculeType') || 'All',
    structure: params.get('structure') || '',
    pageIndex: Number.parseInt(params.get('pageIndex') || '0', 10) || 0,
  };

  const molecule = {
    pubchem_id: Number.parseInt(params.get('pubchem') || '0', 10) || null,
    name: params.get('moleculeName') || '',
    df: Number.parseInt(params.get('df') || '1', 10) || 1,
    importance: Number.parseFloat(params.get('importance') || '1') || 1,
  };

  const context = {
    label: params.get('contextLabel') || 'Flavor Molecules',
    kind: params.get('contextKind') || 'search',
  };

  return { page, form, molecule, context, urlKey: window.location.search };
}

function buildUrl(route) {
  const params = new URLSearchParams();
  params.set('page', route.page);

  const form = route.form || {};
  if (form.commonName) params.set('commonName', form.commonName);
  if (form.functionalGroup) params.set('functionalGroup', form.functionalGroup);
  if (form.flavorProfile) params.set('flavorProfile', form.flavorProfile);
  if (form.femaFlavorProfile) params.set('femaFlavorProfile', form.femaFlavorProfile);
  if (form.mwFrom && form.mwFrom !== 'Default') params.set('mwFrom', form.mwFrom);
  if (form.mwTo && form.mwTo !== 'Disabled') params.set('mwTo', form.mwTo);
  if (form.hbd && form.hbd !== 'Default') params.set('hbd', form.hbd);
  if (form.hba && form.hba !== 'Default') params.set('hba', form.hba);
  if (form.moleculeType && form.moleculeType !== 'All') params.set('moleculeType', form.moleculeType);
  if (form.structure) params.set('structure', form.structure);
  if (Number.isFinite(form.pageIndex) && form.pageIndex > 0) params.set('pageIndex', String(form.pageIndex));

  if (route.molecule?.pubchem_id != null) params.set('pubchem', String(route.molecule.pubchem_id));
  if (route.molecule?.name) params.set('moleculeName', route.molecule.name);
  if (route.molecule?.df != null) params.set('df', String(route.molecule.df));
  if (route.molecule?.importance != null) params.set('importance', String(route.molecule.importance));

  if (route.context?.label) params.set('contextLabel', route.context.label);
  if (route.context?.kind) params.set('contextKind', route.context.kind);

  return `?${params.toString()}`;
}

function formatQuerySummary(form) {
  const parts = [];
  if (form.commonName) parts.push(`common name: ${form.commonName}`);
  if (form.functionalGroup) parts.push(`functional group: ${form.functionalGroup}`);
  if (form.flavorProfile) parts.push(`flavor profile: ${form.flavorProfile}`);
  if (form.femaFlavorProfile) parts.push(`FEMA flavor profile: ${form.femaFlavorProfile}`);
  if ((form.mwFrom && form.mwFrom !== 'Default') || (form.mwTo && form.mwTo !== 'Disabled')) {
    const from = form.mwFrom && form.mwFrom !== 'Default' ? form.mwFrom : 'min';
    const to = form.mwTo && form.mwTo !== 'Disabled' ? form.mwTo : 'max';
    parts.push(`molecular weight: ${from}–${to}`);
  }
  if (form.hbd && form.hbd !== 'Default') parts.push(`hydrogen bond donors: ${form.hbd}`);
  if (form.hba && form.hba !== 'Default') parts.push(`hydrogen bond acceptors: ${form.hba}`);
  if (form.moleculeType && form.moleculeType !== 'All') parts.push(`type: ${form.moleculeType}`);
  if (form.structure) parts.push('structure query');
  return parts.length ? parts.join(' · ') : 'All molecules';
}

function parseBucket(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'Default' || raw === 'Disabled') return null;
  if (/^\d+\+$/.test(raw)) {
    const min = Number.parseFloat(raw.replace('+', ''));
    return { min, max: Infinity };
  }
  if (/^\d+\s*-\s*\d+$/.test(raw)) {
    const [min, max] = raw.split('-').map((n) => Number.parseFloat(n.trim()));
    return { min, max };
  }
  const exact = Number.parseFloat(raw);
  if (Number.isFinite(exact)) return { min: exact, max: exact };
  return null;
}

function matchesBucket(value, bucketQuery) {
  const bucket = parseBucket(bucketQuery);
  if (!bucket) return true;
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return false;
  return num >= bucket.min && num <= bucket.max;
}

function matchesWeight(value, from, to) {
  const minBucket = parseBucket(from);
  const maxBucket = parseBucket(to);
  const min = minBucket ? minBucket.min : null;
  const max = maxBucket ? maxBucket.max : null;
  if (min == null && max == null) return true;

  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return false;
  if (min != null && num < min) return false;
  if (max != null && num > max) return false;
  return true;
}

function matchesString(value, query) {
  const q = normalizeText(query);
  if (!q) return true;
  return normalizeText(value).includes(q);
}

function matchesType(value, query) {
  const q = normalizeText(query);
  if (!q || q === 'all') return true;
  const haystack = normalizeText(value);
  if (q === 'natural') return haystack.includes('natural');
  if (q === 'synthetic') return haystack.includes('synthetic');
  if (q === 'unknown') return !haystack || haystack.includes('unknown');
  return haystack.includes(q);
}

function matchesStructure(record, query) {
  const q = normalizeText(query);
  if (!q) return true;
  return normalizeText(record.smiles).includes(q) || normalizeText(record.searchText).includes(q);
}


const AUTOCOMPLETE_FALLBACK_LIMIT = 12;
let autocompleteIndexPromise = null;

function normalizeAutocompleteText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function splitAutocompleteValues(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[;,|/]+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function scoreAutocompleteValue(value, query) {
  const normalizedValue = normalizeAutocompleteText(value);
  const tokens = normalizedValue.split(/\s+/).filter(Boolean);
  const startsWhole = normalizedValue.startsWith(query);
  const startsToken = tokens.some((token) => token.startsWith(query));
  const contains = normalizedValue.includes(query);
  if (!startsWhole && !startsToken && !contains) return null;
  return startsWhole ? 0 : startsToken ? 1 : 2;
}

async function loadAutocompleteFallbackIndex() {
  if (autocompleteIndexPromise) return autocompleteIndexPromise;

  autocompleteIndexPromise = (async () => {
    const res = await fetch(apiPath('/api/flavor-molecules/search?size=50000&page=0'));
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  })().catch((err) => {
    autocompleteIndexPromise = null;
    throw err;
  });

  return autocompleteIndexPromise;
}

function buildFallbackSuggestions(rows, field, q) {
  const query = normalizeAutocompleteText(q);
  if (query.length < 2) return [];

  const seen = new Set();
  const suggestions = [];

  const pushValue = (value, meta = '') => {
    const raw = String(value || '').trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    if (seen.has(key)) return;

    const score = scoreAutocompleteValue(raw, query);
    if (score == null) return;

    seen.add(key);
    suggestions.push({
      value: raw,
      meta,
      score,
      sortKey: normalizeAutocompleteText(raw),
    });
  };

  for (const row of rows) {
    if (field === 'commonName') {
      pushValue(row.common_name, `PubChem ${row.pubchem_id}`);
      continue;
    }

    const lookup = {
      functionalGroup: row.functional_group,
      flavorProfile: row.flavor_profile,
      femaFlavorProfile: row.fema_flavor_profile,
    }[field];

    const parts = splitAutocompleteValues(lookup);
    if (parts.length) {
      for (const part of parts) {
        pushValue(part, row.common_name);
      }
    } else {
      pushValue(lookup, row.common_name);
    }
  }

  return suggestions
    .sort((a, b) => a.score - b.score || a.sortKey.localeCompare(b.sortKey))
    .slice(0, AUTOCOMPLETE_FALLBACK_LIMIT)
    .map(({ value, meta }) => ({ value, meta }));
}

function useAutocomplete(field, value) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = String(value || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          apiPath(`/api/flavor-molecules/autocomplete?field=${encodeURIComponent(field)}&q=${encodeURIComponent(q)}`)
        );
        const data = await res.json();
        if (requestId.current !== id) return;

        const remoteSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        if (remoteSuggestions.length > 0) {
          setSuggestions(remoteSuggestions);
          return;
        }

        const rows = await loadAutocompleteFallbackIndex();
        if (requestId.current !== id) return;
        setSuggestions(buildFallbackSuggestions(rows, field, q));
      } catch {
        if (requestId.current !== id) return;
        try {
          const rows = await loadAutocompleteFallbackIndex();
          if (requestId.current !== id) return;
          setSuggestions(buildFallbackSuggestions(rows, field, q));
        } catch {
          if (requestId.current === id) setSuggestions([]);
        }
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [field, value]);

  return { suggestions, loading };
}


function SearchField({ label, value, onChange, onSelect, suggestions, loading, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fdb-search-field">
      <div className="fdb-search-label">{label}</div>
      <div className="fdb-search-shell">
        <div className="fdb-search-input-wrap">
          <input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (String(value || '').trim().length >= 2) setOpen(true);
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 130)}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
          />
          {open && (loading || suggestions.length > 0) && (
            <div className="fdb-autocomplete" role="listbox" aria-label={`${label} autocomplete`}>
              {loading && suggestions.length === 0 ? (
                <div className="fdb-autocomplete-empty">Loading suggestions…</div>
              ) : (
                suggestions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="fdb-autocomplete-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                  >
                    <div className="fdb-autocomplete-main">
                      <div className="fdb-autocomplete-name">{item.value}</div>
                      {item.meta ? <div className="fdb-autocomplete-sub">{item.meta}</div> : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {open && !loading && suggestions.length === 0 && String(value || '').trim().length >= 2 && (
            <div className="fdb-autocomplete" role="listbox" aria-label={`${label} autocomplete`}>
              <div className="fdb-autocomplete-empty">No autocomplete matches</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const JSME_SCRIPT_URL = 'https://unpkg.com/jsme-editor/jsme.nocache.js';
let jsmeLoadPromise = null;

function loadJSME() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Browser-only component'));
  }

  if (window.JSApplet?.JSME) return Promise.resolve();

  if (jsmeLoadPromise) return jsmeLoadPromise;

  jsmeLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-jsme-editor="true"]');
    if (existing) {
      const waitForExisting = () => {
        if (window.JSApplet?.JSME) resolve();
        else window.setTimeout(waitForExisting, 50);
      };
      waitForExisting();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = JSME_SCRIPT_URL;
    script.dataset.jsmeEditor = 'true';

    const timeout = window.setTimeout(() => {
      reject(new Error('Timed out loading the JSME editor.'));
    }, 20000);

    window.jsmeOnLoad = () => {
      window.clearTimeout(timeout);
      if (window.JSApplet?.JSME) resolve();
      else reject(new Error('JSME loaded, but the editor API is unavailable.'));
    };

    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Failed to load the JSME editor.'));
    };

    document.head.appendChild(script);
  }).catch((err) => {
    jsmeLoadPromise = null;
    throw err;
  });

  return jsmeLoadPromise;
}

function StructureEditorPanel({ form, setForm }) {
  const editorId = useRef(`jsme-editor-${Math.random().toString(36).slice(2)}`);
  const [status, setStatus] = useState('Loading JSME editor…');

  useEffect(() => {
    let cancelled = false;

    const mount = async () => {
      setStatus('Loading JSME editor…');

      try {
        await loadJSME();
        if (cancelled) return;

        const container = document.getElementById(editorId.current);
        if (!container || !window.JSApplet?.JSME) return;

        container.innerHTML = '';
        const applet = new window.JSApplet.JSME(editorId.current, '100%', '420px', {
          options: 'oldlook',
        });

        if (typeof applet.setCallBack === 'function') {
          applet.setCallBack('AfterStructureModified', (evt) => {
            const smiles = evt?.src?.smiles?.() || '';
            setForm((prev) => ({ ...prev, structure: smiles }));
          });
        }

        if (form.structure && typeof applet.readGenericMolecularInput === 'function') {
          try {
            applet.readGenericMolecularInput(form.structure);
          } catch {
            // ignore invalid/unsupported structure strings
          }
        }

        if (!cancelled) setStatus('');
      } catch (err) {
        if (!cancelled) {
          setStatus(err?.message || 'Failed to load the JSME editor.');
        }
      }
    };

    mount();

    return () => {
      cancelled = true;
    };
  }, [setForm]);

  return (
    <div className="fdb-structure-panel">
      <div className="fdb-search-label">JSME Molecular Editor by Peter Ertl and Bruno Bienfait</div>
      <div className="fdb-jsme-box">
        <div id={editorId.current} className="fdb-jsme-react" />
        {status ? <div className="fdb-jsme-status">{status}</div> : null}
        <div className="fdb-jsme-caption">
          Draw a structure here to search by structure.
        </div>
      </div>
    </div>
  );
}


function SearchInputs({ form, setForm, onSearch }) {
  const cn = useAutocomplete('commonName', form.commonName);
  const fg = useAutocomplete('functionalGroup', form.functionalGroup);
  const fp = useAutocomplete('flavorProfile', form.flavorProfile);
  const fema = useAutocomplete('femaFlavorProfile', form.femaFlavorProfile);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fdb-search-form">
      <SearchField
        label="Common Name"
        value={form.commonName}
        onChange={(v) => set('commonName', v)}
        onSelect={(v) => {
          set('commonName', v);
          onSearch({ ...form, commonName: v, pageIndex: 0 });
        }}
        suggestions={cn.suggestions}
        loading={cn.loading}
        placeholder="Common Name"
      />

      <SearchField
        label="Functional Group"
        value={form.functionalGroup}
        onChange={(v) => set('functionalGroup', v)}
        onSelect={(v) => {
          set('functionalGroup', v);
          onSearch({ ...form, functionalGroup: v, pageIndex: 0 });
        }}
        suggestions={fg.suggestions}
        loading={fg.loading}
        placeholder="Functional Group"
      />

      <SearchField
        label="Flavor Profile"
        value={form.flavorProfile}
        onChange={(v) => set('flavorProfile', v)}
        onSelect={(v) => {
          set('flavorProfile', v);
          onSearch({ ...form, flavorProfile: v, pageIndex: 0 });
        }}
        suggestions={fp.suggestions}
        loading={fp.loading}
        placeholder="Flavor Profile"
      />

      <SearchField
        label="FEMA Flavor profile"
        value={form.femaFlavorProfile}
        onChange={(v) => set('femaFlavorProfile', v)}
        onSelect={(v) => {
          set('femaFlavorProfile', v);
          onSearch({ ...form, femaFlavorProfile: v, pageIndex: 0 });
        }}
        suggestions={fema.suggestions}
        loading={fema.loading}
        placeholder="FEMA Flavor"
      />

      <div className="fdb-range-group">
        <div className="fdb-search-label">Range of molecular weight (g/mol)</div>
        <div className="fdb-range-row">
          <div>
            <div className="fdb-mini-label">From</div>
            <select value={form.mwFrom} onChange={(e) => set('mwFrom', e.target.value)}>
              {MW_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="fdb-mini-label">To</div>
            <select value={form.mwTo} onChange={(e) => set('mwTo', e.target.value)}>
              <option value="Disabled">Disabled</option>
              {MW_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="fdb-range-row fdb-range-row-compact">
        <div>
          <div className="fdb-mini-label">Hydrogen bond donors</div>
          <select value={form.hbd} onChange={(e) => set('hbd', e.target.value)}>
            {HBD_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="fdb-mini-label">Hydrogen bond acceptors</div>
          <select value={form.hba} onChange={(e) => set('hba', e.target.value)}>
            {HBA_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="fdb-search-label">Type of molecules</div>
        <select value={form.moleculeType} onChange={(e) => set('moleculeType', e.target.value)}>
          {TYPE_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="fdb-search-actions">
        <button type="button" className="btn" onClick={() => onSearch({ ...form, pageIndex: 0 })}>
          Search
        </button>
        <button type="button" className="btn btn-back" onClick={() => onSearch({ ...form, pageIndex: 0 })}>
          Go to Advanced Search
        </button>
      </div>
    </div>
  );
}

function SearchTabs() {
  const tabs = [
    { label: 'Flavor Molecules', active: true },
    { label: 'Entities/Ingredients', active: false },
    { label: 'Natural Sources', active: false },
    { label: 'Flavor Pairing', active: false },
  ];

  return (
    <div className="fdb-search-tabs" role="tablist" aria-label="Search tabs">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={`fdb-search-tab${tab.active ? ' active' : ''}`}
          aria-selected={tab.active}
          disabled={!tab.active}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Pagination({ pageIndex, totalPages, onChange }) {
  const pageCount = Math.max(1, totalPages || 1);
  const safePage = Math.min(pageIndex, pageCount - 1);

  const items = useMemo(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => ({ type: 'page', page: i }));
    }
    const out = [{ type: 'page', page: 0 }];
    if (safePage <= 2) {
      for (let p = 1; p <= Math.min(4, pageCount - 2); p += 1) out.push({ type: 'page', page: p });
      out.push({ type: 'ellipsis' }, { type: 'page', page: pageCount - 1 });
      return out;
    }
    if (safePage >= pageCount - 3) {
      out.push({ type: 'ellipsis' });
      for (let p = Math.max(1, pageCount - 5); p <= pageCount - 2; p += 1) out.push({ type: 'page', page: p });
      out.push({ type: 'page', page: pageCount - 1 });
      return out;
    }
    out.push({ type: 'ellipsis' }, { type: 'page', page: safePage - 1 }, { type: 'page', page: safePage }, { type: 'page', page: safePage + 1 }, { type: 'ellipsis' }, { type: 'page', page: pageCount - 1 });
    return out;
  }, [pageCount, safePage]);

  return (
    <div className="fdb-pagination fdb-pagination-centered">
      <button className="pag-btn" disabled={safePage <= 0} onClick={() => onChange(Math.max(0, safePage - 1))}>
        ← Previous
      </button>
      {items.map((item, idx) => {
        if (item.type === 'ellipsis') return <span key={`ellipsis-${idx}`} className="pag-ellipsis">…</span>;
        const active = item.page === safePage;
        return (
          <button
            key={item.page}
            className={`pag-btn${active ? ' active' : ''}`}
            onClick={() => onChange(item.page)}
          >
            {item.page + 1}
          </button>
        );
      })}
      <button className="pag-btn" disabled={safePage >= pageCount - 1} onClick={() => onChange(Math.min(pageCount - 1, safePage + 1))}>
        Next →
      </button>
    </div>
  );
}

function ResultsPage({ route, onOpenMolecule, onPageChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        const form = route.form || {};
        Object.entries(form).forEach(([key, value]) => {
          if (key === 'pageIndex') return;
          if (value === '' || value === 'Default' || value === 'Disabled' || value === 'All' || value == null) return;
          params.set(key, String(value));
        });
        params.set('page', String(form.pageIndex || 0));
        params.set('size', String(ROWS_PER_PAGE));

        const res = await fetch(apiPath(`/api/flavor-molecules/search?${params.toString()}`), { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to search flavor molecules');
        if (cancelled) return;
        setRows(Array.isArray(data.results) ? data.results : []);
        setTotalElements(Number.parseInt(data.totalElements || '0', 10) || 0);
        setTotalPages(Number.parseInt(data.totalPages || '1', 10) || 1);
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        setRows([]);
        setTotalElements(0);
        setTotalPages(1);
        setError(err.message || 'Failed to search flavor molecules');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [route.urlKey, route.form.commonName, route.form.functionalGroup, route.form.flavorProfile, route.form.femaFlavorProfile, route.form.mwFrom, route.form.mwTo, route.form.hbd, route.form.hba, route.form.moleculeType, route.form.structure, route.form.pageIndex]);

  const queryLabel = formatQuerySummary(route.form || {});

  return (
    <div className="fdb-results-page">
      <div className="fdb-result-info">
        We found <b>{totalElements || rows.length || 0} results</b> for your query: molecule: <b>{queryLabel}</b>
      </div>

      {loading && <Spinner text="Searching flavor molecules…" />}
      {error && <p style={{ color: '#c62828', padding: '0.6rem 0' }}>Error: {error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="fdb-not-found">
          <h2>No molecules matched your search.</h2>
          <p>Try broadening one or more filters.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <TableWrap title="Results" meta="Click Common Name to open the molecule page">
          <table className="fdb-table fdb-molecule-results-table">
            <thead>
              <tr>
                <th>Common Name</th>
                <th>PubChem ID</th>
                <th>FEMA Flavor Profile</th>
                <th>Flavor Profile</th>
                <th className="right">More Info</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.pubchem_id}>
                  <td>
                    <button type="button" className="ent-link" onClick={() => onOpenMolecule(row)}>
                      {row.common_name}
                    </button>
                  </td>
                  <td className="muted mono">{row.pubchem_id}</td>
                  <td>{row.fema_flavor_profile || '—'}</td>
                  <td>{row.flavor_profile || '—'}</td>
                  <td className="right">
                    <button type="button" className="pair-link" onClick={() => onOpenMolecule(row)}>
                      More Info
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {totalPages > 1 && (
        <Pagination pageIndex={route.form.pageIndex || 0} totalPages={totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}

export default function FlavorMoleculesPage() {
  const [route, setRoute] = useState(readRoute);
  const [form, setForm] = useState(route.form);

  useEffect(() => {
    const onPop = () => {
      const next = readRoute();
      setRoute(next);
      setForm(next.form);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    setForm(route.form);
  }, [route.urlKey]);

  const navigate = (nextRoute, replace = false) => {
    const url = buildUrl(nextRoute);
    if (replace) window.history.replaceState({}, '', url);
    else window.history.pushState({}, '', url);

    const next = {
      page: nextRoute.page,
      form: nextRoute.form || route.form,
      molecule: nextRoute.molecule || route.molecule,
      context: nextRoute.context || route.context,
      urlKey: url,
    };
    setRoute(next);
    if (nextRoute.form) setForm(nextRoute.form);
  };

  const handleSearch = (nextForm) => {
    navigate({
      page: 'results',
      form: { ...nextForm, pageIndex: 0 },
      context: { label: 'Flavor Molecules', kind: 'search' },
    });
  };

  const handlePageChange = (pageIndex) => {
    navigate({
      page: 'results',
      form: { ...route.form, pageIndex },
      context: route.context,
    });
  };

  const openDetail = (row) => {
    navigate({
      page: 'detail',
      form: route.form,
      molecule: {
        pubchem_id: row.pubchem_id,
        name: row.common_name,
        df: row.df ?? 1,
        importance: row.importance ?? 1,
      },
      context: route.context,
    });
  };

  return (
    <div className="fdb-flavor-explorer">
      <SearchTabs />

      {route.page === 'search' && (
        <div className="fdb-flavor-search-layout">
          <div className="fdb-search-panel">
            <div className="fdb-search-wrap">
              <div className="fdb-search-title">Search based on physicochemical properties of Flavor Molecules</div>
              <div className="fdb-search-subtitle">
                Use one or more search parameters. You may leave any field empty. The search returns results for conjunction of all query parameters.
              </div>

              <div className="fdb-search-grid">
                <div className="fdb-search-left">
                  <SearchInputs form={form} setForm={setForm} onSearch={handleSearch} />
                </div>
                <div className="fdb-search-right">
                  <StructureEditorPanel form={form} setForm={setForm} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {route.page === 'results' && (
        <div>
          <div className="fdb-nav-row">
            <button className="btn btn-back" onClick={() => window.history.back()}>
              ← Back
            </button>
          </div>
          <ResultsPage route={route} onOpenMolecule={openDetail} onPageChange={handlePageChange} />
        </div>
      )}

      {route.page === 'detail' && route.molecule?.pubchem_id ? (
        <MoleculeDetailPage
          entity={{ id: 0, name: route.context?.label || 'Flavor Molecules', category: '' }}
          molecule={route.molecule}
          onBack={() => window.history.back()}
          onOpenEntity={undefined}
        />
      ) : null}
    </div>
  );
}
