import { useNavigate } from 'react-router-dom'

const cards = [
  {
    title: 'DSA Strategy Optimizer',
    route: '/strategy',
    tag: 'DSA',
    tagColor: 'bg-blue-500/20 text-blue-300',
    description:
      'Run DP, Greedy, Branch & Bound, A*, and Genetic Algorithm solvers ' +
      'on the same race scenario. Compare optimality vs computation time side-by-side.',
    metrics: ['5 algorithms', 'State: (lap, compound, tyre_age)', 'Comparison harness'],
  },
  {
    title: 'COA Benchmark',
    route: '/benchmark',
    tag: 'COA',
    tagColor: 'bg-orange-500/20 text-orange-300',
    description:
      'Benchmark Monte Carlo race simulations across single-core, multi-core (OpenMP), ' +
      'and GPU (CUDA). Study memory layout and compiler optimization effects.',
    metrics: ['AoS vs SoA layouts', 'OpenMP speedup curves', 'Amdahl\'s Law analysis'],
  },
  {
    title: 'Live Timing',
    route: '/live',
    tag: 'LIVE',
    tagColor: 'bg-green-500/20 text-green-300',
    description:
      'Real-time F1 session data via the OpenF1 public API — ' +
      'current tyre compounds, pit stop durations, race control messages, and driver gaps.',
    metrics: ['OpenF1 api.openf1.org', 'Auto-refresh every 30s', 'Tyre stint tracker'],
  },
]

export default function DashboardPage() {
  const nav = useNavigate()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          F1 <span className="text-f1red">PitWall</span>
        </h1>
        <p className="text-white/50 mt-2">
          Analytical engine for F1 strategy — DSA algorithm comparison &amp; COA performance benchmarking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <button
            key={c.route}
            onClick={() => nav(c.route)}
            className="card text-left hover:border-f1red/40 transition-all hover:bg-white/5 group"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold group-hover:text-f1red transition-colors">
                {c.title}
              </h2>
              <span className={`badge ${c.tagColor}`}>{c.tag}</span>
            </div>
            <p className="text-sm text-white/50 mb-4 leading-relaxed">{c.description}</p>
            <ul className="space-y-1">
              {c.metrics.map((m) => (
                <li key={m} className="text-xs text-white/40 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-f1red flex-shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  )
}
