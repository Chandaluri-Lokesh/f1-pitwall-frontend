# F1 PitWall — Frontend

React 18 + TypeScript SPA. Requires the C++ backend running on `:8080`.

All `/api/*` requests are proxied by Vite — no CORS configuration needed in development.

## Setup

```bash
npm install
npm run dev        # dev server on :5173
npm run build      # production build → dist/
```

## Pages

| Route | Page | Description |
| --- | --- | --- |
| `/` | Dashboard | Three module cards linking to each section |
| `/strategy` | DSA Strategy | Circuit picker, driver/team selector, algorithm checkboxes, lap-time overlay chart, per-algorithm results table |
| `/benchmark` | COA Benchmark | Sim config (sims, OMP threads, AoS/SoA layout), CUDA toggle, timing table with speedup, bar charts |
| `/compare` | Compare | Two scenario panels (A = red, B = blue), overlay lap-time chart, combined results table with Δ column |
| `/live` | Live Timing | Real-time F1 data via OpenF1 — session header, flag/SC banners, driver grid, pit stop table, race control feed |

## Components

| Component | Description |
| --- | --- |
| `BenchmarkChart` | Two bar charts (wall ms · speedup); CUDA bar rendered in purple via Recharts `<Cell>` |
| `StrategyChart` | Lap-time lines per algorithm with `<ReferenceLine>` markers at each pit stop |
| `AlgoComparison` | Sortable results table: algorithm, race time, stops, states explored, wall ms |
| `TeamDriverPicker` | Fetches `/api/drivers` + `/api/teams`; shows `tyre_mgmt_factor` |

## API clients

| File | Used by |
| --- | --- |
| `src/api/client.ts` | All backend calls (Axios, baseURL `/api`) |
| `src/api/openf1.ts` | Live Timing page — direct browser calls to `api.openf1.org/v1/`; no backend involved |

## Stack

- **React 18** + **TypeScript**
- **Vite** — dev server + proxy + production build
- **Tailwind CSS** — utility-first styling
- **Recharts** — bar charts, line charts, reference lines
- **Axios** — HTTP client
- **React Router v6** — client-side routing
- **clsx** — conditional className merging
