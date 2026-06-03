# FlavorDB — Rarity-Ranked Molecules (Prototype)

Web UI for the TF-IDF–inspired flavor molecule ranking from your project notes:

- **Importance(m) = 1 / df(m)** — `df(m)` = number of ingredients containing molecule `m`
- **Pair(A, B) = Σ 1/df(m)** over shared molecules between ingredients A and B

## APIs used (from updated Postman collection)

| Purpose | Endpoint |
|--------|----------|
| Find ingredient | `GET /entities/by-entity-alias-readable?entity_alias_readable=…` |
| Molecules for ingredient (compact, rarity-sorted) | `GET /entities/by-id/{entity_id}/molecules-compact` |
| Full molecule profiles (rarity-sorted) | `GET /entities/by-id/{entity_id}/molecules` |
| Reverse lookup for df(m) | `GET /molecules_data/by-id/{pubchemId}/entities` |

## Run locally

```bash
cd prototype
npm install
npm run dev
```

Open http://localhost:5173

### Connecting to IIITD server

1. Be on the network that can reach `http://192.168.1.92:9208` (VPN if required).
2. In **API settings**, set base URL to `http://192.168.1.92:9208/flavordb` (or use dev proxy `/api/flavordb` — configured in `vite.config.ts`).
3. Paste your **Bearer token** if the API requires auth.
4. Search e.g. `mango`, select an entity, view ranked molecules.

### Offline demo

Enable **Use demo mock data** in settings to try Mango / Durian / Peanut without the API.

## Notes

- If `molecules-compact` does not include `df`, the app fetches entity lists per molecule (can take a while for large profiles).
- The server may already return molecules sorted by rarity; the UI still computes and displays **importance** explicitly for transparency.
