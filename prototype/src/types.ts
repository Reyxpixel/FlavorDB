export interface Entity {
  entity_id: number;
  entity_alias?: string;
  entity_alias_readable?: string;
  category?: string;
  natural_source_name?: string;
}

export interface MoleculeCompact {
  pubchem_id: number;
  common_name: string;
  /** Ingredient count across DB — df(m) when provided by API */
  df?: number;
  entity_count?: number;
  importance?: number;
}

export interface RankedMolecule extends MoleculeCompact {
  rank: number;
  importance: number;
  df: number;
}

export interface ApiSettings {
  baseUrl: string;
  authToken: string;
  useMock: boolean;
}
