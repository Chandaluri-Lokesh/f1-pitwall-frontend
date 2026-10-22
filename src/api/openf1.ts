// OpenF1 REST API client — https://api.openf1.org/v1/
// All endpoints are public + CORS-enabled; no API key required.

import axios from 'axios'

const BASE = 'https://api.openf1.org/v1'

const http = axios.create({ baseURL: BASE, timeout: 10000 })

// ── Types ──────────────────────────────────────────────────────────────────

export interface OF1Session {
  session_key:        number
  session_name:       string   // "Race", "Qualifying", "Practice 1", …
  session_type:       string
  date_start:         string   // ISO
  date_end:           string   // ISO
  circuit_key:        number
  circuit_short_name: string
  country_name:       string
  year:               number
  location:           string
}

export interface OF1Driver {
  driver_number:   number
  broadcast_name:  string   // "M VERSTAPPEN"
  name_acronym:    string   // "VER"
  full_name:       string
  team_name:       string
  team_colour:     string   // hex without #, e.g. "3671C6"
  headshot_url:    string
  country_code:    string
}

export interface OF1Stint {
  session_key:        number
  driver_number:      number
  stint_number:       number
  lap_start:          number
  lap_end:            number | null  // null if stint is ongoing
  compound:           string         // SOFT | MEDIUM | HARD | INTERMEDIATE | WET | UNKNOWN
  tyre_age_at_start:  number
}

export interface OF1Pit {
  session_key:  number
  driver_number: number
  lap_number:   number
  pit_duration: number | null  // seconds (null while in pit lane)
  date:         string
}

export interface OF1RaceControl {
  session_key: number
  date:        string
  lap_number:  number | null
  category:    string   // "SafetyCar" | "Flag" | "Other" | "Drs"
  flag:        string | null
  scope:       string | null
  message:     string
}

export interface OF1Interval {
  session_key:        number
  driver_number:      number
  date:               string
  gap_to_leader:      number | null   // seconds
  interval:           number | null   // to car ahead
}

export interface OF1Position {
  session_key:  number
  driver_number: number
  date:         string
  position:     number
}

// ── API calls ──────────────────────────────────────────────────────────────

export async function getLatestSession(): Promise<OF1Session | null> {
  const { data } = await http.get<OF1Session[]>('/sessions', {
    params: { session_key: 'latest' },
  })
  return data.length ? data[data.length - 1] : null
}

export async function getSession(session_key: number): Promise<OF1Session | null> {
  const { data } = await http.get<OF1Session[]>('/sessions', {
    params: { session_key },
  })
  return data.length ? data[0] : null
}

export async function getDrivers(session_key: number): Promise<OF1Driver[]> {
  const { data } = await http.get<OF1Driver[]>('/drivers', {
    params: { session_key },
  })
  return data
}

export async function getStints(session_key: number): Promise<OF1Stint[]> {
  const { data } = await http.get<OF1Stint[]>('/stints', {
    params: { session_key },
  })
  return data
}

export async function getPits(session_key: number): Promise<OF1Pit[]> {
  const { data } = await http.get<OF1Pit[]>('/pit', {
    params: { session_key },
  })
  return data
}

export async function getRaceControl(session_key: number): Promise<OF1RaceControl[]> {
  const { data } = await http.get<OF1RaceControl[]>('/race_control', {
    params: { session_key },
  })
  return data
}

export async function getLatestIntervals(session_key: number): Promise<OF1Interval[]> {
  // Returns all interval records — we want only the latest per driver
  const { data } = await http.get<OF1Interval[]>('/intervals', {
    params: { session_key },
  })
  // Keep only the most recent entry per driver
  const latest = new Map<number, OF1Interval>()
  for (const row of data) {
    const prev = latest.get(row.driver_number)
    if (!prev || row.date > prev.date) latest.set(row.driver_number, row)
  }
  return Array.from(latest.values())
}

export async function getLatestPositions(session_key: number): Promise<OF1Position[]> {
  const { data } = await http.get<OF1Position[]>('/position', {
    params: { session_key },
  })
  const latest = new Map<number, OF1Position>()
  for (const row of data) {
    const prev = latest.get(row.driver_number)
    if (!prev || row.date > prev.date) latest.set(row.driver_number, row)
  }
  return Array.from(latest.values()).sort((a, b) => a.position - b.position)
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Current stint per driver — the active (latest lap_end == null or highest lap_end) stint
export function currentStintPerDriver(
  stints: OF1Stint[]
): Map<number, OF1Stint> {
  const map = new Map<number, OF1Stint>()
  for (const s of stints) {
    const prev = map.get(s.driver_number)
    if (!prev || s.stint_number > prev.stint_number) {
      map.set(s.driver_number, s)
    }
  }
  return map
}

export const COMPOUND_COLOR: Record<string, string> = {
  SOFT:         '#E10600',
  MEDIUM:       '#FFF200',
  HARD:         '#FFFFFF',
  INTERMEDIATE: '#39B54A',
  WET:          '#0067FF',
  UNKNOWN:      '#666666',
}

export const COMPOUND_SHORT: Record<string, string> = {
  SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W', UNKNOWN: '?',
}

export function sessionStatusLabel(s: OF1Session): { label: string; color: string } {
  const now = Date.now()
  const start = new Date(s.date_start).getTime()
  const end   = new Date(s.date_end).getTime()
  if (now < start) return { label: 'Upcoming', color: 'text-yellow-400' }
  if (now > end)   return { label: 'Finished',  color: 'text-white/40' }
  return { label: 'Live', color: 'text-green-400' }
}

export function formatGap(gap: number | null): string {
  if (gap === null) return '—'
  if (gap === 0)    return 'Leader'
  return `+${gap.toFixed(3)}`
}
