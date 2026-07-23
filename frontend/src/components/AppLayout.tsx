import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import type { RootState } from '../store'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <header className="lg:hidden flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            DevCoach AI
          </span>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
