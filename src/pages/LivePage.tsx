import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getLatestSession, getDrivers, getStints, getPits,
  getRaceControl, getLatestIntervals, getLatestPositions,
  currentStintPerDriver,
  COMPOUND_COLOR, COMPOUND_SHORT,
  sessionStatusLabel, formatGap,
  type OF1Session, type OF1Driver, type OF1Stint,
  type OF1Pit, type OF1RaceControl, type OF1Interval, type OF1Position,
} from '@/api/openf1'
import clsx from 'clsx'

// ── Constants ──────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30   // seconds between auto-refreshes

// ── Flag banner ────────────────────────────────────────────────────────────

const FLAG_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  GREEN:         { bg: 'bg-green-600',  text: 'text-white', label: 'GREEN FLAG' },
  YELLOW:        { bg: 'bg-yellow-500', text: 'text-black', label: 'YELLOW FLAG' },
  'DOUBLE YELLOW': { bg: 'bg-yellow-500', text: 'text-black', label: 'DOUBLE YELLOW' },
  RED:           { bg: 'bg-red-600',    text: 'text-white', label: 'RED FLAG' },
  CHEQUERED:     { bg: 'bg-white',      text: 'text-black', label: 'CHEQUERED' },
  BLUE:          { bg: 'bg-blue-500',   text: 'text-white', label: 'BLUE FLAG' },
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SessionHeader({
  session, countdown, onRefresh, loading,
}: {
  session: OF1Session
  countdown: number
  onRefresh: () => void
  loading: boolean
}) {
  const { label, color } = sessionStatusLabel(session)
  return (
    <div className="card flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{session.circuit_short_name}</h2>
          <span className={clsx('text-sm font-semibold', color)}>● {label}</span>
        </div>
        <p className="text-white/50 text-sm">
          {session.session_name} — {session.country_name} {session.year}
        </p>
        <p className="text-white/30 text-xs font-mono">
          session_key: {session.session_key} &nbsp;·&nbsp;
          {new Date(session.date_start).toLocaleString()} → {new Date(session.date_end).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs hover:bg-white/5 transition-colors disabled:opacity-40"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <p className="text-white/30 text-xs">
          auto-refresh in <span className="font-mono text-white/50">{countdown}s</span>
        </p>
      </div>
    </div>
  )
}

function FlagBanner({ events }: { events: OF1RaceControl[] }) {
  // Find the most recent flag event
  const flagEvents = events.filter(e => e.category === 'Flag' && e.flag)
  if (!flagEvents.length) return null
  const latest = flagEvents[flagEvents.length - 1]
  const style = FLAG_STYLE[latest.flag ?? '']
  if (!style) return null
  return (
    <div className={clsx('rounded-lg px-4 py-2 text-sm font-bold text-center', style.bg, style.text)}>
      {style.label}
      {latest.scope ? ` — ${latest.scope}` : ''}
      {latest.lap_number ? ` · Lap ${latest.lap_number}` : ''}
    </div>
  )
}

function SafetyCarBanner({ events }: { events: OF1RaceControl[] }) {
  const scEvents = events.filter(e => e.category === 'SafetyCar')
  if (!scEvents.length) return null
  const latest = scEvents[scEvents.length - 1]
  const isActive = latest.message.toLowerCase().includes('deployed') ||
                   latest.message.toLowerCase().includes('in this lap')
  if (!isActive) return null
  return (
    <div className="rounded-lg px-4 py-2 text-sm font-bold text-center bg-yellow-400 text-black">
      SAFETY CAR {latest.message.toUpperCase()}
      {latest.lap_number ? ` · Lap ${latest.lap_number}` : ''}
    </div>
  )
}

interface DriverGridProps {
  drivers:   OF1Driver[]
  stints:    Map<number, OF1Stint>
  positions: OF1Position[]
  intervals: OF1Interval[]
}

function DriverGrid({ drivers, stints, positions, intervals }: DriverGridProps) {
  const posMap   = new Map(positions.map(p => [p.driver_number, p.position]))
  const intervalMap = new Map(intervals.map(i => [i.driver_number, i]))

  // Sort by position if available, else by driver number
  const sorted = [...drivers].sort((a, b) => {
    const pa = posMap.get(a.driver_number) ?? 99
    const pb = posMap.get(b.driver_number) ?? 99
    return pa - pb
  })

  if (!sorted.length) return (
    <p className="text-white/30 text-sm">No driver data for this session yet.</p>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
            <th className="text-right py-2 pr-3 w-8">P</th>
            <th className="text-left py-2 pr-4">Driver</th>
            <th className="text-left py-2 pr-4">Team</th>
            <th className="text-center py-2 pr-4">Tyre</th>
            <th className="text-right py-2 pr-4">Age</th>
            <th className="text-right py-2 pr-4">Stint</th>
            <th className="text-right py-2">Gap</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(d => {
            const stint     = stints.get(d.driver_number)
            const compound  = stint?.compound ?? 'UNKNOWN'
            const cColor    = COMPOUND_COLOR[compound] ?? '#666'
            const cShort    = COMPOUND_SHORT[compound] ?? '?'
            const tyreAge   = stint
              ? (stint.tyre_age_at_start + (stint.lap_end
                  ? (stint.lap_end - stint.lap_start)
                  : 0))
              : null
            const pos       = posMap.get(d.driver_number)
            const ivl       = intervalMap.get(d.driver_number)

            return (
              <tr key={d.driver_number}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="text-right py-2.5 pr-3 text-white/50 font-mono text-xs">
                  {pos ?? '—'}
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#' + (d.team_colour || '666666') }}
                    />
                    <div>
                      <span className="font-semibold">{d.name_acronym}</span>
                      <span className="text-white/40 text-xs ml-1.5">{d.driver_number}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-white/50 text-xs">{d.team_name}</td>
                <td className="py-2.5 pr-4 text-center">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold"
                    style={{ backgroundColor: cColor + '33', color: cColor, border: `1px solid ${cColor}66` }}
                  >
                    {cShort}
                  </span>
                </td>
                <td className="text-right py-2.5 pr-4 font-mono text-white/60 text-xs">
                  {tyreAge !== null ? `${tyreAge}L` : '—'}
                </td>
                <td className="text-right py-2.5 pr-4 text-white/40 text-xs">
                  #{stint?.stint_number ?? '—'}
                </td>
                <td className="text-right py-2.5 font-mono text-xs text-white/60">
                  {formatGap(ivl?.gap_to_leader ?? null)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PitStopTable({ pits, drivers }: { pits: OF1Pit[]; drivers: OF1Driver[] }) {
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]))
  const sorted = [...pits]
    .filter(p => p.pit_duration !== null)
    .sort((a, b) => b.lap_number - a.lap_number)
    .slice(0, 15)

  if (!sorted.length) return (
    <p className="text-white/30 text-sm">No pit stops recorded yet.</p>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
            <th className="text-right py-2 pr-3">Lap</th>
            <th className="text-left py-2 pr-4">Driver</th>
            <th className="text-right py-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const d = driverMap.get(p.driver_number)
            const dur = p.pit_duration!
            const isQuick = dur < 2.5
            const isSlow  = dur > 4.0
            return (
              <tr key={i} className="border-b border-white/5">
                <td className="text-right py-2 pr-3 font-mono text-white/50 text-xs">{p.lap_number}</td>
                <td className="py-2 pr-4">
                  {d ? (
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full"
                        style={{ backgroundColor: '#' + (d.team_colour || '666') }} />
                      <span className="font-semibold text-xs">{d.name_acronym}</span>
                    </span>
                  ) : (
                    <span className="text-white/40 text-xs">#{p.driver_number}</span>
                  )}
                </td>
                <td className={clsx(
                  'text-right py-2 font-mono text-xs font-semibold',
                  isQuick ? 'text-green-400' : isSlow ? 'text-red-400' : 'text-white'
                )}>
                  {dur.toFixed(3)}s
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RaceControlFeed({ events }: { events: OF1RaceControl[] }) {
  const notable = [...events]
    .filter(e => e.category !== 'Drs' && e.message)
    .reverse()
    .slice(0, 12)

  if (!notable.length) return (
    <p className="text-white/30 text-sm">No race control messages yet.</p>
  )

  const catColor: Record<string, string> = {
    SafetyCar: 'text-yellow-400',
    Flag:      'text-orange-300',
    Other:     'text-white/50',
    Drs:       'text-blue-300',
  }

  return (
    <ul className="space-y-1.5">
      {notable.map((e, i) => (
        <li key={i} className="flex gap-3 text-xs">
          <span className="text-white/30 font-mono flex-shrink-0 w-16">
            {e.lap_number ? `Lap ${e.lap_number}` : new Date(e.date).toLocaleTimeString()}
          </span>
          <span className={clsx('flex-shrink-0 font-semibold w-20', catColor[e.category] ?? 'text-white/50')}>
            {e.category}
          </span>
          <span className="text-white/70">{e.message}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

interface LiveData {
  session:   OF1Session
  drivers:   OF1Driver[]
  stints:    OF1Stint[]
  pits:      OF1Pit[]
  rc:        OF1RaceControl[]
  intervals: OF1Interval[]
  positions: OF1Position[]
}

export default function LivePage() {
  const [data, setData]         = useState<LiveData | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const countdownRef = useRef(countdown)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const session = await getLatestSession()
      if (!session) throw new Error('No session found from OpenF1 API')

      const [drivers, stints, pits, rc, intervals, positions] = await Promise.all([
        getDrivers(session.session_key),
        getStints(session.session_key),
        getPits(session.session_key),
        getRaceControl(session.session_key),
        getLatestIntervals(session.session_key),
        getLatestPositions(session.session_key),
      ])

      setData({ session, drivers, stints, pits, rc, intervals, positions })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch from OpenF1')
    } finally {
      setLoading(false)
      countdownRef.current = REFRESH_INTERVAL
      setCountdown(REFRESH_INTERVAL)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchAll() }, [fetchAll])

  // Countdown + auto-refresh
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
      if (countdownRef.current <= 0) fetchAll()
    }, 1000)
    return () => clearInterval(tick)
  }, [fetchAll])

  const stintMap = data ? currentStintPerDriver(data.stints) : new Map()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Live Data <span className="text-f1red">via OpenF1</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Real-time session data — tyre stints, pit stops, race control. Powered by{' '}
          <span className="text-white/60">api.openf1.org</span>.
        </p>
      </div>

      {/* Loading / error state */}
      {loading && !data && (
        <div className="card flex items-center justify-center h-32 text-white/30 text-sm">
          Fetching from OpenF1…
        </div>
      )}

      {error && (
        <div className="card border border-red-500/30 bg-red-500/5 text-red-400 text-sm p-4">
          <strong>OpenF1 error:</strong> {error}
          <button onClick={fetchAll} className="ml-4 underline text-xs">retry</button>
        </div>
      )}

      {data && (
        <>
          {/* Session header */}
          <SessionHeader
            session={data.session}
            countdown={countdown}
            onRefresh={fetchAll}
            loading={loading}
          />

          {/* Flag / SC banners */}
          <FlagBanner events={data.rc} />
          <SafetyCarBanner events={data.rc} />

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Driver grid — full width on large */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">
                  Driver Tracker
                </h2>
                <span className="text-white/30 text-xs">
                  {data.drivers.length} drivers · {data.stints.length} stint records
                </span>
              </div>
              <DriverGrid
                drivers={data.drivers}
                stints={stintMap}
                positions={data.positions}
                intervals={data.intervals}
              />
            </div>

            {/* Right column: pits + RC */}
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
                  Pit Stops
                </h2>
                <PitStopTable pits={data.pits} drivers={data.drivers} />
              </div>

              <div className="card">
                <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
                  Race Control
                </h2>
                <RaceControlFeed events={data.rc} />
              </div>
            </div>
          </div>

          {/* Tyre stint legend */}
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="font-semibold text-white/30 uppercase tracking-wider mr-2">Tyres:</span>
            {['SOFT','MEDIUM','HARD','INTERMEDIATE','WET'].map(c => (
              <span key={c} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COMPOUND_COLOR[c] }} />
                {c}
              </span>
            ))}
            <span className="ml-auto">
              Data: <span className="text-white/60">api.openf1.org</span>
              {' '}&nbsp;·&nbsp;{' '}
              Pit times: green &lt; 2.5s, red &gt; 4.0s
            </span>
          </div>
        </>
      )}
    </div>
  )
}
