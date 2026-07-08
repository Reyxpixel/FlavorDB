import React, { useCallback, useEffect, useState } from 'react';
import SearchPage from './components/SearchPage';
import MoleculesPage from './components/MoleculesPage';
import PairingsPage from './components/PairingsPage';
import MoleculeDetailPage from './components/MoleculeDetailPage';
import MoleculeResultsPage from './components/MoleculeResultsPage';

// view: 'browse' | 'moleculeResults' | 'molecules' | 'pairings' | 'moleculeDetail'

const MOL_FIELDS = [
  'common_name', 'functional_group', 'flavor_profile', 'fema_flavor_profile',
  'from', 'to', 'hbd', 'hba', 'type', 'smiles',
];

const EMPTY_MOL_FORM = MOL_FIELDS.reduce((acc, k) => ({ ...acc, [k]: '' }), {});

// Derive the whole app view from the current URL. Both the initial load and
// the browser Back/Forward buttons (popstate) route through this, so in-app
// navigation and browser navigation always agree.
function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('mview') === 'molecules') {
    const molQuery = {};
    for (const key of MOL_FIELDS) {
      const v = params.get(key);
      if (v) molQuery[key] = v;
    }
    return { view: 'moleculeResults', entity: null, selectedMolecule: null, molQuery };
  }

  const action = params.get('action');
  const eid = params.get('eid');
  const ename = params.get('ename');
  const ecat = params.get('ecat');

  if ((action === 'open' || action === 'pair' || action === 'molecule') && eid != null && ename) {
    const entity = { id: parseInt(eid, 10), name: ename, category: ecat || '' };

    if (action === 'pair') {
      return { view: 'pairings', entity, selectedMolecule: null, molQuery: null };
    }

    if (action === 'molecule') {
      const pubchem = params.get('pubchem');
      const molname = params.get('molname');
      const df = params.get('df');
      const importance = params.get('importance');
      if (pubchem && molname) {
        return {
          view: 'moleculeDetail',
          entity,
          selectedMolecule: {
            pubchem_id: parseInt(pubchem, 10),
            name: molname,
            df: df ? parseInt(df, 10) : 1,
            importance: importance ? parseFloat(importance) : 1.0,
            rarity: null,
          },
          molQuery: null,
        };
      }
    }

    return { view: 'molecules', entity, selectedMolecule: null, molQuery: null };
  }

  return { view: 'browse', entity: null, selectedMolecule: null, molQuery: null };
}

export default function App() {
  const [state, setState] = useState(() => readStateFromUrl());
  // Seeds the Flavor Molecules search form so returning to the search page
  // (e.g. via Back) keeps whatever the user last searched for.
  const [lastMolForm, setLastMolForm] = useState(() => {
    const s = readStateFromUrl();
    return s.molQuery ? { ...EMPTY_MOL_FORM, ...s.molQuery } : EMPTY_MOL_FORM;
  });

  const { view, entity, selectedMolecule, molQuery } = state;

  const applyUrl = useCallback(() => {
    const next = readStateFromUrl();
    setState(next);
    if (next.molQuery) setLastMolForm({ ...EMPTY_MOL_FORM, ...next.molQuery });
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', applyUrl);
    return () => window.removeEventListener('popstate', applyUrl);
  }, [applyUrl]);

  // Push a new history entry then re-derive state from it. `search` is a full
  // query string beginning with '?', or '' for the bare home URL.
  const navigate = useCallback((search) => {
    const url = search ? `${window.location.pathname}${search}` : window.location.pathname;
    window.history.pushState({}, '', url);
    applyUrl();
    window.scrollTo(0, 0);
  }, [applyUrl]);

  const goBack = useCallback(() => window.history.back(), []);

  function openMoleculeResults(molForm) {
    setLastMolForm({ ...EMPTY_MOL_FORM, ...molForm });
    const params = new URLSearchParams({ mview: 'molecules' });
    MOL_FIELDS.forEach((k) => {
      const v = molForm[k];
      if (v !== '' && v != null) params.set(k, v);
    });
    navigate(`?${params.toString()}`);
  }

  function openMolecules(ent) {
    const params = new URLSearchParams({
      action: 'open',
      eid: String(ent.id),
      ename: ent.name,
      ecat: ent.category || '',
    });
    navigate(`?${params.toString()}`);
  }

  function openPairings(ent) {
    const params = new URLSearchParams({
      action: 'pair',
      eid: String(ent.id),
      ename: ent.name,
      ecat: ent.category || '',
    });
    navigate(`?${params.toString()}`);
  }

  function openMoleculeDetail(molecule, parentEntity = entity) {
    if (!parentEntity || !molecule) return;
    const params = new URLSearchParams({
      action: 'molecule',
      eid: String(parentEntity.id),
      ename: parentEntity.name,
      ecat: parentEntity.category || '',
      pubchem: String(molecule.pubchem_id),
      molname: molecule.name || '',
      df: String(molecule.df ?? 1),
      importance: String(molecule.importance ?? 1),
    });
    navigate(`?${params.toString()}`);
  }

  function openSearchMoleculeDetail(molecule) {
    if (!molecule) return;
    openMoleculeDetail(molecule, { id: 0, name: 'Flavor Molecules Search', category: '' });
  }

  function goHome() {
    setLastMolForm(EMPTY_MOL_FORM);
    navigate('');
  }

  const headerLinks = [
    { label: 'FlavorDB Pro Search', internal: true },
    { label: 'How To Use', href: 'https://cosylab.iiitd.edu.in/flavordb/how_to_use' },
    { label: 'Receptors', href: 'https://cosylab.iiitd.edu.in/flavordb/receptors' },
    { label: 'FAQs', href: 'https://cosylab.iiitd.edu.in/flavordb/faq' },
    { label: 'Contact Us', href: 'https://cosylab.iiitd.edu.in/flavordb/contact' },
    { label: 'CoSyLab', href: 'https://cosylab.iiitd.edu.in/' },
  ];

  return (
    <div className="fdb-app-shell">
      <header className="fdb-site-header">
        <div className="fdb-site-header-inner">
          <button
            type="button"
            className="fdb-site-logo"
            onClick={goHome}
            aria-label="Back to home"
            title="Home"
          >
            <span aria-hidden="true">🌶</span>
          </button>

          <div className="fdb-site-branding">
            <h1>FlavorDB Pro</h1>
            <p>A resource to explore flavor molecules</p>
          </div>

          <nav className="fdb-site-nav" aria-label="Primary">
            {headerLinks.map(link => (
              link.internal ? (
                <button
                  key={link.label}
                  type="button"
                  className="fdb-site-nav-link"
                  onClick={goHome}
                >
                  {link.label}
                </button>
              ) : (
                <a key={link.label} className="fdb-site-nav-link" href={link.href}>
                  {link.label}
                </a>
              )
            ))}
          </nav>
        </div>
      </header>

      <div className="fdb-content">
        {view === 'browse' && (
          <SearchPage
            initialMolForm={lastMolForm}
            onOpenMolecules={openMolecules}
            onOpenPairings={openPairings}
            onOpenMoleculeResults={openMoleculeResults}
          />
        )}

        {view === 'moleculeResults' && (
          <MoleculeResultsPage
            query={molQuery}
            onBack={goBack}
            onOpenMolecule={openSearchMoleculeDetail}
          />
        )}

        {view === 'molecules' && (
          <MoleculesPage
            entity={entity}
            onBack={goBack}
            onPairIt={() => openPairings(entity)}
            onOpenMolecule={(mol) => openMoleculeDetail(mol, entity)}
          />
        )}

        {view === 'pairings' && (
          <PairingsPage
            entity={entity}
            onBackToMolecules={goBack}
          />
        )}

        {view === 'moleculeDetail' && (
          <MoleculeDetailPage
            entity={entity}
            molecule={selectedMolecule}
            onBack={goBack}
            onOpenEntity={openMolecules}
          />
        )}
      </div>

      <footer className="fdb-site-footer">
        <div className="fdb-site-footer-inner">
          <div>Copyright © 2026 · All rights reserved.</div>
          <div className="fdb-site-footer-links">
            <a href="https://www.foodoscope.com/" target="_blank" rel="noreferrer">Foodoscope Technologies Pvt. Ltd.</a>
            <span>|</span>
            <a href="https://faculty.iiitd.ac.in/~bagler/" target="_blank" rel="noreferrer">Dr. Ganesh Bagler</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
