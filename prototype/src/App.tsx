import { useCallback, useEffect, useState } from "react";
import {
  enrichMoleculesWithDf,
  getMoleculesForEntity,
  rankMolecules,
  searchEntities,
} from "./api/flavordb";
import { SiteHeader } from "./components/SiteChrome";
import type { ApiSettings, Entity, RankedMolecule } from "./types";

const DEFAULT_BASE =
  import.meta.env.DEV ? "/api/flavordb" : "http://192.168.1.92:9208/flavordb";

const STORAGE_KEY = "flavordb-prototype-settings";

function loadSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApiSettings;
  } catch {
    /* ignore */
  }
  return {
    baseUrl: DEFAULT_BASE,
    authToken: "",
    useMock: false,
  };
}

export default function App() {
  const [settings, setSettings] = useState<ApiSettings>(loadSettings);
  const [query, setQuery] = useState("mango");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [molecules, setMolecules] = useState<RankedMolecule[]>([]);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const apiSettings = settings;

  const runSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setMolecules([]);
    try {
      const list = await searchEntities(apiSettings, query.trim());
      setEntities(list);
      if (list.length === 1) setSelected(list[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, [apiSettings, query]);

  const fetchRankedMolecules = useCallback(
    async (entity: Entity, enrich = true): Promise<RankedMolecule[]> => {
      let raw = await getMoleculesForEntity(apiSettings, entity.entity_id, true);
      const missingDf = raw.some((m) => !m.df);
      if (enrich && missingDf && !apiSettings.useMock) {
        setEnriching(true);
        raw = await enrichMoleculesWithDf(apiSettings, raw, (done, total) => {
          setEnrichProgress(`Computing df(m)… ${done}/${total}`);
        });
        setEnriching(false);
        setEnrichProgress("");
      }
      return rankMolecules(raw);
    },
    [apiSettings],
  );

  useEffect(() => {
    if (!selected) {
      setMolecules([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchRankedMolecules(selected)
      .then((ranked) => {
        if (!cancelled) setMolecules(ranked);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load molecules");
          setMolecules([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, fetchRankedMolecules]);

  const maxImportance = molecules[0]?.importance ?? 1;

  return (
    <div className="page">
      <SiteHeader />

      <main className="fdb-container main">
        <h1 className="page-title">Ingredient Molecule Ranking</h1>
        <p className="page-desc">
          Search an ingredient to view its flavor molecules ranked by rarity.
        </p>

        <section className="tool-section">
          <div className="row">
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor="search">Ingredient</label>
              <input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                placeholder="e.g. mango, durian, peanut"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void runSearch()}
              disabled={loading}
            >
              Search
            </button>
          </div>

          {entities.length > 0 && (
            <ul className="entity-list">
              {entities.map((ent) => (
                <li key={ent.entity_id}>
                  <button
                    type="button"
                    className={
                      selected?.entity_id === ent.entity_id ? "selected" : ""
                    }
                    onClick={() => setSelected(ent)}
                  >
                    <strong>
                      {ent.entity_alias_readable ??
                        ent.entity_alias ??
                        `Entity ${ent.entity_id}`}
                    </strong>
                    <div className="meta">
                      ID {ent.entity_id}
                      {ent.category ? ` · ${ent.category}` : ""}
                      {ent.natural_source_name
                        ? ` · ${ent.natural_source_name}`
                        : ""}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="status error">{error}</p>}
          {loading && !enriching && <p className="status">Loading…</p>}
          {enriching && <p className="status">{enrichProgress}</p>}
        </section>

        {selected && molecules.length > 0 && (
          <section className="tool-section">
            <h2 className="section-label">
              {selected.entity_alias_readable ?? selected.entity_alias}
            </h2>
            <p className="status">
              {molecules.length} molecules · top importance{" "}
              {molecules[0].importance.toFixed(4)} (df = {molecules[0].df})
            </p>
            <div className="molecule-table-wrap">
              <table className="molecules">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Molecule</th>
                    <th>PubChem ID</th>
                    <th>df(m)</th>
                    <th>Importance</th>
                    <th>Relative</th>
                  </tr>
                </thead>
                <tbody>
                  {molecules.map((m) => (
                    <tr key={m.pubchem_id}>
                      <td>
                        <span
                          className={`rank-badge ${
                            m.rank <= 3 ? "rare" : "mid"
                          }`}
                        >
                          {m.rank}
                        </span>
                      </td>
                      <td>{m.common_name}</td>
                      <td>{m.pubchem_id}</td>
                      <td>{m.df}</td>
                      <td>{m.importance.toFixed(4)}</td>
                      <td>
                        <div className="importance-bar">
                          <span
                            style={{
                              width: `${Math.min(100, (m.importance / maxImportance) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="page-footer">
        <div className="fdb-container">
          <button
            type="button"
            className="footer-toggle"
            onClick={() => setApiSettingsOpen((open) => !open)}
            aria-expanded={apiSettingsOpen}
          >
            API settings
            <span className="footer-toggle-icon" aria-hidden>
              {apiSettingsOpen ? "−" : "+"}
            </span>
          </button>
          {apiSettingsOpen && (
            <div className="footer-settings">
              <div className="row">
                <div className="field" style={{ flex: 2 }}>
                  <label htmlFor="baseUrl">Base URL</label>
                  <input
                    id="baseUrl"
                    value={settings.baseUrl}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, baseUrl: e.target.value }))
                    }
                    placeholder="http://192.168.1.92:9208/flavordb"
                  />
                </div>
                <div className="field" style={{ flex: 2 }}>
                  <label htmlFor="token">Bearer token</label>
                  <input
                    id="token"
                    type="password"
                    value={settings.authToken}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, authToken: e.target.value }))
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={settings.useMock}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, useMock: e.target.checked }))
                  }
                />
                Use mock data (offline demo)
              </label>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
