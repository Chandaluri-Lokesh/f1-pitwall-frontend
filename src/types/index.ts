// Shared TypeScript types — mirrors backend C++ structs

export type Compound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET'

export interface Driver {
  abbreviation: string
  full_name: string
  number: number
  team_id: string
  nationality: string
  tyre_mgmt_factor: number    // < 1.0 = extends tyres; > 1.0 = harder on rubber
  qualifying_delta: number    // seconds vs field average
}

export interface Team {
  team_id: string
  team_name: string
  color: string               // hex color
  pit_crew_time: number       // stationary stop time (seconds)
  pit_crew_reliability: number
}

export interface CircuitInfo {
  circuit_id: string
  year: number
  total_laps: number
  pit_loss_seconds: number
  base_lap_time: number
  fuel_effect_per_lap: number
  tyre_specs: TyreSpec[]
}

export interface TyreSpec {
  compound: Compound
  base_lap_time_delta: number
  deg_linear: number
  deg_quadratic: number
  min_laps: number
  max_laps: number
}

export interface RaceConfig {
  total_laps: number
  pit_loss_seconds: number
  base_lap_time: number
  fuel_effect_per_lap: number
  circuit_name: string
  race_year?: string
}

export interface PitStop {
  lap: number
  compound: Compound
}

export interface StrategyResult {
  algorithm: string
  data_structure: string
  driver_abbreviation: string
  team_id: string
  total_race_time: number
  stops_count: number
  wall_clock_ms: number
  states_explored: number
  stops: PitStop[]
  deviation_vs_actual?: number
}

export interface HarnessResult {
  best: StrategyResult
  results: StrategyResult[]
  effective_pit_loss: number
  tyre_mgmt_factor: number
  driver_abbreviation: string
  team_id: string
}

export type MemLayout = 'aos' | 'soa'

export interface SimResult {
  impl_tag: string
  mean_race_time: number
  stddev_race_time: number
  wall_clock_ms: number
  simulations_completed: number
  threads_used: number
  layout: MemLayout
}

export interface BenchmarkResult {
  results: SimResult[]
}

export interface DSASolveRequest {
  race: RaceConfig
  algorithms: string[]
  driver?: string
  team?: string
  data_structures?: Record<string, string>
}

export interface COABenchmarkRequest {
  race: RaceConfig
  num_simulations: number
  num_threads: number
  layout: MemLayout
  use_gpu?: boolean
}
