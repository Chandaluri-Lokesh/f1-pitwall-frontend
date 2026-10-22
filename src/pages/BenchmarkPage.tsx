import { useState } from 'react'
import { runCOABenchmark } from '@/api/client'
import BenchmarkChart from '@/components/BenchmarkChart'
import type { BenchmarkResult, RaceConfig, MemLayout } from '@/types'

const DEFAULT_RACE: RaceConfig = {
  total_laps: 57,
  pit_loss_seconds: 21.5,
  base_lap_time: 90.0,
  fuel_effect_per_lap: 0.04,
  circuit_name: 'monza',
}

export default function BenchmarkPage() {
  const [race, setRace]           = useState<RaceConfig>(DEFAULT_RACE)
  const [numSims, setNumSims]     = useState(10000)
  const [numThreads, setNumThreads] = useState(4)
  const [layout, setLayout]       = useState<MemLayout>('aos')
  const [useGpu, setUseGpu]       = useState(false)
  const [result, setResult]       = useState<BenchmarkResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleBenchmark() {
    setLoading(true)
    setError(null)
    try {
      const r = await runCOABenchmark({
        race, num_simulations: numSims, num_threads: numThreads, layout,
        use_gpu: useGpu,
      })
      setResult(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">COA Benchmark</h1>
        <p className="text-white/40 text-sm mt-1">
          Monte Carlo simulation latency across single-core, multi-core, and memory layouts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Sim Config</h2>

          <div>
            <label className="label">Simulations</label>
            <input className="input-field" type="number" value={numSims}
              onChange={e => setNumSims(+e.target.value)} />
          </div>
          <div>
            <label className="label">Max Threads (OMP)</label>
            <input className="input-field" type="number" min={1} max={32} value={numThreads}
              onChange={e => setNumThreads(+e.target.value)} />
          </div>
          <div>
            <label className="label">Memory Layout</label>
            <select className="input-field" value={layout}
              onChange={e => setLayout(e.target.value as MemLayout)}>
              <option value="aos">Array of Structs (AoS)</option>
              <option value="soa">Struct of Arrays (SoA)</option>
            </select>
          </div>

          <hr className="border-white/10" />
          <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Race Config</h2>

          <div>
            <label className="label">Circuit</label>
            <input className="input-field" value={race.circuit_name}
              onChange={e => setRace(r => ({ ...r, circuit_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Total Laps</label>
            <input className="input-field" type="number" value={race.total_laps}
              onChange={e => setRace(r => ({ ...r, total_laps: +e.target.value }))} />
          </div>

          <hr className="border-white/10" />
          <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">GPU</h2>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setUseGpu(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                useGpu ? 'bg-purple-500' : 'bg-white/10'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                useGpu ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <span className="text-sm text-white/70 group-hover:text-white transition-colors">
              Include CUDA run
            </span>
            {useGpu && (
              <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                GPU
              </span>
            )}
          </label>
          {useGpu && (
            <p className="text-xs text-white/30 leading-relaxed">
              Requires backend compiled with <span className="font-mono text-white/50">ENABLE_CUDA=ON</span>.
              The server returns an error if no GPU is available.
            </p>
          )}

          <button onClick={handleBenchmark} disabled={loading} className="btn-primary w-full">
            {loading ? 'Running...' : 'Run Benchmark'}
          </button>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <div className="card">
                <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
                  Timing Results
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                        <th className="text-left py-2 pr-4">Impl</th>
                        <th className="text-right py-2 pr-4">Wall (ms)</th>
                        <th className="text-right py-2 pr-4">Threads</th>
                        <th className="text-right py-2 pr-4">Layout</th>
                        <th className="text-right py-2">Speedup</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((r, i) => {
                        const base = result.results[0]?.wall_clock_ms ?? 1
                        const isCuda = r.impl_tag === 'cuda'
                        return (
                          <tr key={i} className={`border-b border-white/5 ${isCuda ? 'bg-purple-500/5' : ''}`}>
                            <td className="py-2.5 pr-4 font-mono text-xs">
                              {r.impl_tag}
                              {isCuda && (
                                <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                                  GPU
                                </span>
                              )}
                            </td>
                            <td className="text-right py-2.5 pr-4 font-mono">{r.wall_clock_ms.toFixed(2)}</td>
                            <td className="text-right py-2.5 pr-4">
                              {isCuda ? (
                                <span className="text-purple-300">{r.threads_used.toLocaleString()}</span>
                              ) : r.threads_used}
                            </td>
                            <td className="text-right py-2.5 pr-4 text-white/50">{r.layout.toUpperCase()}</td>
                            <td className={`text-right py-2.5 font-mono ${isCuda ? 'text-purple-400' : 'text-green-400'}`}>
                              {(base / r.wall_clock_ms).toFixed(2)}x
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
                  Charts
                </h2>
                <BenchmarkChart results={result.results} />
              </div>
            </>
          ) : (
            <div className="card h-64 flex items-center justify-center text-white/20 text-sm">
              Configure simulation parameters and click Run Benchmark
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
