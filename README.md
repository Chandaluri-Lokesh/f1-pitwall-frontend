# F1 PitWall — Frontend

> React + TypeScript SPA for visualising F1 pit-stop strategies, algorithm comparisons, and Monte Carlo benchmarks.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

F1 PitWall is a full-stack Formula 1 strategy analysis tool. This frontend communicates with the [C++ backend](https://github.com/Chandaluri-Lokesh/f1-pitwall-backend) to run five pit-stop optimization algorithms on real telemetry data and visualise their results side-by-side.

All `/api/*` requests are proxied to `localhost:8080` by Vite — no CORS configuration needed in development.

---

## Features

- **Strategy Page** — pick a circuit, driver, and team; select which algorithms to run; view lap-time overlay chart and per-algorithm results table
- **Benchmark Page** — configure Monte Carlo simulations (count, threads, AoS/SoA layout, CUDA toggle); view timing table with speedup column and bar charts
- **Compare Page** — run two independent scenarios side-by-side; overlaid lap-time chart (red vs. blue); combined results table with delta column
- **Live Timing Page** — real-time F1 data via OpenF1 API; session info, flag/SC banners, driver grid, pit stop table, race control feed

---

## Quick Start

The C++ backend must be running on port `8080` before starting the frontend.

```bash
# Install dependencies
npm install

# Start dev server (proxies /api/* to localhost:8080)
npm run dev

# Production build
npm run build
```

Dev server runs on `http://localhost:5173` (or `:5174` if taken).

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Overview cards linking to each module |
| `/strategy` | DSA Strategy | Circuit + driver + algo picker, lap-time chart, results table |
| `/benchmark` | COA Benchmark | Monte Carlo config, timing table, speedup bar charts |
| `/compare` | Compare | Dual-scenario panels, overlaid chart, delta table |
| `/live` | Live Timing | Real-time OpenF1 data — no backend required |

---

## Components

| Component | Description |
|---|---|
| `StrategyChart` | Recharts line chart — one lap-time series per algorithm, `<ReferenceLine>` at each pit stop |
| `AlgoComparison` | Results table — algorithm, total race time, stop count, states explored, wall ms |
| `BenchmarkChart` | Two bar charts (wall time ms + speedup); CUDA bar rendered in purple via Recharts `<Cell>` |
| `TeamDriverPicker` | Fetches `/api/drivers` + `/api/teams`; displays `tyre_mgmt_factor` per driver |
| `Navbar` | Top navigation bar with route links |

---

## API Clients

| File | Description |
|---|---|
| `src/api/client.ts` | Axios instance (`baseURL: /api`) — all backend calls |
| `src/api/openf1.ts` | Direct browser calls to `api.openf1.org/v1/` — used only by Live Timing |

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| HTTP client | Axios |
| Routing | React Router v6 |
| Utilities | clsx |

---

## Project Structure

```
src/
  api/
    client.ts         Axios wrapper for all backend endpoints
    openf1.ts         OpenF1 REST client for live timing
  components/
    AlgoComparison.tsx
    BenchmarkChart.tsx
    Navbar.tsx
    StrategyChart.tsx
    TeamDriverPicker.tsx
  hooks/
    useApi.ts         Generic data-fetching hook
  pages/
    DashboardPage.tsx
    StrategyPage.tsx
    BenchmarkPage.tsx
    ComparePage.tsx
    LivePage.tsx
  types/
    index.ts          Shared TypeScript interfaces (RaceConfig, HarnessResult, SimResult, …)
  App.tsx             Router setup
  main.tsx            React entry point
index.html
vite.config.ts        Dev proxy: /api/* → localhost:8080
tailwind.config.js
tsconfig.json
```

---

## Related

- **Backend:** [f1-pitwall-backend](https://github.com/Chandaluri-Lokesh/f1-pitwall-backend) — C++17 solver engine + HTTP API
