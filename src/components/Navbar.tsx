import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const links = [
  { to: '/',          label: 'Dashboard' },
  { to: '/strategy',  label: 'DSA Strategy' },
  { to: '/benchmark', label: 'COA Benchmark' },
  { to: '/compare',   label: 'Compare' },
  { to: '/live',      label: 'Live' },
]

export default function Navbar() {
  return (
    <header className="bg-f1dark border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl flex items-center gap-8 h-14">
        <div className="flex items-center gap-2 text-f1red font-bold text-lg tracking-tight">
          <span className="text-white">F1</span> PitWall
        </div>
        <nav className="flex gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx('px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-f1red text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
