import type { StrategyResult } from '@/types'
import clsx from 'clsx'

interface Props {
  results: StrategyResult[]
  best?: StrategyResult
}

const ALGO_COLORS: Record<string, string> = {
  'Dynamic Programming': 'bg-blue-500/20 text-blue-300',
  'Greedy':              'bg-yellow-500/20 text-yellow-300',
  'Branch & Bound':      'bg-purple-500/20 text-purple-300',
  'A*':                  'bg-green-500/20 text-green-300',
  'Dijkstra':            'bg-teal-500/20 text-teal-300',
  'Genetic Algorithm':   'bg-orange-500/20 text-orange-300',
}

function formatTime(secs: number) {
  if (!secs || secs === Infinity) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3)
  return `${m}m ${s}s`
}

export default function AlgoComparison({ results, best }: Props) {
  if (!results.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
            <th className="text-left py-2 pr-4">Algorithm</th>
            <th className="text-right py-2 pr-4">Race Time</th>
            <th className="text-right py-2 pr-4">Stops</th>
            <th className="text-right py-2 pr-4">Wall ms</th>
            <th className="text-right py-2">States</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const isBest = best?.algorithm === r.algorithm
            return (
              <tr
                key={r.algorithm}
                className={clsx(
                  'border-b border-white/5 transition-colors',
                  isBest && 'bg-green-500/5'
                )}
              >
                <td className="py-2.5 pr-4">
                  <span className={clsx('badge', ALGO_COLORS[r.algorithm] ?? 'bg-white/10 text-white')}>
                    {r.algorithm}
                  </span>
                  {isBest && (
                    <span className="ml-2 badge bg-green-500/20 text-green-400">best</span>
                  )}
                </td>
                <td className="text-right py-2.5 pr-4 font-mono">
                  {formatTime(r.total_race_time)}
                </td>
                <td className="text-right py-2.5 pr-4">{r.stops_count}</td>
                <td className="text-right py-2.5 pr-4 font-mono text-white/60">
                  {r.wall_clock_ms.toFixed(2)}
                </td>
                <td className="text-right py-2.5 font-mono text-white/60">
                  {r.states_explored.toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
