const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const BASE_URL = 'http://192.168.1.92:9208/flavordb';
const PORT = 5000;
const PAGE_SIZE = 24;
const MAX_CONCURRENT = 16;

const cache = {
  allEntitiesPromise: null,
  moleculesByEntity: new Map(),      // entityId -> Promise<array>
  moleculeDfByPubchemId: new Map(),  // pubchemId -> Promise<number>
  moleculeEntitiesPayloadByPubchemId: new Map(), // pubchemId -> Promise<payload>
  moleculeOverviewByPubchemId: new Map(), // pubchemId -> Promise<overview>
  moleculeDetailsHtmlByPubchemId: new Map(), // pubchemId -> Promise<html>
  moleculeMorePropertiesByPubchemId: new Map(), // pubchemId -> Promise<flat properties>
  foodPairingsByName: new Map(),     // name -> Promise<array>
  pairingsByKey: new Map(),          // `${entityId}|${entityName}` -> Promise<array>
  searchByName: new Map(),           // query -> Promise<array>
};

app.use(cors());
app.use(express.json());

// ─── pLimit shim (works with both ESM p-limit and CJS fallback) ───────────
let pLimit;
(async () => {
  try {
    const mod = await import('p-limit');
    pLimit = mod.default;
  } catch {
    // simple fallback concurrency limiter
    pLimit = (n) => {
      let active = 0;
      const queue = [];
      const run = async (fn, resolve, reject) => {
        active++;
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          active--;
          if (queue.length) {
            const [nextFn, nextRes, nextRej] = queue.shift();
            run(nextFn, nextRes, nextRej);
          }
        }
      };
      return (fn) => {
        if (active < n) return new Promise((res, rej) => run(fn, res, rej));
        return new Promise((res, rej) => queue.push([fn, res, rej]));
      };
    };
  }
})();

// ─── Helpers ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  'additive', 'animalproduct', 'bakery', 'beverage', 'beveragealcoholic',
  'beveragecaffeinated', 'cereal', 'maize', 'dairy', 'dish', 'essentialoil',
  'fish', 'seafood', 'flower', 'fruit', 'berry', 'fruitcitrus', 'fruitessence',
  'fungus', 'herb', 'meat', 'legume', 'nutseed', 'plant', 'plantderivative',
  'spice', 'vegetable', 'cabbage', 'vegetablefruit', 'vegetablegourd',
  'vegetableroot', 'vegetablestem', 'vegetabletuber',
];

async function fdbGet(path, params = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await axios.get(url, { params, timeout: 30000 });
    return res.data;
  } catch (err) {
    console.error('FDB GET ERROR:', path, err.message);
    throw err;
  }
}

function bestList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['content', 'data', 'results', 'items', 'molecules', 'entities']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  // walk to find longest array
  let best = [];
  function walk(obj) {
    if (Array.isArray(obj)) {
      if (obj.length > best.length) best = obj;
      obj.forEach(walk);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(walk);
    }
  }
  walk(payload);
  return best;
}

function parseEntityRows(payload) {
  return bestList(payload).reduce((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const eid = item.entity_id ?? item.id;
    if (eid == null) return acc;
    acc.push({
      id: parseInt(eid, 10),
      name:
        item.entity_alias_readable ||
        item.entity_alias ||
        item.entity_name ||
        item.name ||
        `Entity ${eid}`,
      category: item.category_readable || item.category || '',
      source: item.natural_source_name || '',
    });
    return acc;
  }, []);
}

function parseMoleculeRows(payload) {
  return bestList(payload).reduce((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const pid = item.pubchem_id ?? item.pubchemId ?? item.id;
    if (pid == null) return acc;
    // Preserve df/frequency if the compact endpoint provides it
    const df = item.df ?? item.frequency ?? item.document_frequency ?? item.documentFrequency ?? null;
    acc.push({
      pubchem_id: parseInt(pid, 10),
      name: item.common_name || item.commonName || item.name || `Molecule ${pid}`,
      ...(df != null ? { df: parseInt(df, 10) || 1 } : {}),
    });
    return acc;
  }, []);
}

function parseFoodPairingEntities(payload) {
  let candidates = [];
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.topSimilarEntities)) candidates = payload.topSimilarEntities;
  }
  if (!candidates.length) candidates = bestList(payload);
  const seen = new Set();
  return candidates.reduce((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const eid = item.entity_id ?? item.entityId ?? item.id ?? item.entityID;
    const name = item.entity_alias_readable || item.entityName || item.entity_alias || item.name || '';
    if (!name) return acc;
    const eidInt = eid != null ? parseInt(eid, 10) : null;
    const key = eidInt ?? name.trim().toLowerCase();
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push({
      id: eidInt,
      name: name.trim(),
      category: item.category_readable || item.categoryReadable || item.category || '',
    });
    return acc;
  }, []);
}

function moleculeDf(payload) {
  const listLen = bestList(payload).length;
  let te = 0;
  if (payload && typeof payload === 'object') {
    for (const key of ['totalElements', 'total_elements', 'total']) {
      if (typeof payload[key] === 'number' && payload[key] > 0) {
        te = payload[key];
        break;
      }
    }
  }
  const count = Math.max(listLen, te);
  return count > 0 ? count : 1;
}

function scoreFromDf(df) {
  return 1.0 / Math.max(df, 1);
}

function rarityLabel(df) {
  if (df === 1) return { label: 'unique', cls: 'rarity-unique' };
  if (df <= 5) return { label: 'rare', cls: 'rarity-rare' };
  if (df <= 50) return { label: 'common', cls: 'rarity-common' };
  return { label: 'ubiquitous', cls: 'rarity-ubiq' };
}


function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function primitiveText(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'string') return value.trim() || '—';
  if (Array.isArray(value)) {
    const parts = value.map(primitiveText).filter(Boolean).filter(v => v !== '—');
    return parts.length ? parts.join(', ') : '—';
  }
  if (typeof value === 'object') {
    for (const key of ['value', 'text', 'label', 'name', 'result', 'display', 'description', 'message']) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const nested = primitiveText(value[key]);
        if (nested !== '—') return nested;
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function collectPropertyEntries(payload) {
  const entries = [];
  const seen = new Set();

  const pushEntry = (label, value) => {
    const text = primitiveText(value);
    const key = `${normalizeKey(label)}|${normalizeKey(text)}`;
    if (!label || text === '—' || seen.has(key)) return;
    seen.add(key);
    entries.push({ label: String(label).trim(), value: text });
  };

  const walk = (value, path = []) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const label =
            item.property_name ?? item.propertyName ?? item.label ?? item.name ?? item.key ?? item.field ?? item.title ?? '';
          const rawValue =
            item.value ?? item.result ?? item.text ?? item.display ?? item.description ?? item.message ?? item.data;
          if (label && rawValue !== undefined) pushEntry(label, rawValue);
          walk(item, path);
        } else {
          const label = path.join(' ').trim();
          if (label) pushEntry(label, item);
        }
      }
      return;
    }

    if (typeof value !== 'object') {
      const label = path.join(' ').trim();
      if (label) pushEntry(label, value);
      return;
    }

    const objectLabel =
      value.property_name ?? value.propertyName ?? value.label ?? value.name ?? value.key ?? value.field ?? value.title ?? '';
    const objectValue =
      value.value ?? value.result ?? value.text ?? value.display ?? value.description ?? value.message ?? value.data;
    if (objectLabel && objectValue !== undefined) {
      pushEntry(objectLabel, objectValue);
    }

    for (const [key, nested] of Object.entries(value)) {
      if (key === 'value' || key === 'result' || key === 'text' || key === 'display' || key === 'description' || key === 'message' || key === 'data') {
        continue;
      }
      const nextPath = path.concat(key);
      if (nested && typeof nested === 'object') {
        walk(nested, nextPath);
      } else {
        pushEntry(nextPath.join(' '), nested);
      }
    }
  };

  walk(payload);
  return entries;
}

function findBestPropertyValue(entries, aliases) {
  const aliasList = (aliases || []).map(normalizeKey).filter(Boolean);
  let best = null;
  let bestScore = 0;

  for (const entry of entries) {
    const labelNorm = normalizeKey(entry.label);
    if (!labelNorm) continue;

    for (const alias of aliasList) {
      let score = 0;
      if (labelNorm === alias) score = 100;
      else if (labelNorm.includes(alias) || alias.includes(labelNorm)) score = 80;
      else if (labelNorm.startsWith(alias) || alias.startsWith(labelNorm)) score = 60;
      else if (labelNorm.split(alias).length > 1 || alias.split(labelNorm).length > 1) score = 40;

      if (score > bestScore) {
        best = entry;
        bestScore = score;
      }
    }
  }

  return best ? best.value : '—';
}

function buildPropertySections(payload) {
  const entries = collectPropertyEntries(payload);
  const field = (label, aliases) => ({ label, value: findBestPropertyValue(entries, aliases) });

  return {
    physicochemical: [
      field('Molecular weight', ['molecular weight', 'molecularweight', 'mw']),
      field('HBD count', ['hbd count', 'hydrogen bond donor count', 'hydrogenbonddonorcount', 'donor count']),
      field('HBA count', ['hba count', 'hydrogen bond acceptor count', 'hydrogenbondacceptorcount', 'acceptor count']),
      field('Number of rotatable bonds', ['rotatable bonds', 'number of rotatable bonds', 'rotatablebondcount']),
      field('Complexity', ['complexity']),
      field('Topological Polar Surface Area', ['topological polar surface area', 'topological polor surface area', 'topologicalpolarsurfacearea', 'psa 2d', 'tpsa']),
      field('Monoisotopic Mass', ['monoisotopic mass']),
      field('Exact Mass', ['exact mass']),
      field('XlogP', ['xlogp']),
      field('Charge', ['charge']),
      field('Heavy Atom Count', ['heavy atom count', 'number of atoms', 'heavyatomcount']),
      field('Atom Stereocenter Count', ['atom stereocenter count']),
      field('Defined Atom Stereocenter Count', ['defined atom stereocenter count']),
      field('Undefined Atom Stereocenter Count', ['undefined atom stereocenter count']),
      field('Bond Stereocenter Count', ['bond stereocenter count']),
      field('Defined Bond Stereocenter Count', ['defined bond stereocenter count']),
      field('Undefined Bond Stereocenter Count', ['undefined bond stereocenter count']),
      field('Isotope Atom Count', ['isotope atom count']),
      field('Covalently Bounded Unit Count', ['covalently bounded unit count']),
      field('InChI', ['inchi']),
      field('Volume 3D', ['volume 3d', 'vloume 3d', '3d volume']),
    ],
    admet: [
      field('ADMET Solubility', ['admet solubility']),
      field('ADMET Solubility Level', ['admet solubility level']),
      field('ADMET BBB', ['admet bbb']),
      field('ADMET BBB Level', ['admet bbb level']),
      field('ADMET EXT Hepatotoxic', ['admet ext hepatotoxic']),
      field('ADMET EXT Hepatotoxic prediction md', ['admet ext hepatotoxic prediction md']),
      field('ADMET EXT Hepatotoxic applicability', ['admet ext hepatotoxic applicability']),
      field('ADMET EXT Hepatotoxic applicability md', ['admet ext hepatotoxic applicability md']),
      field('ADMET EXT Hepatotoxic applicability mdpvalue', ['admet ext hepatotoxic applicability mdpvalue']),
      field('ADMET Absorption Level', ['admet absorption level']),
      field('ADMET EXT PPB', ['admet ext ppb']),
      field('ADMET EXT PPB prediction', ['admet ext ppb prediction']),
      field('ADMET EXT PPB applicability', ['admet ext ppb applicability']),
      field('ADMET EXT PPB applicability md', ['admet ext ppb applicability md']),
      field('ADMET EXT PPB applicability mdpvalue', ['admet ext ppb applicability mdpvalue']),
      field('ADMET unknown AlogP98', ['admet unknown alogp98']),
      field('ADMET AlogP98', ['admet alogp98']),
      field('ADMET PSA 2D', ['admet psa 2d']),
    ],
    structure: [
      field('Number of atoms', ['number of atoms']),
      field('Molecular formula', ['molecular formula']),
      field('Molecular composition', ['molecular composition']),
      field('Molecular mass', ['molecular mass']),
      field('Energy', ['energy']),
      field('AlogP', ['alogp']),
      field('LogD', ['logd']),
      field('Molecular Solubility', ['molecular solubility', 'molecular solubilty', 'molecular solubility (estimated)']),
      field('pKa', ['pka']),
      field('Number of aromatic bonds', ['number of aromatic bonds', 'aromatic bonds']),
      field('Number of aromatic rings', ['number of aromatic rings', 'aromatic rings']),
      field('Number of H acceptor', ['number of h acceptor', 'h acceptor']),
      field('Number of H acceptor lipinski', ['number of h acceptor lipinski']),
      field('Number of H donor', ['number of h donor', 'h donor']),
      field('Number of H donor lipinski', ['number of h donor lipinski']),
      field('Number of H bonds', ['number of h bonds', 'h bonds']),
      field('Number of rings', ['number of rings']),
      field('Surface area (SA)', ['surface area', 'sa']),
      field('Molecular SASA (Solvent accessible SA)', ['molecular sasa', 'solvent accessible sa', 'sasa']),
      field('Radius of gyration', ['radius of gyration']),
      field('Molecular 3D SASA', ['molecular 3d sasa']),
    ],
  };
}

async function fetchPubChemProperties(pubchemId) {
  try {
    const fields = [
      'MolecularWeight','HBondDonorCount','HBondAcceptorCount','RotatableBondCount',
      'Complexity','TPSA','MonoisotopicMass','ExactMass','XLogP','Charge',
      'HeavyAtomCount','AtomStereoCount','DefinedAtomStereoCount','UndefinedAtomStereoCount',
      'BondStereoCount','DefinedBondStereoCount','UndefinedBondStereoCount',
      'IsotopeAtomCount','CovalentUnitCount','InChI','Volume3D',
      'MolecularFormula','IUPACName',
    ].join(',');
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pubchemId}/property/${fields}/JSON`;
    const res = await axios.get(url, { timeout: 15000 });
    const props = res.data?.PropertyTable?.Properties?.[0] || {};
    return props;
  } catch (err) {
    console.error('PubChem fetch failed for', pubchemId, err.message);
    return {};
  }
}

function extractFlatProperties(payload) {
  // The more_properties endpoint likely returns a paginated response like:
  // {content: [{pubchem_id: 7664, admet_solubility: -3.33, ...}]}
  // OR it may return the array directly.
  // Try to find the first object that looks like a properties record.
  const candidates = [];

  function collectFlat(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(collectFlat);
      return;
    }
    // If this object has admet or property-looking keys, it's a candidate
    const keys = Object.keys(obj);
    const hasProps = keys.some(k => {
      const kl = k.toLowerCase();
      return kl.includes('admet') || kl.includes('solubility') || kl.includes('bbb') ||
             kl.includes('alogp') || kl.includes('energy') || kl.includes('molecular') ||
             kl.includes('surface') || kl.includes('aromatic') || kl.includes('donor') ||
             kl.includes('acceptor') || kl.includes('rings') || kl.includes('logd') ||
             kl.includes('gyration') || kl.includes('composition');
    });
    if (hasProps) candidates.push(obj);
    else keys.forEach(k => collectFlat(obj[k]));
  }

  collectFlat(payload);

  if (candidates.length === 0) return {};

  // Merge all candidates (in case properties are split across multiple objects)
  const merged = {};
  candidates.forEach(c => Object.assign(merged, c));
  return merged;
}


function parseMoleculeDetailsHtml(html) {
  if (typeof html !== 'string') return {};

  const flat = {};
  const addPair = (label, value) => {
    const rawLabel = String(label || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/:&nbsp;|:&amp;nbsp;|:\s*$/g, '')
      .replace(/:\s*$/,'')
      .replace(/\s+/g, ' ')
      .trim();
    const rawValue = String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (rawLabel) flat[rawLabel] = rawValue || '—';
  };

  // Primary parser: <li class="list-group-item"><strong>Label:</strong> Value</li>
  const liRegex = /<li[^>]*class=["'][^"']*list-group-item[^"']*["'][^>]*>[\s\S]*?<strong>(.*?)<\/strong>\s*([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html))) addPair(match[1], match[2]);

  // Fallback parser: table rows like <tr><td>Label</td><td>Value</td></tr>
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  while ((match = trRegex.exec(html))) {
    const rowHtml = match[1] || '';
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml))) {
      const txt = String(cellMatch[1] || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (txt) cells.push(txt);
    }
    if (cells.length >= 2) {
      addPair(cells[0], cells.slice(1).join(' '));
    }
  }

  return flat;
}

function getFlatProp(flat, ...keys) {
  for (const key of keys) {
    // Try exact key
    if (flat[key] !== undefined && flat[key] !== null) return String(flat[key]);
    // Try case-insensitive
    const kl = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(flat)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === kl) {
        if (v !== undefined && v !== null) return String(v);
      }
    }
  }
  return '—';
}

const ATOMIC_WEIGHTS = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Br: 79.904,
  I: 126.90447,
  B: 10.81,
  Si: 28.085,
  Na: 22.989769,
  K: 39.0983,
  Ca: 40.078,
  Mg: 24.305,
  Al: 26.981538,
  Fe: 55.845,
  Zn: 65.38,
  Cu: 63.546,
  Mn: 54.938044,
  Co: 58.933194,
  Ni: 58.6934,
  Se: 78.971,
  Cr: 51.9961,
  Li: 6.94,
};

function deriveCompositionFromFormula(formula) {
  const f = String(formula || '').trim();
  if (!f || f === '—') return '—';

  const counts = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let match;
  let any = false;
  while ((match = re.exec(f))) {
    const elem = match[1];
    const count = match[2] ? parseInt(match[2], 10) : 1;
    if (!Number.isFinite(count) || count <= 0) continue;
    counts[elem] = (counts[elem] || 0) + count;
    any = true;
  }
  if (!any) return '—';

  let totalMass = 0;
  for (const [elem, count] of Object.entries(counts)) {
    const weight = ATOMIC_WEIGHTS[elem];
    if (!weight) return '—';
    totalMass += weight * count;
  }
  if (!totalMass) return '—';

  const order = Object.keys(counts).sort((a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return b === 'C' ? 1 : -1;
    if (b === 'H') return a === 'C' ? -1 : 1;
    return a.localeCompare(b);
  });

  return order
    .map((elem) => `${elem}: ${(ATOMIC_WEIGHTS[elem] * counts[elem] / totalMass).toFixed(3)}`)
    .join(', ');
}


function buildSectionsFromMerged(pubProps, flat) {
  // Build scrollable sections from a mixed flat object (HTML labels + snake_case keys)
  const fromPubChem = (key) => {
    const value = pubProps?.[key];
    return value === undefined || value === null || value === '' ? null : String(value);
  };

  const fromFlat = (...keys) => {
    for (const key of keys) {
      if (!key) continue;
      if (flat[key] !== undefined && flat[key] !== null && flat[key] !== '') {
        return String(flat[key]);
      }
      const kn = normalizeKey(key);
      for (const [k, v] of Object.entries(flat || {})) {
        if (normalizeKey(k) === kn && v !== undefined && v !== null && v !== '') {
          return String(v);
        }
      }
    }
    return null;
  };

  const pick = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== '' && value !== '—') {
        return String(value);
      }
    }
    return '—';
  };

  const physicochemical = [
    { label: 'Molecular weight',                   value: pick(fromFlat('Molecular weight', 'molecular weight', 'molecularweight'), fromPubChem('MolecularWeight')) },
    { label: 'HBD count',                          value: pick(fromFlat('HBD count', 'hbd count', 'hydrogen bond donor count', 'donor count'), fromPubChem('HBondDonorCount')) },
    { label: 'HBA count',                          value: pick(fromFlat('HBA count', 'hba count', 'hydrogen bond acceptor count', 'acceptor count'), fromPubChem('HBondAcceptorCount')) },
    { label: 'Number of rotatable bonds',          value: pick(fromFlat('Number of rotatable bonds', 'rotatable bonds', 'rotatablebondcount'), fromPubChem('RotatableBondCount')) },
    { label: 'Complexity',                         value: pick(fromFlat('Complexity', 'complexity', 'molecular complexity'), fromPubChem('Complexity')) },
    { label: 'Topological Polar Surface Area',     value: pick(fromFlat('Topological Polar Surface Area', 'Topological Polor Surface Area', 'Topological Polar Surface Area (TPSA)', 'psa 2d', 'tpsa'), fromPubChem('TPSA')) },
    { label: 'Monoisotopic Mass',                  value: pick(fromFlat('Monoisotopic Mass', 'monoisotopic mass'), fromPubChem('MonoisotopicMass')) },
    { label: 'Exact Mass',                         value: pick(fromFlat('Exact Mass', 'exact mass'), fromPubChem('ExactMass')) },
    { label: 'XlogP',                              value: pick(fromFlat('XlogP', 'xlogp', 'x log p'), fromPubChem('XLogP')) },
    { label: 'Charge',                             value: pick(fromFlat('Charge', 'charge'), fromPubChem('Charge')) },
    { label: 'Heavy Atom Count',                   value: pick(fromFlat('Heavy Atom Count', 'heavy atom count', 'number of atoms'), fromPubChem('HeavyAtomCount')) },
    { label: 'Atom Stereocenter Count',            value: pick(fromFlat('Atom Stereocenter Count', 'atom stereocenter count'), fromPubChem('AtomStereoCount')) },
    { label: 'Defined Atom Stereocenter Count',    value: pick(fromFlat('Defined Atom Stereocenter Count', 'defined atom stereocenter count'), fromPubChem('DefinedAtomStereoCount')) },
    { label: 'Undefined Atom Stereocenter Count',  value: pick(fromFlat('Undefined Atom Stereocenter Count', 'undefined atom stereocenter count'), fromPubChem('UndefinedAtomStereoCount')) },
    { label: 'Bond Stereocenter Count',            value: pick(fromFlat('Bond Stereocenter Count', 'bond stereocenter count'), fromPubChem('BondStereoCount')) },
    { label: 'Defined Bond Stereocenter Count',    value: pick(fromFlat('Defined Bond Stereocenter Count', 'defined bond stereocenter count'), fromPubChem('DefinedBondStereoCount')) },
    { label: 'Undefined Bond Stereocenter Count',  value: pick(fromFlat('Undefined Bond Stereocenter Count', 'undefined bond stereocenter count'), fromPubChem('UndefinedBondStereoCount')) },
    { label: 'Isotope Atom Count',                 value: pick(fromFlat('Isotope Atom Count', 'isotope atom count'), fromPubChem('IsotopeAtomCount')) },
    { label: 'Covalently Bounded Unit Count',      value: pick(fromFlat('Covalently Bounded Unit Count', 'covalently bounded unit count'), fromPubChem('CovalentUnitCount')) },
    { label: 'InChI',                              value: pick(fromFlat('InChI', 'inchi'), fromPubChem('InChI')) },
    { label: 'Volume 3D',                          value: pick(fromFlat('Volume 3D', 'volume 3d', 'vloume 3d', '3d volume'), fromPubChem('Volume3D')) },
  ].map(r => ({ ...r, value: r.value || '—' }));

  const admet = [
    { label: 'ADMET Solubility',                             value: pick(fromFlat('ADMET Solubility', 'admet_solubility', 'admetsolubility', 'solubility')) },
    { label: 'ADMET Solubility Level',                       value: pick(fromFlat('ADMET Solubility Level', 'admet_solubility_level', 'admetsolubilitylevel')) },
    { label: 'ADMET BBB',                                    value: pick(fromFlat('ADMET BBB', 'admet_bbb', 'admetbbb', 'bbb')) },
    { label: 'ADMET BBB Level',                              value: pick(fromFlat('ADMET BBB Level', 'admet_bbb_level', 'admetbbblevel')) },
    { label: 'ADMET EXT Hepatotoxic',                        value: pick(fromFlat('ADMET EXT Hepatotoxic', 'admet_ext_hepatotoxic', 'ext_hepatotoxic', 'hepatotoxic')) },
    { label: 'ADMET EXT Hepatotoxic prediction md',          value: pick(fromFlat('ADMET EXT Hepatotoxic prediction md', 'admet_ext_hepatotoxic_prediction_md', 'ext_hepatotoxic_prediction_md')) },
    { label: 'ADMET EXT Hepatotoxic applicability',          value: pick(fromFlat('ADMET EXT Hepatotoxic applicability', 'admet_ext_hepatotoxic_applicability', 'ext_hepatotoxic_applicability')) },
    { label: 'ADMET EXT Hepatotoxic applicability md',       value: pick(fromFlat('ADMET EXT Hepatotoxic applicability md', 'admet_ext_hepatotoxic_applicability_md', 'ext_hepatotoxic_applicability_md')) },
    { label: 'ADMET EXT Hepatotoxic applicability mdpvalue', value: pick(fromFlat('ADMET EXT Hepatotoxic applicability mdpvalue', 'admet_ext_hepatotoxic_applicability_mdpvalue', 'ext_hepatotoxic_applicability_mdpvalue')) },
    { label: 'ADMET Absorption Level',                       value: pick(fromFlat('ADMET Absorption Level', 'admet_absorption_level', 'absorption_level')) },
    { label: 'ADMET EXT PPB',                                value: pick(fromFlat('ADMET EXT PPB', 'admet_ext_ppb', 'ext_ppb', 'ppb')) },
    { label: 'ADMET EXT PPB prediction',                     value: pick(fromFlat('ADMET EXT PPB prediction', 'admet_ext_ppb_prediction', 'ext_ppb_prediction')) },
    { label: 'ADMET EXT PPB applicability',                  value: pick(fromFlat('ADMET EXT PPB applicability', 'admet_ext_ppb_applicability', 'ext_ppb_applicability')) },
    { label: 'ADMET EXT PPB applicability md',               value: pick(fromFlat('ADMET EXT PPB applicability md', 'admet_ext_ppb_applicability_md', 'ext_ppb_applicability_md')) },
    { label: 'ADMET EXT PPB applicability mdpvalue',         value: pick(fromFlat('ADMET EXT PPB applicability mdpvalue', 'admet_ext_ppb_applicability_mdpvalue', 'ext_ppb_applicability_mdpvalue')) },
    { label: 'ADMET unknown AlogP98',                        value: pick(fromFlat('ADMET unknown AlogP98', 'admet_unknown_alogp98', 'unknown_alogp98')) },
    { label: 'ADMET AlogP98',                                value: pick(fromFlat('ADMET AlogP98', 'admet_alogp98', 'alogp98')) },
    { label: 'ADMET PSA 2D',                                 value: pick(fromFlat('ADMET PSA 2D', 'admet_psa_2d', 'psa_2d')) },
  ].map(r => ({ ...r, value: r.value || '—' }));

  const structure = [
    { label: 'Number of atoms',                        value: pick(fromFlat('Number of atoms', 'number of atoms', 'number_of_atoms'), fromPubChem('HeavyAtomCount')) },
    { label: 'Molecular formula',                      value: pick(fromFlat('Molecular formula', 'molecular formula'), fromPubChem('MolecularFormula')) },
    { label: 'Molecular composition',                  value: pick(fromFlat('Molecular composition', 'molecular composition', 'composition', 'molecular_composition'), deriveCompositionFromFormula(pick(fromFlat('Molecular formula', 'molecular formula'), fromPubChem('MolecularFormula')))) },
    { label: 'Molecular mass',                         value: pick(fromFlat('Molecular mass', 'molecular mass'), fromPubChem('MonoisotopicMass')) },
    { label: 'Energy',                                 value: pick(fromFlat('Energy', 'energy')) },
    { label: 'AlogP',                                  value: pick(fromFlat('AlogP', 'alogp'), fromPubChem('XLogP')) },
    { label: 'LogD',                                   value: pick(fromFlat('LogD', 'logd')) },
    { label: 'Molecular Solubility',                   value: pick(fromFlat('Molecular Solubility', 'Molecular Solubilty', 'molecular solubility', 'molecular solubilty')) },
    { label: 'pKa',                                    value: pick(fromFlat('pKa', 'pka')) },
    { label: 'Number of aromatic bonds',               value: pick(fromFlat('Number of aromatic bonds', 'number of aromatic bonds', 'aromatic bonds')) },
    { label: 'Number of aromatic rings',               value: pick(fromFlat('Number of aromatic rings', 'number of aromatic rings', 'aromatic rings')) },
    { label: 'Number of H acceptor',                   value: pick(fromFlat('Number of H acceptor', 'number of h acceptor', 'h acceptor'), fromPubChem('HBondAcceptorCount')) },
    { label: 'Number of H acceptor lipinski',          value: pick(fromFlat('Number of H acceptor lipinski', 'number of h acceptor lipinski')) },
    { label: 'Number of H donor',                      value: pick(fromFlat('Number of H donor', 'number of h donor', 'h donor'), fromPubChem('HBondDonorCount')) },
    { label: 'Number of H donor lipinski',             value: pick(fromFlat('Number of H donor lipinski', 'number of h donor lipinski')) },
    { label: 'Number of H bonds',                      value: pick(fromFlat('Number of H bonds', 'number of h bonds', 'h bonds')) },
    { label: 'Number of rings',                        value: pick(fromFlat('Number of rings', 'number of rings', 'num rings')) },
    { label: 'Surface area (SA)',                      value: pick(fromFlat('Surface area (SA)', 'surface area', 'sa')) },
    { label: 'Molecular SASA (Solvent accessible SA)', value: pick(fromFlat('Molecular SASA (Solvent accessible SA)', 'molecular sasa', 'solvent accessible sa', 'sasa')) },
    { label: 'Radius of gyration',                     value: pick(fromFlat('Radius of gyration', 'radius of gyration')) },
    { label: 'Molecular 3D SASA',                      value: pick(fromFlat('Molecular 3D SASA', 'molecular 3d sasa')) },
  ].map(r => ({ ...r, value: r.value || '—' }));

  return { physicochemical, admet, structure };
}

// Alias for any remaining references
const buildSectionsFromPubChem = buildSectionsFromMerged;


async function getMoleculeOverviewCached(pubchemId) {
  const key = String(pubchemId);
  if (!cache.moleculeOverviewByPubchemId.has(key)) {
    cache.moleculeOverviewByPubchemId.set(
      key,
      (async () => {
        const [entitiesPayload, detailsHtmlPayload, morePropertiesPayload, pubchemProps] = await Promise.allSettled([
          getMoleculeEntitiesPayloadCached(pubchemId),
          axios.get('https://cosylab.iiitd.edu.in/flavordb/molecules_details', { params: { id: pubchemId }, timeout: 15000 }).then(res => res.data),
          fdbGet('/more_properties/by-pubchemId-range', { min: pubchemId, max: pubchemId, page: 0, size: 20 }),
          fetchPubChemProperties(pubchemId),
        ]);

        const entitiesRaw = entitiesPayload.status === 'fulfilled' ? entitiesPayload.value : null;
        const entities = entitiesRaw ? parseEntityRows(entitiesRaw) : [];

        const detailsHtml = detailsHtmlPayload.status === 'fulfilled' ? detailsHtmlPayload.value : '';
        const detailsFlat = parseMoleculeDetailsHtml(detailsHtml);

        const morePropsRaw = morePropertiesPayload.status === 'fulfilled' ? morePropertiesPayload.value : null;
        const morePropsFlat = extractFlatProperties(morePropsRaw);

        const pubProps = pubchemProps.status === 'fulfilled' ? pubchemProps.value : {};

        const mergedFlat = { ...detailsFlat, ...morePropsFlat };

        return {
          entities,
          properties: mergedFlat,
          sections: buildSectionsFromMerged(pubProps, mergedFlat),
        };
      })()
    );
  }
  return cache.moleculeOverviewByPubchemId.get(key);
}

async function searchEntitiesCached(query, page = 0, size = PAGE_SIZE) {
  const key = `${String(query).trim().toLowerCase()}|${page}|${size}`;
  if (!cache.searchByName.has(key)) {
    cache.searchByName.set(
      key,
      (async () => {
        const payload = await fdbGet('/entities/by-entity-alias-readable', {
          entity_alias_readable: query,
          page,
          size,
        });
        return parseEntityRows(payload);
      })()
    );
  }
  return cache.searchByName.get(key);
}

async function getAllEntitiesCached() {
  if (cache.allEntities) return cache.allEntities;

  const seen = new Map();
  const letters = 'abcdefghijklmnopqrstuvwxyz';

  for (const letter of letters) {
    try {
      const firstPage = await fdbGet('/entities/by-entity-alias-readable', {
        entity_alias_readable: letter,
        page: 0,
        size: 500,
      });

      for (const e of parseEntityRows(firstPage)) {
        if (!seen.has(e.id)) seen.set(e.id, e);
      }

      const totalPages = parseInt(firstPage?.totalPages || 1, 10);

      for (let pg = 1; pg < totalPages; pg++) {
        try {
          const pagePayload = await fdbGet('/entities/by-entity-alias-readable', {
            entity_alias_readable: letter,
            page: pg,
            size: 500,
          });

          for (const e of parseEntityRows(pagePayload)) {
            if (!seen.has(e.id)) seen.set(e.id, e);
          }
        } catch {}
      }
    } catch {}
  }

  cache.allEntities = [...seen.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return cache.allEntities;
}

async function getEntityMoleculesCached(entityId) {
  const key = String(entityId);
  if (!cache.moleculesByEntity.has(key)) {
    cache.moleculesByEntity.set(
      key,
      (async () => {
        const payload = await fdbGet(`/entities/by-id/${entityId}/molecules-compact`);
        return parseMoleculeRows(payload);
      })()
    );
  }
  return cache.moleculesByEntity.get(key);
}

async function getMoleculeEntitiesPayloadCached(pubchemId) {
  const key = String(pubchemId);
  if (!cache.moleculeEntitiesPayloadByPubchemId.has(key)) {
    cache.moleculeEntitiesPayloadByPubchemId.set(
      key,
      (async () => {
        const payload = await fdbGet(`/molecules_data/by-id/${pubchemId}/entities`);
        return payload;
      })()
    );
  }
  return cache.moleculeEntitiesPayloadByPubchemId.get(key);
}

async function getMoleculeDfCached(pubchemId) {
  const key = String(pubchemId);
  if (!cache.moleculeDfByPubchemId.has(key)) {
    cache.moleculeDfByPubchemId.set(
      key,
      (async () => {
        try {
          const payload = await getMoleculeEntitiesPayloadCached(pubchemId);
          return moleculeDf(payload);
        } catch {
          return 1;
        }
      })()
    );
  }
  return cache.moleculeDfByPubchemId.get(key);
}

async function getFoodPairingsCached(entityName) {
  const key = String(entityName || '').trim().toLowerCase();
  if (!cache.foodPairingsByName.has(key)) {
    cache.foodPairingsByName.set(
      key,
      (async () => {
        const payload = await fdbGet('/food/by-alias', { food_pair: entityName });
        return parseFoodPairingEntities(payload);
      })()
    );
  }
  return cache.foodPairingsByName.get(key);
}

async function resolveEntityByName(name) {
  const q = String(name || '').trim();
  if (!q) return null;

  try {
    const rows = await searchEntitiesCached(q, 0, PAGE_SIZE);
    const target = q.toLowerCase();

    for (const row of rows) {
      if (row.name.trim().toLowerCase() === target) return row;
    }
    for (const row of rows) {
      const rn = row.name.trim().toLowerCase();
      if (target.includes(rn) || rn.includes(target)) return row;
    }
    return rows[0] || null;
  } catch {
    return null;
  }
}

async function scoreCandidate(entity, selectedIds, rankedById) {
  const rows = await getEntityMoleculesCached(entity.id);
  const candidateIds = new Set(rows.map(r => r.pubchem_id));
  const sharedIds = [...selectedIds].filter(id => candidateIds.has(id));

  const sharedRows = sharedIds
    .map(id => rankedById[id])
    .filter(Boolean)
    .sort((a, b) => b.importance - a.importance || a.pubchem_id - b.pubchem_id);

  return {
    id: entity.id,
    name: entity.name,
    category: entity.category,
    sharedCount: sharedRows.length,
    score: sharedRows.reduce((s, r) => s + r.importance, 0),
    sharedRows,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────

// Search entities
app.get('/api/search', async (req, res) => {
  try {
    const { q = '', page = 0, size = PAGE_SIZE } = req.query;
    const data = await fdbGet('/entities/by-entity-alias-readable', {
      entity_alias_readable: q,
      page,
      size,
    });
    const entities = parseEntityRows(data);
    const totalPages = data?.totalPages ?? null;
    const totalElements = data?.totalElements ?? null;
    res.json({ entities, totalPages, totalElements });
  } catch (err) {
    res.status(404).json({ error: 'Not found', detail: err.message });
  }
});

// Ranked molecules for an entity
app.get('/api/molecules/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const molecules = await getEntityMoleculesCached(entityId);

    if (!pLimit) {
      return res.status(503).json({ error: 'Server still initialising, retry in 1s' });
    }

    // If all molecules already have df from the compact endpoint, skip N+1 lookups
    const allHaveDf = molecules.every(m => m.df != null);

    let results;
    if (allHaveDf) {
      results = molecules.map(mol => ({
        pubchem_id: mol.pubchem_id,
        name: mol.name,
        df: mol.df,
        importance: scoreFromDf(mol.df),
      }));
    } else {
      const limit = pLimit(MAX_CONCURRENT);
      results = await Promise.all(
        molecules.map(mol =>
          limit(async () => {
            if (mol.df != null) {
              return { pubchem_id: mol.pubchem_id, name: mol.name, df: mol.df, importance: scoreFromDf(mol.df) };
            }
            try {
              const payload = await getMoleculeEntitiesPayloadCached(mol.pubchem_id);
              const df = moleculeDf(payload);
              return { pubchem_id: mol.pubchem_id, name: mol.name, df, importance: scoreFromDf(df) };
            } catch {
              return { pubchem_id: mol.pubchem_id, name: mol.name, df: 1, importance: 1.0 };
            }
          })
        )
      );
    }

    results.sort((a, b) => b.importance - a.importance || a.pubchem_id - b.pubchem_id);
    results.forEach(r => { r.rarity = rarityLabel(r.df); });
    res.json({ ranked: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/molecule-entities/:pubchemId', async (req, res) => {
  try {
    const { pubchemId } = req.params;
    const payload = await getMoleculeEntitiesPayloadCached(pubchemId);
    const entities = parseEntityRows(payload);
    res.json({ entities, totalElements: entities.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pairings for an entity (heavy — streams progress via SSE)
app.get('/api/pairings/:entityId', async (req, res) => {
  const { entityId } = req.params;
  const { entityName = '' } = req.query;
  const cacheKey = `${entityId}|${String(entityName).trim().toLowerCase()}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    if (cache.pairingsByKey.has(cacheKey)) {
      send('status', { msg: 'Serving cached pairings…' });
      const pairRows = await cache.pairingsByKey.get(cacheKey);
      send('done', { pairRows });
      res.end();
      return;
    }

    const work = (async () => {
      send('status', { msg: 'Loading molecules…' });

      const molecules = await getEntityMoleculesCached(entityId);

      if (!pLimit) {
        throw new Error('Server still initialising');
      }

      const limit = pLimit(MAX_CONCURRENT);

      const molResults = await Promise.all(
        molecules.map(mol =>
          limit(async () => {
            try {
              const payload = await getMoleculeEntitiesPayloadCached(mol.pubchem_id);
              const entityRows = parseEntityRows(payload);
              const df = moleculeDf(payload);
              return {
                pubchem_id: mol.pubchem_id,
                name: mol.name,
                df,
                importance: scoreFromDf(df),
                entityRows,
              };
            } catch {
              return {
                pubchem_id: mol.pubchem_id,
                name: mol.name,
                df: 1,
                importance: 1.0,
                entityRows: [],
              };
            }
          })
        )
      );

      molResults.sort((a, b) => b.importance - a.importance || a.pubchem_id - b.pubchem_id);

      const rankedById = {};
      molResults.forEach(r => {
        rankedById[r.pubchem_id] = r;
      });

      send('status', { msg: 'Scoring all shared-molecule pairings…' });

      const candidateMap = new Map();
      let done = 0;

      for (const mol of molResults) {
        try {
          const rows = Array.isArray(mol.entityRows) ? mol.entityRows : [];
          const seenForThisMol = new Set();

          for (const cand of rows) {
            if (!cand || cand.id == null) continue;
            const candId = parseInt(cand.id, 10);
            if (candId === parseInt(entityId, 10) || seenForThisMol.has(candId)) continue;
            seenForThisMol.add(candId);

            let agg = candidateMap.get(candId);
            if (!agg) {
              agg = {
                id: candId,
                name: cand.name,
                category: cand.category,
                sharedCount: 0,
                score: 0,
                sharedRows: [],
              };
              candidateMap.set(candId, agg);
            } else {
              if (!agg.name && cand.name) agg.name = cand.name;
              if (!agg.category && cand.category) agg.category = cand.category;
            }

            agg.sharedCount += 1;
            agg.score += mol.importance;
            agg.sharedRows.push({
              pubchem_id: mol.pubchem_id,
              name: mol.name,
              df: mol.df,
              importance: mol.importance,
              rarity: rarityLabel(mol.df),
            });
          }
        } catch (err) {
          console.error('PAIRING PASS ERROR', mol.pubchem_id, mol.name, err.message);
        }

        done += 1;
        if (done % 5 === 0 || done === molResults.length) {
          send('progress', { done, total: molResults.length });
        }
      }

      const pairRows = [...candidateMap.values()]
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score || b.sharedCount - a.sharedCount || a.name.localeCompare(b.name));

      pairRows.forEach(r => {
        r.sharedRows.sort((a, b) => b.importance - a.importance || a.pubchem_id - b.pubchem_id);
      });

      return pairRows;
    })();

    cache.pairingsByKey.set(cacheKey, work);

    const pairRows = await work;
    send('done', { pairRows });
    res.end();
  } catch (err) {
    cache.pairingsByKey.delete(cacheKey);
    send('error', { msg: err.message });
    res.end();
  }
});



app.get('/api/molecule-overview/:pubchemId', async (req, res) => {
  try {
    const pubchemId = parseInt(req.params.pubchemId, 10);
    if (!Number.isFinite(pubchemId)) {
      return res.status(400).json({ error: 'Invalid PubChem ID' });
    }

    const overview = await getMoleculeOverviewCached(pubchemId);
    res.json({
      pubchemId,
      entities: overview.entities,
      properties: overview.properties,
      sections: overview.sections,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load molecule overview', detail: err.message });
  }
});

// Debug endpoint: see exactly what FlavorDB returns for a molecule's raw data
// Hit /api/debug/7664 to inspect the raw JSON and fix field name mappings
app.get('/api/debug/:pubchemId', async (req, res) => {
  try {
    const pubchemId = parseInt(req.params.pubchemId, 10);
    const [entitiesRaw, propertiesRaw] = await Promise.allSettled([
      fdbGet(`/molecules_data/by-id/${pubchemId}/entities`),
      fdbGet('/more_properties/by-pubchemId-range', { min: pubchemId, max: pubchemId, page: 0, size: 20 }),
    ]);
    res.json({
      entities: {
        status: entitiesRaw.status,
        value: entitiesRaw.status === 'fulfilled' ? entitiesRaw.value : entitiesRaw.reason?.message,
      },
      properties: {
        status: propertiesRaw.status,
        value: propertiesRaw.status === 'fulfilled' ? propertiesRaw.value : propertiesRaw.reason?.message,
      },
      moreProperties: {
        status: propertiesRaw.status,
        value: propertiesRaw.status === 'fulfilled' ? propertiesRaw.value : propertiesRaw.reason?.message,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`FlavorDB API server running on http://localhost:${PORT}`));