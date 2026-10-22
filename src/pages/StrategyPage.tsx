import { useState, useEffect } from 'react'
import { solveDSA, getCircuit, listCircuits } from '@/api/client'
import AlgoComparison from '@/components/AlgoComparison'
import StrategyChart from '@/components/StrategyChart'
import TeamDriverPicker from '@/components/TeamDriverPicker'
import type { HarnessResult, RaceConfig, Team, Driver } from '@/types'
import clsx from 'clsx'

const ALGORITHMS = [
  { id: 'dp',       label: 'Dynamic Programming' },
  { id: 'greedy',   label: 'Greedy' },
  { id: 'bb',       label: 'Branch & Bound' },
  { id: 'astar',    label: 'A*' },
  { id: 'dijkstra', label: 'Dijkstra' },
  { id: 'ga',       label: 'Genetic Algorithm' },
]

// Data structure options per algorithm
const DS_OPTIONS: Record<string, { id: string; label: string }[]> = {
  dp:       [{ id: '3d_array', label: '3D Array' }, { id: 'hash_map', label: 'Hash Map (sparse)' }],
  astar:    [{ id: 'binary_heap', label: 'Binary Heap' }, { id: 'sorted_array', label: 'Sorted Array' }],
  dijkstra: [{ id: 'binary_heap', label: 'Binary Heap' }, { id: 'sorted_array', label: 'Sorted Array' }],
  bb:       [{ id: 'stack_dfs', label: 'Stack (DFS)' }, { id: 'queue_bfs', label: 'Queue (BFS)' }],
  greedy:   [{ id: 'linear_scan', label: 'Linear Scan' }],
  ga:       [{ id: 'vector', label: 'std::vector' }],
}

const DEFAULT_CONFIG: RaceConfig = {
  total_laps: 57,
  pit_loss_seconds: 21.5,
  base_lap_time: 90.0,
  fuel_effect_per_lap: 0.04,
  circuit_name: 'monza',
  race_year: '2024',
}

export default function StrategyPage() {
  const [config, setConfig]           = useState<RaceConfig>(DEFAULT_CONFIG)
  const [algos, setAlgos]             = useState<string[]>(['dp', 'greedy', 'astar'])
  const [dsMap, setDsMap]             = useState<Record<string, string>>({})
  const [result, setResult]           = useState<HarnessResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [selectedAlgo, setSelectedAlgo] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [circuits, setCircuits]       = useState<{ circuit_id: string; year: number }[]>([])
  const [circuitLoading, setCircuitLoading] = useState(false)

  // Load available circuits on mount
  useEffect(() => {
    listCircuits().then(setCircuits).catch(() => {})
  }, [])

  // Auto-fill config when circuit+year changes
  async function handleCircuitChange(circuit_id: string, year: number) {
    setConfig(c => ({ ...c, circuit_name: circuit_id, race_year: String(year) }))
    setCircuitLoading(true)
    try {
      const info = await getCircuit(circuit_id, year)
      setConfig(c => ({
        ...c,
        total_laps:          info.total_laps,
        pit_loss_seconds:    info.pit_loss_seconds,
        base_lap_time:       info.base_lap_time,
        fuel_effect_per_lap: info.fuel_effect_per_lap,
      }))
    } catch {
      // Backend not running yet — keep defaults
    } finally {
      setCircuitLoading(false)
    }
  }

  async function handleSolve() {
    setLoading(true)
    setError(null)
    try {
      const r = await solveDSA({
        race:            config,
        algorithms:      algos,
        driver:          selectedDriver?.abbreviation,
        team:            selectedTeam?.team_id,
        data_structures: dsMap,
      })
      setResult(r)
      setSelectedAlgo(r.best.algorithm)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function toggleAlgo(id: string) {
    setAlgos(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function setDs(algo: string, ds: string) {
    setDsMap(prev => ({ ...prev, [algo]: ds }))
  }

  const displayResult = result?.results.find(r => r.algorithm === selectedAlgo) ?? result?.best
  const effectivePitLoss = result?.effective_pit_loss ?? config.pit_loss_seconds
  const tyreMgmt = result?.tyre_mgmt_factor ?? 1.0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DSA Strategy Optimizer</h1>
        <p className="text-white/40 text-sm mt-1">
          Select your team, driver, and algorithms — then compare strategy outputs side-by-side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ---------------------------------------------------------------- */}
        {/* Left column: Team/Driver + Race Config                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-4">

          {/* Team + Driver */}
          <div className="card">
            <TeamDriverPicker
              selectedTeam={selectedTeam}
              selectedDriver={selectedDriver}
              onTeamChange={setSelectedTeam}
              onDriverChange={setSelectedDriver}
            />
          </div>

          {/* Race Config */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Race Config</h2>

            {/* Circuit selector from DB */}
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
                  onChange={e => setConfig(c => ({ ...c, circuit_name: e.target.value }))} />
              )}
              {circuitLoading && <p className="text-white/30 text-xs mt-1">Loading circuit data...</p>}
            </div>

            <div>
              <label className="label">Total Laps</label>
              <input className="input-field" type="number" value={config.total_laps}
                onChange={e => setConfig(c => ({ ...c, total_laps: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Base Pit Loss (s)</label>
              <input className="input-field" type="number" step="0.1" value={config.pit_loss_seconds}
                onChange={e => setConfig(c => ({ ...c, pit_loss_seconds: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Base Lap Time (s)</label>
              <input className="input-field" type="number" step="0.1" value={config.base_lap_time}
                onChange={e => setConfig(c => ({ ...c, base_lap_time: +e.target.value }))} />
            </div>

            {/* Effective values after driver/team adjustment */}
            {(selectedTeam || selectedDriver) && (
              <div className="bg-f1dark rounded-lg p-2.5 space-y-1 text-xs">
                <p className="text-white/40 uppercase tracking-wider text-xs mb-1.5">Adjusted Values</p>
                <div className="flex justify-between">
                  <span className="text-white/50">Effective pit loss</span>
                  <span className="text-white font-mono">{effectivePitLoss.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Tyre mgmt factor</span>
                  <span className={clsx('font-mono', tyreMgmt < 1 ? 'text-green-400' : tyreMgmt > 1 ? 'text-orange-400' : 'text-white')}>
                    {tyreMgmt.toFixed(2)}x
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Middle column: Algorithm + DS selection                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Algorithms & Data Structures</h2>

          <div className="space-y-3">
            {ALGORITHMS.map(a => (
              <div key={a.id}>
                <label className="flex items-center gap-2 cursor-pointer text-sm mb-1">
                  <input type="checkbox" checked={algos.includes(a.id)}
                    onChange={() => toggleAlgo(a.id)} className="accent-f1red" />
                  <span className={algos.includes(a.id) ? 'text-white' : 'text-white/40'}>
                    {a.label}
                  </span>
                </label>
                {algos.includes(a.id) && DS_OPTIONS[a.id] && DS_OPTIONS[a.id].length > 1 && (
                  <select
                    className="input-field text-xs ml-5 w-[calc(100%-1.25rem)]"
                    value={dsMap[a.id] ?? DS_OPTIONS[a.id][0].id}
                    onChange={e => setDs(a.id, e.target.value)}
                  >
                    {DS_OPTIONS[a.id].map(ds => (
                      <option key={ds.id} value={ds.id}>{ds.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSolve} disabled={loading || algos.length === 0}
            className="btn-primary w-full mt-2">
            {loading ? 'Solving...' : 'Run Solvers'}
          </button>

          {error && <p className="text-red-400 text-xs break-words">{error}</p>}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right 2 columns: Results                                         */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Context bar */}
              {(result.driver_abbreviation || result.team_id) && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-sm">
                  {selectedTeam && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTeam.color }} />
                      <span className="text-white/60">{selectedTeam.team_name}</span>
                    </span>
                  )}
                  {selectedDriver && (
                    <span className="font-semibold text-white">{selectedDriver.full_name}</span>
                  )}
                  <span className="ml-auto text-white/30 text-xs">
                    pit loss: {result.effective_pit_loss?.toFixed(2)}s &nbsp;|&nbsp;
                    tyre mgmt: {result.tyre_mgmt_factor?.toFixed(2)}x
                  </span>
                </div>
              )}

              {/* Comparison table */}
              <div className="card">
                <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
                  Algorithm Comparison
                </h2>
                <AlgoComparison results={result.results} best={result.best} />
              </div>

              {/* Lap chart */}
              {displayResult && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">
                      Strategy Lap Chart
                    </h2>
                    <select className="input-field w-auto text-xs"
                      value={selectedAlgo ?? ''}
                      onChange={e => setSelectedAlgo(e.target.value)}>
                      {result.results.map(r => (
                        <option key={r.algorithm} value={r.algorithm}>{r.algorithm}</option>
                      ))}
                    </select>
                  </div>
                  <StrategyChart
                    result={displayResult}
                    totalLaps={config.total_laps}
                    baseLapTime={config.base_lap_time}
                  />
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {displayResult.stops.map(s => (
                      <span key={s.lap} className="badge bg-white/10 text-white/70">
                        Lap {s.lap} → {s.compound}
                      </span>
                    ))}
                    {!displayResult.stops.length && (
                      <span className="text-white/30 text-xs">
                        No stops returned (algorithm pending implementation)
                      </span>
                    )}
                  </div>
                  {displayResult.data_structure && (
                    <p className="mt-2 text-xs text-white/30">
                      Data structure: <span className="text-white/50">{displayResult.data_structure}</span>
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card h-64 flex flex-col items-center justify-center text-white/20 text-sm gap-2">
              <span>Select a team and driver, configure the race,</span>
              <span>then click Run Solvers</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
