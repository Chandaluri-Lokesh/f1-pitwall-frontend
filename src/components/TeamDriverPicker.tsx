import { useEffect, useState } from 'react'
import { getTeams, getDrivers } from '@/api/client'
import type { Team, Driver } from '@/types'
import clsx from 'clsx'

interface Props {
  selectedTeam: Team | null
  selectedDriver: Driver | null
  onTeamChange: (team: Team | null) => void
  onDriverChange: (driver: Driver | null) => void
}

export default function TeamDriverPicker({
  selectedTeam, selectedDriver, onTeamChange, onDriverChange
}: Props) {
  const [teams, setTeams]     = useState<Team[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTeam) { setDrivers([]); return }
    getDrivers(selectedTeam.team_id)
      .then(setDrivers)
      .catch(() => setDrivers([]))
  }, [selectedTeam])

  function handleTeamClick(team: Team) {
    if (selectedTeam?.team_id === team.team_id) {
      onTeamChange(null)
      onDriverChange(null)
    } else {
      onTeamChange(team)
      onDriverChange(null)
    }
  }

  function handleDriverClick(driver: Driver) {
    onDriverChange(selectedDriver?.abbreviation === driver.abbreviation ? null : driver)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="label">Team</p>
        <div className="text-white/30 text-xs">Loading teams...</div>
      </div>
    )
  }

  // Fallback when backend is not running — show static known teams
  const displayTeams = teams.length > 0 ? teams : FALLBACK_TEAMS

  return (
    <div className="space-y-4">
      {/* Team picker */}
      <div>
        <p className="label">Team</p>
        <div className="grid grid-cols-2 gap-1.5">
          {displayTeams.map(team => (
            <button
              key={team.team_id}
              onClick={() => handleTeamClick(team)}
              className={clsx(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'border transition-all',
                selectedTeam?.team_id === team.team_id
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/5 bg-white/[0.03] hover:bg-white/5'
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: team.color }}
              />
              <span className="truncate">{team.team_name}</span>
            </button>
          ))}
        </div>
        {selectedTeam && (
          <div className="mt-2 text-xs text-white/40 flex gap-3">
            <span>Crew: <span className="text-white/70">{selectedTeam.pit_crew_time}s</span></span>
            <span>Reliability: <span className="text-white/70">{(selectedTeam.pit_crew_reliability * 100).toFixed(0)}%</span></span>
          </div>
        )}
      </div>

      {/* Driver picker — only shown after team selected */}
      {selectedTeam && (
        <div>
          <p className="label">Driver</p>
          {drivers.length === 0 ? (
            <p className="text-white/30 text-xs">No drivers found for this team</p>
          ) : (
            <div className="space-y-1">
              {drivers.map(driver => (
                <button
                  key={driver.abbreviation}
                  onClick={() => handleDriverClick(driver)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                    'border transition-all',
                    selectedDriver?.abbreviation === driver.abbreviation
                      ? 'border-f1red/50 bg-f1red/10 text-white'
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/5 text-white/70'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: selectedTeam.color + '33', color: selectedTeam.color }}
                    >
                      {driver.number}
                    </span>
                    <div className="text-left">
                      <div className="font-semibold text-xs">{driver.abbreviation}</div>
                      <div className="text-white/40 text-xs leading-none">{driver.full_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <TyreMgmtBadge factor={driver.tyre_mgmt_factor} />
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedDriver && (
            <div className="mt-2 text-xs text-white/40 space-y-0.5">
              <div>
                Tyre mgmt: <span className="text-white/70">{selectedDriver.tyre_mgmt_factor.toFixed(2)}x</span>
                <span className="ml-1 text-white/30">
                  ({selectedDriver.tyre_mgmt_factor < 1
                    ? `extends stints ${((1 - selectedDriver.tyre_mgmt_factor) * 100).toFixed(0)}%`
                    : `${((selectedDriver.tyre_mgmt_factor - 1) * 100).toFixed(0)}% harder on rubber`})
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TyreMgmtBadge({ factor }: { factor: number }) {
  if (factor < 0.93) return <span className="badge bg-green-500/20 text-green-400 text-xs">Excellent</span>
  if (factor < 0.97) return <span className="badge bg-blue-500/20 text-blue-400 text-xs">Good</span>
  if (factor < 1.01) return <span className="badge bg-white/10 text-white/50 text-xs">Average</span>
  return <span className="badge bg-orange-500/20 text-orange-400 text-xs">Aggressive</span>
}

// Shown when backend is offline
const FALLBACK_TEAMS: Team[] = [
  { team_id: 'red_bull',     team_name: 'Red Bull Racing', color: '#3671C6', pit_crew_time: 1.90, pit_crew_reliability: 0.98 },
  { team_id: 'ferrari',      team_name: 'Ferrari',         color: '#E8002D', pit_crew_time: 2.20, pit_crew_reliability: 0.96 },
  { team_id: 'mclaren',      team_name: 'McLaren',         color: '#FF8000', pit_crew_time: 2.10, pit_crew_reliability: 0.97 },
  { team_id: 'mercedes',     team_name: 'Mercedes',        color: '#27F4D2', pit_crew_time: 2.40, pit_crew_reliability: 0.97 },
  { team_id: 'aston_martin', team_name: 'Aston Martin',    color: '#229971', pit_crew_time: 2.60, pit_crew_reliability: 0.95 },
  { team_id: 'alpine',       team_name: 'Alpine',          color: '#FF87BC', pit_crew_time: 2.80, pit_crew_reliability: 0.94 },
  { team_id: 'williams',     team_name: 'Williams',        color: '#64C4FF', pit_crew_time: 3.00, pit_crew_reliability: 0.93 },
  { team_id: 'rb',           team_name: 'RB',              color: '#6692FF', pit_crew_time: 2.70, pit_crew_reliability: 0.94 },
  { team_id: 'haas',         team_name: 'Haas',            color: '#B6BABD', pit_crew_time: 3.20, pit_crew_reliability: 0.92 },
  { team_id: 'sauber',       team_name: 'Kick Sauber',     color: '#52E252', pit_crew_time: 3.10, pit_crew_reliability: 0.92 },
]
