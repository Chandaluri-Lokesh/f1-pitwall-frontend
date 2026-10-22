import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { StrategyResult } from '@/types'

interface Props {
  result: StrategyResult
  totalLaps: number
  baseLapTime: number
}

// Build per-lap time series from a strategy result for visualization
function buildLapData(result: StrategyResult, totalLaps: number, baseLapTime: number) {
  const stops = [...result.stops].sort((a, b) => a.lap - b.lap)
  const data: Array<{ lap: number; lapTime: number; compound: string }> = []

  let tyreAge = 0
  let stopIdx = 0
  let compound = stops.length > 0 ? 'Starting' : 'MEDIUM'

  for (let lap = 1; lap <= totalLaps; lap++) {
    if (stopIdx < stops.length && stops[stopIdx].lap === lap) {
      compound = stops[stopIdx].compound
      tyreAge = 0
      stopIdx++
    }
    // Simplified lap time for visualization (actual calculation is in C++ backend)
    const lapTime = baseLapTime + tyreAge * 0.05
    data.push({ lap, lapTime: parseFloat(lapTime.toFixed(3)), compound })
    tyreAge++
  }
  return data
}

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: '#E10600', MEDIUM: '#FFF200', HARD: '#FFFFFF',
  INTERMEDIATE: '#39B54A', WET: '#0067FF',
}

export default function StrategyChart({ result, totalLaps, baseLapTime }: Props) {
  const data = buildLapData(result, totalLaps, baseLapTime)

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#38383F" />
          <XAxis dataKey="lap" stroke="#ffffff40" tick={{ fontSize: 11 }} label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: '#ffffff40', fontSize: 11 }} />
          <YAxis stroke="#ffffff40" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#15151E', border: '1px solid #38383F', borderRadius: 8 }}
            labelStyle={{ color: '#ffffff' }}
          />
          {result.stops.map((stop) => (
            <ReferenceLine
              key={stop.lap}
              x={stop.lap}
              stroke={COMPOUND_COLOR[stop.compound] ?? '#888'}
              strokeDasharray="4 2"
              label={{ value: stop.compound[0], fill: COMPOUND_COLOR[stop.compound] ?? '#888', fontSize: 10 }}
            />
          ))}
          <Line type="monotone" dataKey="lapTime" stroke="#E10600" dot={false} strokeWidth={2} />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
