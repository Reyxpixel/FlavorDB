import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiPath } from '../apiPath';
import { CatTag, RarityChip, Spinner, TableWrap } from './Shared';

const JSMOL_SCRIPT_URL = 'https://chemapps.stolaf.edu/jmol/jsmol/js/JSmol.min.js';
const JSMOL_BASE_PATH = 'https://chemapps.stolaf.edu/jmol/jsmol';

function formatMaybe(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

function PropertyRow({ label, value }) {
  return (
    <div className="molecule-detail-row">
      <div className="molecule-detail-label">{label}</div>
      <div className="molecule-detail-value">{value}</div>
    </div>
  );
}

function PropertyPanel({ title, rows }) {
  return (
    <div className="molecule-panel">
      <div className="molecule-panel-head">{title}</div>
      <div className="molecule-detail-list molecule-detail-list--scroll">
        {rows.map((row) => (
          <PropertyRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}

function JSmolViewer({ pubchemId, active }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active || !pubchemId) return;

    setLoading(true);
    setError(null);

    const iframe = iframeRef.current;
    if (!iframe) return;

    const token = `jsmol_${pubchemId}_${Date.now()}`;
    const mol2Url = `https://cosylab.iiitd.edu.in/flavordb/static/mol2files/${pubchemId}.mol2`;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #fff;
    }
    #jsmol-host {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="jsmol-host"></div>
  <script src="${JSMOL_SCRIPT_URL}"></script>
  <script>
    (function () {
      try {
        var host = document.getElementById('jsmol-host');
        var html = '';

        if (window.jmolInitialize && window.jmolApplet) {
          jmolInitialize('${JSMOL_BASE_PATH}');
          jmolCheckBrowser('popup', 'browsercheck', 'onClick');
          var jmol = jmolApplet(
            '100%',
            'load ${mol2Url}; color C [255,255,255]; set disablePopupMenu TRUE;'
          );
          html = (jmol && jmol._code) ? jmol._code : '';
        } else if (window.Jmol && window.Jmol.getApplet && window.Jmol.getAppletHtml) {
          Jmol.setDocument(0);
          var info = {
            width: '100%',
            height: '100%',
            debug: false,
            color: '#ffffff',
            addSelectionOptions: false,
            disableInitialConsole: true,
            j2sPath: '${JSMOL_BASE_PATH}/j2s',
            use: 'HTML5',
            serverURL: '${JSMOL_BASE_PATH}/php/jsmol.php',
            script: 'set antialiasDisplay; background white; load "${mol2Url}"; color C [255,255,255]; set disablePopupMenu TRUE;'
          };
          var applet = Jmol.getApplet('jsmolApplet', info);
          html = Jmol.getAppletHtml(applet);
        } else {
          parent.postMessage({ type: 'jsmolError', id: '${token}', message: 'JSmol API unavailable' }, '*');
          return;
        }

        host.innerHTML = html;
        parent.postMessage({ type: 'jsmolReady', id: '${token}' }, '*');
      } catch (e) {
        parent.postMessage({
          type: 'jsmolError',
          id: '${token}',
          message: (e && e.message) ? e.message : String(e)
        }, '*');
      }
    })();
  </script>
</body>
</html>`;

    const onMessage = (e) => {
      if (!e.data || e.data.id !== token) return;

      if (e.data.type === 'jsmolReady') {
        setLoading(false);
      } else if (e.data.type === 'jsmolError') {
        setError(e.data.message || 'Failed to load JSmol');
        setLoading(false);
      }
    };

    window.addEventListener('message', onMessage);
    iframe.srcdoc = html;

    const fallback = setTimeout(() => setLoading(false), 15000);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(fallback);
      if (iframe) iframe.srcdoc = '';
    };
  }, [active, pubchemId]);

  if (!active) return null;

  return (
    <div className="molecule-viewer-stage">
      <iframe
        ref={iframeRef}
        className="molecule-jsmol-iframe"
        title="JSmol 3D Viewer"
      />
      {loading && !error && (
        <div className="molecule-viewer-overlay">
          <Spinner text="Loading 3D model…" />
        </div>
      )}
      {error && (
        <div className="molecule-viewer-overlay molecule-viewer-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default function MoleculeDetailPage({ entity, molecule, scrollTo, onBack, onOpenEntity }) {
  const entitiesRef = useRef(null);
  const [activeTab, setActiveTab] = useState('image');
  const [containingEntities, setContainingEntities] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [entityError, setEntityError] = useState(null);
  const [sections, setSections] = useState({ physicochemical: [], admet: [], structure: [] });
  const [propertiesError, setPropertiesError] = useState(null);
  const [loadingProperties, setLoadingProperties] = useState(true);

  useEffect(() => {
    if (scrollTo === 'entities' && entitiesRef.current && !loadingEntities) {
      setTimeout(() => {
        if (entitiesRef.current) {
          entitiesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [scrollTo, loadingEntities]);

  useEffect(() => {
    if (!molecule?.pubchem_id) return;

    let cancelled = false;
    const ctrl = new AbortController();

    setLoadingEntities(true);
    setEntityError(null);
    setContainingEntities([]);
    setLoadingProperties(true);
    setPropertiesError(null);
    setSections({ physicochemical: [], admet: [], structure: [] });

    fetch(apiPath(`/api/molecule-overview/${molecule.pubchem_id}`), { signal: ctrl.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || data?.error || 'Failed to load molecule overview');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setContainingEntities(Array.isArray(data.entities) ? data.entities : []);
        setSections(data.sections || { physicochemical: [], admet: [], structure: [] });
      })
      .catch((err) => {
        if (cancelled || err.name === 'AbortError') return;
        setEntityError(err.message || 'Failed to load containing ingredients');
        setPropertiesError(err.message || 'Failed to load molecule properties');
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingEntities(false);
          setLoadingProperties(false);
        }
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [molecule?.pubchem_id]);

  useEffect(() => {
    setActiveTab('image');
  }, [molecule?.pubchem_id]);

  const pubchemImage = useMemo(
    () => `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${molecule?.pubchem_id}/PNG?image_size=large`,
    [molecule?.pubchem_id]
  );

  if (!entity || !molecule) return null;

  const totalContaining = containingEntities.length || molecule.df || 0;
  const containedLabel = totalContaining === 1 ? 'Ingredient' : 'Ingredients';
  const containedText = `${totalContaining} ${containedLabel}`;
  const rarity =
    molecule.rarity?.label ||
    (molecule.df === 1 ? 'unique' : molecule.df <= 5 ? 'rare' : molecule.df <= 50 ? 'common' : 'ubiquitous');

  const propertyGrid = [
    { key: 'physicochemical', title: 'Physicochemical Properties' },
    { key: 'admet', title: 'ADMET Properties' },
    { key: 'structure', title: '2D/3D Properties' },
  ];

  return (
    <div>
      <div className="fdb-breadcrumb">
        <span className="cur">Browse</span>
        <span className="sep">›</span>
        <span
          className="cur"
          onClick={() => onOpenEntity?.(entity)}
          style={{ cursor: onOpenEntity ? 'pointer' : 'default' }}
        >
          {entity.name}
        </span>
        <span className="sep">›</span>
        <span className="cur">Flavor Molecule</span>
        <span className="sep">›</span>
        <span>{molecule.name}</span>
      </div>

      <div className="fdb-nav-row">
        <button className="btn btn-back" onClick={onBack}>
          &larr; Back to {entity && entity.id === 0 ? 'Search' : (entity ? entity.name : 'molecules')}
        </button>
      </div>

      <div className="fdb-page-header">
        <h2>{molecule.name}</h2>
        <div className="meta">
          Ingredient: <strong>{entity.name}</strong>
          &nbsp;·&nbsp; PubChem ID: {molecule.pubchem_id}
          &nbsp;·&nbsp; Present In: {molecule.df}
          &nbsp;·&nbsp; Importance: {Number(molecule.importance || 0).toFixed(6)}
        </div>
      </div>

      <div className="molecule-detail-grid">
        <div className="molecule-panel">
          <div className="molecule-panel-head">Molecular &amp; Flavor Profile</div>
          <div className="molecule-detail-list">
            <PropertyRow label="Common name" value={molecule.name} />
            <PropertyRow label="PubChem ID" value={molecule.pubchem_id} />
            <PropertyRow label="Contained in" value={containedText} />
            <PropertyRow
              label="Rarity"
              value={<RarityChip rarity={molecule.rarity || { label: rarity, cls: `rarity-${rarity}` }} />}
            />
            <PropertyRow
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Flavor Importance
                  <span className="fdb-infotip">
                    <svg className="fdb-infotip-mark" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                    </svg>
                    <span className="fdb-infotip-bubble" style={{ fontWeight: 'normal', textTransform: 'none' }}>
                      The Flavor Importance of a molecule captures its uniqueness. It is calculated as the inverse of its document frequency: 1/df(m), where df(m) is the total number of ingredients that contain this molecule.
                    </span>
                  </span>
                </div>
              }
              value={<span className="mono">{Number(molecule.importance || 0).toFixed(8)}</span>}
            />
            <PropertyRow label="Ingredient" value={<CatTag category={entity.category} />} />
          </div>
        </div>

        <div className="molecule-panel">
          <div className="molecule-panel-head">Structure Viewer</div>

          <div className="molecule-preview-tabs">
            <button
              type="button"
              className={`molecule-tab ${activeTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              2D Image
            </button>
            <button
              type="button"
              className={`molecule-tab ${activeTab === 'jsmol' ? 'active' : ''}`}
              onClick={() => setActiveTab('jsmol')}
            >
              View JSmol
            </button>
          </div>

          <div style={{ display: activeTab === 'image' ? 'flex' : 'none' }} className="molecule-preview">
            <img
              className="molecule-preview-image"
              src={pubchemImage}
              alt={molecule.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div style={{ display: activeTab === 'jsmol' ? 'block' : 'none', width: '100%' }}>
            <JSmolViewer pubchemId={molecule.pubchem_id} active={true} />
          </div>
        </div>
      </div>

      <div
        className="molecule-properties-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}
      >
        {propertyGrid.map(({ key, title }) => (
          <PropertyPanel key={key} title={title} rows={sections[key] || []} />
        ))}
      </div>

      {loadingProperties && !propertiesError && (
        <Spinner text="Loading physicochemical and ADMET properties…" />
      )}

      {propertiesError && (
        <p style={{ color: '#c62828', padding: '0.6rem 0' }}>
          Error: {propertiesError}
        </p>
      )}

      <div ref={entitiesRef}>
        <TableWrap
          title={`Entities that contain ${molecule.name}`}
          meta={loadingEntities ? 'Loading containing ingredients.' : `${containingEntities.length} ingredients`}
        >
          {loadingEntities && <div style={{ padding: '0 1rem' }}><Spinner text="Loading containing ingredients…" /></div>}
          {entityError && (
            <p style={{ color: '#c62828', padding: '0.8rem 1rem' }}>
              Error: {entityError}
            </p>
          )}
          {!loadingEntities && !entityError && (
            <div className="molecule-entity-list">
              {containingEntities.length > 0 ? containingEntities.map((ent) => (
                <button
                  key={ent.id}
                  type="button"
                  className="molecule-entity-row"
                  onClick={() => onOpenEntity(ent)}
                >
                  <div className="molecule-entity-name">{ent.name}</div>
                  <div className="molecule-entity-sub">
                    {ent.category || '—'}{ent.source ? ` · ${ent.source}` : ''}
                  </div>
                </button>
              )) : (
                <div className="molecule-empty">
                  No containing ingredients returned for this molecule.
                </div>
              )}
            </div>
          )}
        </TableWrap>
      </div>
    </div>
  );
}
