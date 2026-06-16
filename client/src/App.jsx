import React, { useEffect, useState } from 'react';
import BrowsePage from './components/BrowsePage';
import MoleculesPage from './components/MoleculesPage';
import PairingsPage from './components/PairingsPage';
import MoleculeDetailPage from './components/MoleculeDetailPage';

// view: 'browse' | 'molecules' | 'pairings' | 'moleculeDetail'

export default function App() {
  const [view, setView] = useState('browse');
  const [entity, setEntity] = useState(null);
  const [selectedMolecule, setSelectedMolecule] = useState(null);
  const [browseKey, setBrowseKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const action = params.get('action');
    const eid = params.get('eid');
    const ename = params.get('ename');
    const ecat = params.get('ecat');
    const pubchem = params.get('pubchem');
    const molname = params.get('molname');
    const df = params.get('df');
    const importance = params.get('importance');

    if ((action === 'open' || action === 'pair' || action === 'molecule') && eid && ename) {
      const parentEntity = {
        id: parseInt(eid, 10),
        name: ename,
        category: ecat || '',
      };
      setEntity(parentEntity);

      if (action === 'pair') {
        setSelectedMolecule(null);
        setView('pairings');
        return;
      }

      if (action === 'molecule' && pubchem && molname) {
        setSelectedMolecule({
          pubchem_id: parseInt(pubchem, 10),
          name: molname,
          df: df ? parseInt(df, 10) : 1,
          importance: importance ? parseFloat(importance) : 1.0,
          rarity: null,
        });
        setView('moleculeDetail');
        return;
      }

      setSelectedMolecule(null);
      setView('molecules');
    }
  }, []);

  function openMolecules(ent) {
    setEntity(ent);
    setSelectedMolecule(null);
    setView('molecules');

    const params = new URLSearchParams({
      action: 'open',
      eid: String(ent.id),
      ename: ent.name,
      ecat: ent.category || '',
    });

    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  function openPairings(ent) {
    setEntity(ent);
    setSelectedMolecule(null);
    setView('pairings');

    const params = new URLSearchParams({
      action: 'pair',
      eid: String(ent.id),
      ename: ent.name,
      ecat: ent.category || '',
    });

    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  function openMoleculeDetail(molecule, parentEntity = entity) {
    if (!parentEntity || !molecule) return;

    setEntity(parentEntity);
    setSelectedMolecule(molecule);
    setView('moleculeDetail');

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

    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  function goBackToMolecules() {
    if (!entity) {
      goBrowse();
      return;
    }

    setSelectedMolecule(null);
    setView('molecules');

    const params = new URLSearchParams({
      action: 'open',
      eid: String(entity.id),
      ename: entity.name,
      ecat: entity.category || '',
    });

    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  function goBrowse() {
    setView('browse');
    setEntity(null);
    setSelectedMolecule(null);
    setBrowseKey(k => k + 1);

    window.history.replaceState({}, '', window.location.pathname);
  }

  return (
    <>
      <div className="fdb-hero">
        <button
          type="button"
          className="fdb-home-btn"
          onClick={goBrowse}
          aria-label="Back to home"
          title="Home"
        >
          <span className="fdb-home-btn-icon" aria-hidden="true">🌶</span>
        </button>
        <h1>FlavorDB Search</h1>
        <p>
          A resource for exploring flavor molecules · Importance = 1/df(m)
        </p>
      </div>

      <div className="fdb-content">
        {view === 'browse' && (
          <BrowsePage
            key={browseKey}
            onOpenMolecules={openMolecules}
            onOpenPairings={openPairings}
          />
        )}

        {view === 'molecules' && (
          <MoleculesPage
            entity={entity}
            onBack={goBrowse}
            onPairIt={() => openPairings(entity)}
            onOpenMolecule={(mol) => openMoleculeDetail(mol, entity)}
          />
        )}

        {view === 'pairings' && (
          <PairingsPage
            entity={entity}
            onBackToMolecules={goBackToMolecules}
          />
        )}

        {view === 'moleculeDetail' && (
          <MoleculeDetailPage
            entity={entity}
            molecule={selectedMolecule}
            onBack={goBackToMolecules}
            onOpenEntity={openMolecules}
          />
        )}
      </div>
    </>
  );
}
