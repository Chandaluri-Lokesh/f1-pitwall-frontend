import axios from 'axios'
import type {
  Driver,
  Team,
  CircuitInfo,
  DSASolveRequest,
  COABenchmarkRequest,
  HarnessResult,
  BenchmarkResult,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export async function getDrivers(team_id?: string): Promise<Driver[]> {
  const params = team_id ? { team_id } : {}
  const { data } = await api.get<Driver[]>('/drivers', { params })
  return data
}

export async function getTeams(): Promise<Team[]> {
  const { data } = await api.get<Team[]>('/teams')
  return data
}

export async function getCircuit(circuit_id: string, year: number): Promise<CircuitInfo> {
  const { data } = await api.get<CircuitInfo>('/circuit', { params: { circuit_id, year } })
  return data
}

export async function listCircuits(): Promise<{ circuit_id: string; year: number }[]> {
  const { data } = await api.get('/dsa/circuits')
  return data
}

export async function solveDSA(req: DSASolveRequest): Promise<HarnessResult> {
  const { data } = await api.post<HarnessResult>('/dsa/solve', req)
  return data
}

export async function runCOABenchmark(req: COABenchmarkRequest): Promise<BenchmarkResult> {
  const { data } = await api.post<BenchmarkResult>('/coa/benchmark', req)
  return data
}

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}
