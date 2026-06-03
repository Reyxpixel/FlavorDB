import type { Entity, MoleculeCompact } from "../types";

/** Demo data when IIITD API is unreachable (Mango-style profile). */
export const MOCK_ENTITIES: Entity[] = [
  {
    entity_id: 42,
    entity_alias_readable: "Mango",
    category: "Fruit",
    natural_source_name: "Mangifera indica",
  },
  {
    entity_id: 88,
    entity_alias_readable: "Durian",
    category: "Fruit",
    natural_source_name: "Durio",
  },
  {
    entity_id: 15,
    entity_alias_readable: "Peanut",
    category: "Legume",
    natural_source_name: "Arachis hypogaea",
  },
];

export const MOCK_MOLECULES: Record<number, MoleculeCompact[]> = {
  42: [
    { pubchem_id: 12345, common_name: "δ-Decalactone", df: 3 },
    { pubchem_id: 6549, common_name: "Linalool", df: 130 },
    { pubchem_id: 7843, common_name: "β-Myrcene", df: 85 },
    { pubchem_id: 5281515, common_name: "Limonene", df: 210 },
    { pubchem_id: 998, common_name: "Ethyl butanoate", df: 45 },
    { pubchem_id: 440917, common_name: "α-Pinene", df: 175 },
    { pubchem_id: 7463, common_name: "β-Caryophyllene", df: 92 },
    { pubchem_id: 31253, common_name: "Geraniol", df: 68 },
  ],
  88: [
    { pubchem_id: 12345, common_name: "δ-Decalactone", df: 3 },
    { pubchem_id: 7843, common_name: "β-Myrcene", df: 85 },
    { pubchem_id: 31253, common_name: "Geraniol", df: 68 },
    { pubchem_id: 8892, common_name: "Ethyl 2-methylbutanoate", df: 12 },
  ],
  15: [
    { pubchem_id: 6549, common_name: "Linalool", df: 130 },
    { pubchem_id: 5281515, common_name: "Limonene", df: 210 },
    { pubchem_id: 440917, common_name: "α-Pinene", df: 175 },
  ],
};

export function searchMockEntities(query: string): Entity[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_ENTITIES;
  return MOCK_ENTITIES.filter(
    (e) =>
      e.entity_alias_readable?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q),
  );
}
