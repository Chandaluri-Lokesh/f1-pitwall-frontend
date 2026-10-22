import { useState, useEffect } from 'react'
import { solveDSA, listCircuits, getCircuit } from '@/api/client'
import type { HarnessResult, RaceConfig, StrategyResult } from '@/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import clsx from 'clsx'

// ── helpers ────────────────────────────────────────────────────────────────

const DEFAULT_ALGOS = ['dp', 'greedy', 'astar']

const ALGO_LABELS: Record<string, string> = {
  dp: 'DP', greedy: 'Greedy', bb: 'B&B', astar: 'A*', dijkstra: 'Dijkstra', ga: 'GA',
}

const ALGO_LIST = ['dp', 'greedy', 'bb', 'astar', 'dijkstra', 'ga']

function defaultConfig(): RaceConfig {
  return {
    total_laps: 57, pit_loss_seconds: 21.5,
    base_lap_time: 90.0, fuel_effect_per_lap: 0.04,
    circuit_name: 'monza', race_year: '2024',
  }
}

function formatTime(s: number) {
  if (!s || s >= 1e15) return '—'
  const m = Math.floor(s / 60)
  return `${m}m ${(s % 60).toFixed(2)}s`
}

// Build per-lap degradation estimate for the overlay chart
function buildLapSeries(result: StrategyResult, totalLaps: number, baseLapTime: number) {
  const stops = [...result.stops].sort((a, b) => a.lap - b.lap)
  const pts: number[] = []
  let age = 0, si = 0
  for (let lap = 1; lap <= totalLaps; lap++) {
    if (si < stops.length && stops[si].lap === lap) { age = 0; si++ }
    pts.push(parseFloat((baseLapTime + age * 0.05).toFixed(3)))
    age++
  }
  return pts
}

// ── sub-components ─────────────────────────────────────────────────────────

interface ScenarioFormProps {
  label: string
  accentColor: string
  config: RaceConfig
  algos: string[]
  driver: string
  circuits: { circuit_id: string; year: number }[]
  onConfigChange: (c: RaceConfig) => void
  onAlgosChange: (a: string[]) => void
  onDriverChange: (d: string) => void
  loading: boolean
  error: string | null
  result: HarnessResult | null
}

function ScenarioForm({
  label, accentColor, config, algos, driver, circuits,
  onConfigChange, onAlgosChange, onDriverChange,
  loading, error, result,
}: ScenarioFormProps) {
  function toggleAlgo(id: string) {
    onAlgosChange(algos.includes(id) ? algos.filter(a => a !== id) : [...algos, id])
  }

  async function handleCircuitChange(circuit_id: string, year: number) {
    onConfigChange({ ...config, circuit_name: circuit_id, race_year: String(year) })
    try {
      const info = await getCircuit(circuit_id, year)
      onConfigChange({
        ...config,
        circuit_name: circuit_id, race_year: String(year),
        total_laps: info.total_laps, pit_loss_seconds: info.pit_loss_seconds,
        base_lap_time: info.base_lap_time, fuel_effect_per_lap: info.fuel_effect_per_lap,
      })
    } catch { /* keep defaults */ }
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
        <h2 className="font-semibold text-sm">{label}</h2>
        {result && (
          <span className="ml-auto text-xs text-white/40 font-mono">
            {formatTime(result.best.total_race_time)}
          </span>
        )}
      </div>

      {/* Circuit */}
      <div>
        <label className="label">Circuit</label>
        {circuits.length > 0 ? (
          <select
            className="input-field"
            value={`${config.circuit_name}_${config.race_year}`}
            onChange={e => {
              const [cid, yr] = e.target.value.split('_')
              handleCircuitChange(cid, Number(yr))
            }}
          >
            {circuits.map(c => (
              <option key={`${c.circuit_id}_${c.year}`} value={`${c.circuit_id}_${c.year}`}>
                {c.circuit_id} {c.year}
              </option>
            ))}
          </select>
        ) : (
          <input className="input-field" value={config.circuit_name}
            onChange={e => onConfigChange({ ...config, circuit_name: e.target.value })} />
        )}
      </div>

      {/* Driver */}
      <div>
        <label className="label">Driver (abbreviation, optional)</label>
        <input className="input-field uppercase" placeholder="e.g. LEC, VER, ALO"
          value={driver} onChange={e => onDriverChange(e.target.value.toUpperCase())} />
      </div>

      {/* Laps */}
      <div>
        <label className="label">Total Laps</label>
        <input className="input-field" type="number" value={config.total_laps}
          onChange={e => onConfigChange({ ...config, total_laps: +e.target.value })} />
      </div>

      {/* Algorithms */}
      <div>
        <label className="label mb-2 block">Algorithms</label>
        <div className="grid grid-cols-3 gap-1">
          {ALGO_LIST.map(a => (
            <label key={a}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs',
                'border transition-all select-none',
                algos.includes(a)
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/5 text-white/30 hover:text-white/60'
              )}>
              <input type="checkbox" className="accent-f1red hidden"
                checked={algos.includes(a)} onChange={() => toggleAlgo(a)} />
              {ALGO_LABELS[a]}
            </label>
          ))}
        </div>
      </div>

      {loading && <p className="text-white/40 text-xs">Solving...</p>}
      {error && <p className="text-red-400 text-xs break-words">{error}</p>}

      {/* Best result summary */}
      {result && (
        <div className="bg-f1dark rounded-lg p-2.5 space-y-1 text-xs">
          <p className="text-white/40 uppercase tracking-wider text-xs mb-1">Best result</p>
          <div className="flex justify-between">
            <span className="text-white/50">Algorithm</span>
            <span className="text-white font-mono">{result.best.algorithm}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Race time</span>
            <span className="text-white font-mono">{formatTime(result.best.total_race_time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Stops</span>
            <span className="text-white font-mono">{result.best.stops_count}</span>
          </div>
          {result.best.stops.map(s => (
            <span key={s.lap} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-xs">
              L{s.lap} → {s.compound}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Overlaid chart ─────────────────────────────────────────────────────────

function OverlayChart({
  resultA, configA, colorA, labelA,
  resultB, configB, colorB, labelB,
}: {
  resultA: StrategyResult; configA: RaceConfig; colorA: string; labelA: string
  resultB: StrategyResult; configB: RaceConfig; colorB: string; labelB: string
}) {
  const totalLaps = Math.max(configA.total_laps, configB.total_laps)
  const seriesA = buildLapSeries(resultA, totalLaps, configA.base_lap_time)
  const seriesB = buildLapSeries(resultB, totalLaps, configB.base_lap_time)

  const data = Array.from({ length: totalLaps }, (_, i) => ({
    lap: i + 1,
    [labelA]: seriesA[i] ?? null,
    [labelB]: seriesB[i] ?? null,
  }))

  return (
    <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#38383F" />
          <XAxis dataKey="lap" stroke="#ffffff40" tick={{ fontSize: 11 }}
            label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: '#ffffff40', fontSize: 11 }} />
          <YAxis stroke="#ffffff40" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#15151E', border: '1px solid #38383F', borderRadius: 8 }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend />
          {/* pit stop reference lines for A */}
          {resultA.stops.map(s => (
            <ReferenceLine key={`a-${s.lap}`} x={s.lap} stroke={colorA} strokeOpacity={0.5}
              strokeDasharray="4 2" />
          ))}
          {/* pit stop reference lines for B */}
          {resultB.stops.map(s => (
            <ReferenceLine key={`b-${s.lap}`} x={s.lap} stroke={colorB} strokeOpacity={0.5}
              strokeDasharray="2 4" />
          ))}
          <Line type="monotone" dataKey={labelA} stroke={colorA} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey={labelB} stroke={colorB} dot={false} strokeWidth={2}
            strokeDasharray="6 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Combined algorithm table ───────────────────────────────────────────────

function CombinedTable({
  resultA, labelA, colorA,
  resultB, labelB, colorB,
}: {
  resultA: HarnessResult; labelA: string; colorA: string
  resultB: HarnessResult; labelB: string; colorB: string
}) {
  // Build a map keyed by algorithm name for quick lookup
  const mapA = Object.fromEntries(resultA.results.map(r => [r.algorithm, r]))
  const mapB = Object.fromEntries(resultB.results.map(r => [r.algorithm, r]))
  const allAlgos = Array.from(new Set([
    ...resultA.results.map(r => r.algorithm),
    ...resultB.results.map(r => r.algorithm),
  ]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider">
            <th className="text-left py-2 pr-3">Algorithm</th>
            <th className="text-right py-2 pr-3" style={{ color: colorA }}>{labelA} Time</th>
            <th className="text-right py-2 pr-3" style={{ color: colorB }}>{labelB} Time</th>
            <th className="text-right py-2 pr-3">Δ (A−B)</th>
            <th className="text-right py-2 pr-3" style={{ color: colorA }}>{labelA} ms</th>
            <th className="text-right py-2 pr-3" style={{ color: colorB }}>{labelB} ms</th>
            <th className="text-right py-2" style={{ color: colorA }}>{labelA} States</th>
            <th className="text-right py-2" style={{ color: colorB }}>{labelB} States</th>
          </tr>
        </thead>
        <tbody>
          {allAlgos.map(algo => {
            const a = mapA[algo]
            const b = mapB[algo]
            const delta = a && b ? a.total_race_time - b.total_race_time : null
            return (
              <tr key={algo} className="border-b border-white/5">
                <td className="py-2 pr-3 font-mono text-white/80">{algo}</td>
                <td className="text-right py-2 pr-3 font-mono"
                  style={{ color: colorA }}>{a ? formatTime(a.total_race_time) : '—'}</td>
                <td className="text-right py-2 pr-3 font-mono"
                  style={{ color: colorB }}>{b ? formatTime(b.total_race_time) : '—'}</td>
                <td className={clsx(
                  'text-right py-2 pr-3 font-mono',
                  delta === null ? 'text-white/30'
                    : delta > 0 ? 'text-red-400'
                    : delta < 0 ? 'text-green-400'
                    : 'text-white/50'
                )}>
                  {delta === null ? '—'
                    : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}s`}
                </td>
                <td className="text-right py-2 pr-3 text-white/50">
                  {a ? a.wall_clock_ms.toFixed(2) : '—'}
                </td>
                <td className="text-right py-2 pr-3 text-white/50">
                  {b ? b.wall_clock_ms.toFixed(2) : '—'}
                </td>
                <td className="text-right py-2 text-white/40 font-mono">
                  {a ? a.states_explored.toLocaleString() : '—'}
                </td>
                <td className="text-right py-2 text-white/40 font-mono">
                  {b ? b.states_explored.toLocaleString() : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const COLOR_A = '#E10600'  // f1 red
const COLOR_B = '#3B82F6'  // blue

export default function ComparePage() {
  const [circuits, setCircuits] = useState<{ circuit_id: string; year: number }[]>([])

  const [configA, setConfigA] = useState<RaceConfig>(defaultConfig())
  const [algosA, setAlgosA]   = useState<string[]>(DEFAULT_ALGOS)
  const [driverA, setDriverA] = useState('')
  const [resultA, setResultA] = useState<HarnessResult | null>(null)
  const [loadingA, setLoadingA] = useState(false)
  const [errorA, setErrorA]   = useState<string | null>(null)

  const [configB, setConfigB] = useState<RaceConfig>({
    ...defaultConfig(), circuit_name: 'monaco', race_year: '2024',
  })
  const [algosB, setAlgosB]   = useState<string[]>(DEFAULT_ALGOS)
  const [driverB, setDriverB] = useState('')
  const [resultB, setResultB] = useState<HarnessResult | null>(null)
  const [loadingB, setLoadingB] = useState(false)
  const [errorB, setErrorB]   = useState<string | null>(null)

  useEffect(() => {
    listCircuits().then(setCircuits).catch(() => {})
  }, [])

  async function runScenario(
    config: RaceConfig, algos: string[], driver: string,
    setLoading: (v: boolean) => void,
    setError: (v: string | null) => void,
    setResult: (v: HarnessResult) => void,
  ) {
    if (!algos.length) return
    setLoading(true); setError(null)
    try {
      const r = await solveDSA({ race: config, algorithms: algos, driver: driver || undefined })
      setResult(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function runA() {
    runScenario(configA, algosA, driverA, setLoadingA, setErrorA, setResultA)
  }
  function runB() {
    runScenario(configB, algosB, driverB, setLoadingB, setErrorB, setResultB)
  }
  function runBoth() { runA(); runB() }

  const labelA = `${configA.circuit_name} ${configA.race_year}${driverA ? ` · ${driverA}` : ''}`
  const labelB = `${configB.circuit_name} ${configB.race_year}${driverB ? ` · ${driverB}` : ''}`

  const bothReady = resultA && resultB
  const deltaTime = bothReady
    ? resultA.best.total_race_time - resultB.best.total_race_time
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compare Scenarios</h1>
        <p className="text-white/40 text-sm mt-1">
          Run two strategy configurations side-by-side — different circuits, drivers, or algorithm sets.
        </p>
      </div>

      {/* Scenario config panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScenarioForm
          label="Scenario A" accentColor={COLOR_A}
          config={configA} algos={algosA} driver={driverA} circuits={circuits}
          onConfigChange={setConfigA} onAlgosChange={setAlgosA} onDriverChange={setDriverA}
          loading={loadingA} error={errorA} result={resultA}
        />
        <ScenarioForm
          label="Scenario B" accentColor={COLOR_B}
          config={configB} algos={algosB} driver={driverB} circuits={circuits}
          onConfigChange={setConfigB} onAlgosChange={setAlgosB} onDriverChange={setDriverB}
          loading={loadingB} error={errorB} result={resultB}
        />
      </div>

      {/* Run controls */}
      <div className="flex gap-3">
        <button onClick={runBoth}
          disabled={loadingA || loadingB || !algosA.length || !algosB.length}
          className="btn-primary">
          {(loadingA || loadingB) ? 'Running...' : 'Run Both'}
        </button>
        <button onClick={runA} disabled={loadingA || !algosA.length}
          className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
          style={{ color: COLOR_A }}>
          Run A only
        </button>
        <button onClick={runB} disabled={loadingB || !algosB.length}
          className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
          style={{ color: COLOR_B }}>
          Run B only
        </button>
      </div>

      {/* Results */}
      {bothReady ? (
        <div className="space-y-4">

          {/* Delta banner */}
          <div className="card flex items-center gap-6 py-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_A }} />
              <span className="text-sm text-white/60 truncate max-w-40">{labelA}</span>
              <span className="font-mono font-semibold text-white">
                {formatTime(resultA.best.total_race_time)}
              </span>
            </div>
            <div className="flex-1 text-center">
              {deltaTime !== null && (
                <span className={clsx(
                  'text-xl font-bold font-mono',
                  Math.abs(deltaTime) < 0.5 ? 'text-white/50'
                    : deltaTime > 0 ? 'text-blue-400'
                    : 'text-f1red'
                )}>
                  {deltaTime > 0
                    ? `B faster by ${Math.abs(deltaTime).toFixed(2)}s`
                    : deltaTime < 0
                    ? `A faster by ${Math.abs(deltaTime).toFixed(2)}s`
                    : 'Tied'}
                </span>
              )}
              <p className="text-white/30 text-xs mt-0.5">best algorithm vs best algorithm</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-white">
                {formatTime(resultB.best.total_race_time)}
              </span>
              <span className="text-sm text-white/60 truncate max-w-40">{labelB}</span>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_B }} />
            </div>
          </div>

          {/* Overlaid lap chart */}
          <div className="card">
            <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
              Strategy Lap Chart — Best of Each Scenario
            </h2>
            <OverlayChart
              resultA={resultA.best} configA={configA} colorA={COLOR_A} labelA={labelA}
              resultB={resultB.best} configB={configB} colorB={COLOR_B} labelB={labelB}
            />
            <div className="mt-3 flex gap-4 text-xs text-white/40">
              <span>
                <span className="inline-block w-6 border-t-2 mr-1 align-middle"
                  style={{ borderColor: COLOR_A }} />
                A pit stops
              </span>
              <span>
                <span className="inline-block w-6 border-t-2 border-dashed mr-1 align-middle"
                  style={{ borderColor: COLOR_B }} />
                B pit stops
              </span>
            </div>
          </div>

          {/* Combined algorithm comparison table */}
          <div className="card">
            <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
              Algorithm-by-Algorithm Comparison
            </h2>
            <CombinedTable
              resultA={resultA} labelA="A" colorA={COLOR_A}
              resultB={resultB} labelB="B" colorB={COLOR_B}
            />
            <p className="mt-3 text-xs text-white/30">
              Δ (A−B): negative = A faster, positive = B faster. Wall time in milliseconds.
            </p>
          </div>

        </div>
      ) : (resultA || resultB) ? (
        // One scenario done, waiting for the other
        <div className="card flex items-center justify-center h-32 text-white/30 text-sm">
          {resultA
            ? `Scenario A done (${formatTime(resultA.best.total_race_time)}) — run Scenario B to compare`
            : `Scenario B done (${formatTime(resultB!.best.total_race_time)}) — run Scenario A to compare`}
        </div>
      ) : (
        <div className="card flex items-center justify-center h-32 text-white/20 text-sm">
          Configure both scenarios and click Run Both
        </div>
      )}
    </div>
  )
}
