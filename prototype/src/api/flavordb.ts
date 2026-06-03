import {
  MOCK_MOLECULES,
  searchMockEntities,
} from "../mock/data";
import type {
  ApiSettings,
  Entity,
  MoleculeCompact,
  RankedMolecule,
} from "../types";

function headers(authToken: string): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (authToken.trim()) {
    h.Authorization = `Bearer ${authToken.trim()}`;
  }
  return h;
}

async function fetchJson<T>(
  url: string,
  authToken: string,
): Promise<T> {
  const res = await fetch(url, { headers: headers(authToken) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${text.slice(0, 200) || res.statusText}`,
    );
  }
  return res.json() as Promise<T>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/** Paginated or bare array responses from Spring-style APIs */
function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["content", "data", "results", "items"]) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

function readDf(m: MoleculeCompact & Record<string, unknown>): number {
  const raw =
    m.df ??
    m.entity_count ??
    (m as { entityCount?: number }).entityCount ??
    (m as { ingredient_count?: number }).ingredient_count;
  if (typeof raw === "number" && raw > 0) return raw;
  return 0;
}

export function rankMolecules(molecules: MoleculeCompact[]): RankedMolecule[] {
  const withDf = molecules.map((m) => {
    const df = readDf(m as MoleculeCompact & Record<string, unknown>);
    const importance = df > 0 ? 1 / df : 0;
    return { ...m, df, importance };
  });

  withDf.sort((a, b) => b.importance - a.importance);

  return withDf.map((m, i) => ({
    ...m,
    rank: i + 1,
    df: m.df || 1,
    importance: m.importance || 1,
  }));
}

export async function searchEntities(
  settings: ApiSettings,
  query: string,
  page = 0,
  size = 20,
): Promise<Entity[]> {
  if (settings.useMock) {
    return searchMockEntities(query);
  }

  const base = normalizeBaseUrl(settings.baseUrl);
  const params = new URLSearchParams({
    entity_alias_readable: query,
    page: String(page),
    size: String(size),
  });
  const data = await fetchJson<unknown>(
    `${base}/entities/by-entity-alias-readable?${params}`,
    settings.authToken,
  );
  return unwrapList<Entity>(data);
}

export async function getMoleculesForEntity(
  settings: ApiSettings,
  entityId: number,
  compact = true,
): Promise<MoleculeCompact[]> {
  if (settings.useMock) {
    return MOCK_MOLECULES[entityId] ?? [];
  }

  const base = normalizeBaseUrl(settings.baseUrl);
  const path = compact
    ? `/entities/by-id/${entityId}/molecules-compact`
    : `/entities/by-id/${entityId}/molecules`;
  const data = await fetchJson<unknown>(
    `${base}${path}`,
    settings.authToken,
  );
  const list = unwrapList<MoleculeCompact & Record<string, unknown>>(data);

  return list.map((row) => ({
    pubchem_id:
      row.pubchem_id ??
      (row as { pubchemId?: number }).pubchemId ??
      0,
    common_name:
      row.common_name ??
      (row as { commonName?: string }).commonName ??
      "Unknown",
    df: readDf(row) || undefined,
  }));
}

/** df(m) from reverse lookup when compact list omits counts */
export async function getMoleculeDf(
  settings: ApiSettings,
  pubchemId: number,
): Promise<number> {
  if (settings.useMock) {
    for (const list of Object.values(MOCK_MOLECULES)) {
      const hit = list.find((m) => m.pubchem_id === pubchemId);
      if (hit?.df) return hit.df;
    }
    return 1;
  }

  const base = normalizeBaseUrl(settings.baseUrl);
  const data = await fetchJson<unknown>(
    `${base}/molecules_data/by-id/${pubchemId}/entities`,
    settings.authToken,
  );
  const entities = unwrapList<unknown>(data);
  return entities.length || 1;
}

export async function enrichMoleculesWithDf(
  settings: ApiSettings,
  molecules: MoleculeCompact[],
  onProgress?: (done: number, total: number) => void,
): Promise<MoleculeCompact[]> {
  const needsDf = molecules.filter((m) => !readDf(m as MoleculeCompact & Record<string, unknown>));
  if (needsDf.length === 0) return molecules;

  const out = [...molecules];
  let done = 0;
  const total = needsDf.length;

  for (const mol of needsDf) {
    const df = await getMoleculeDf(settings, mol.pubchem_id);
    const idx = out.findIndex((m) => m.pubchem_id === mol.pubchem_id);
    if (idx >= 0) out[idx] = { ...out[idx], df };
    done++;
    onProgress?.(done, total);
  }

  return out;
}

export function pairingScore(
  moleculesA: RankedMolecule[],
  moleculesB: RankedMolecule[],
): { score: number; shared: RankedMolecule[] } {
  const idsB = new Set(moleculesB.map((m) => m.pubchem_id));
  const shared = moleculesA.filter((m) => idsB.has(m.pubchem_id));
  const score = shared.reduce((sum, m) => sum + m.importance, 0);
  return { score, shared };
}
