# FlavorDB — Rarity-Weighted Ranking Project

Prototype for ranking flavor molecules per ingredient using **Importance(m) = 1 / df(m)** and computing **Pair(A,B)** over shared molecules.

## Quick start

```bash
cd prototype
npm install
npm run dev
```

See [prototype/README.md](prototype/README.md) for API endpoints, VPN/proxy setup, and mock mode.

## Postman collections

- `FlavorDB_Complete.postman_collection.json` — original 40 endpoints
- `FlavorDB_Complete.postman_collection (1).json` — adds three endpoints for your use case:
  - `GET /entities/by-id/{id}/molecules` — full profiles, rarity-sorted
  - `GET /entities/by-id/{id}/molecules-compact` — `pubchem_id` + `common_name`, rarity-sorted
  - `GET /molecules_data/by-id/{pubchemId}/entities` — reverse lookup for **df(m)**
