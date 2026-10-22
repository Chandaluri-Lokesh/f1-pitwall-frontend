import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { SimResult } from '@/types'

const CUDA_COLOR = '#A855F7'

interface Props {
  results: SimResult[]
}

export default function BenchmarkChart({ results }: Props) {
  if (!results.length) return null

  const baseTime = results.find(r => r.impl_tag === 'single')?.wall_clock_ms ?? 1

  const data = results.map(r => ({
    name: r.impl_tag,
    wall_ms: parseFloat(r.wall_clock_ms.toFixed(2)),
    speedup: parseFloat((baseTime / r.wall_clock_ms).toFixed(2)),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="label mb-3">Wall Clock Time (ms)</p>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#38383F" />
              <XAxis dataKey="name" stroke="#ffffff40" tick={{ fontSize: 11 }} />
              <YAxis stroke="#ffffff40" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#15151E', border: '1px solid #38383F', borderRadius: 8 }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="wall_ms" fill="#E10600" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'cuda' ? CUDA_COLOR : '#E10600'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="label mb-3">Speedup vs Single-thread</p>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#38383F" />
              <XAxis dataKey="name" stroke="#ffffff40" tick={{ fontSize: 11 }} />
              <YAxis stroke="#ffffff40" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#15151E', border: '1px solid #38383F', borderRadius: 8 }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="speedup" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'cuda' ? CUDA_COLOR : '#3B82F6'} />
                ))}
              </Bar>
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
