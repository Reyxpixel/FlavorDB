

## Project structure

```
flavordb/
├── package.json          # root — runs both server and client
├── server/
│   └── index.js          # Express API server (port 5000)
└── client/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.jsx           # view router (browse / molecules / pairings)
        ├── categories.js     # category → colour map
        └── components/
            ├── Shared.jsx    # Spinner, CatTag, RarityChip, Expander, bars
            ├── BrowsePage.jsx
            ├── MoleculesPage.jsx
            └── PairingsPage.jsx
```

---

## Setup

**Prerequisites:** Node.js ≥ 18, npm ≥ 9

```bash
# 1. Install all dependencies (root + client)
npm run install-all

# 2. Start both server and client together
npm run dev
```

The server starts at **http://localhost:5000**  
The React app starts at **http://localhost:3000** (auto-opens in browser)

> The React dev server proxies all `/api/…` requests to the Express server,
> so you only need to open `localhost:3000`.

---

## API routes (Express server)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/search?q=mango&page=0` | Search entities by name |
| GET | `/api/molecules/:entityId` | Get ranked molecules (importance = 1/df(m)) |
| GET | `/api/pairings/:entityId?entityName=Mango` | Stream pairing results via SSE |

The pairings endpoint uses **Server-Sent Events** so the browser receives
live progress updates while the server scores all ~936 FlavorDB ingredients.

---

## How the ranking works

For each molecule `m` in ingredient `A`:

```
df(m)         = number of ingredients in FlavorDB that contain molecule m
Importance(m) = 1 / df(m)
```

Molecules are ranked by `Importance` descending — rarer molecules score higher.

For pairing ingredient `A` with `B`:

```
Pair(A, B) = Σ Importance(m)  for all m shared by A and B
```

Ingredients are ranked by `Pair` score descending.


---

## Molecule detail view

Clicking a molecule name from the molecules list opens a JSmol-backed molecule detail page with a 2D image toggle and a list of ingredients that contain the molecule.
