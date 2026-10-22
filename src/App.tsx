import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import DashboardPage from '@/pages/DashboardPage'
import StrategyPage from '@/pages/StrategyPage'
import BenchmarkPage from '@/pages/BenchmarkPage'
import ComparePage from '@/pages/ComparePage'
import LivePage from '@/pages/LivePage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/"           element={<DashboardPage />} />
          <Route path="/strategy"   element={<StrategyPage />} />
          <Route path="/benchmark"  element={<BenchmarkPage />} />
          <Route path="/compare"    element={<ComparePage />} />
          <Route path="/live"       element={<LivePage />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
