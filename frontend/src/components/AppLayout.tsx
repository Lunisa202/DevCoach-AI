import { useState, useEffect } from 'react'
import { Outlet, Navigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Menu, KeyRound, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import axiosClient from '../services/axiosClient'
import type { RootState } from '../store'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    axiosClient.get('/api/auth/api-key-status')
      .then(res => { if (!res.data.has_key) setShowBanner(true) })
      .catch(() => {})
  }, [isAuthenticated])

  // Listen for api-key-saved event from SettingsPage
  useEffect(() => {
    const handler = () => setShowBanner(false)
    window.addEventListener('api-key-saved', handler)
    return () => window.removeEventListener('api-key-saved', handler)
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* API Key banner */}
        {showBanner && !bannerDismissed && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 text-sm text-amber-800 dark:text-amber-300">
            <KeyRound className="size-4 shrink-0" />
            <p className="flex-1">
              Estás usando la API key del sistema. Para garantizar disponibilidad,{' '}
              <Link to="/settings" className="font-medium underline hover:no-underline">
                configura tu propia key
              </Link>.
            </p>
            <button onClick={() => setBannerDismissed(true)} className="p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-500/20">
              <X className="size-4" />
            </button>
          </div>
        )}

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
