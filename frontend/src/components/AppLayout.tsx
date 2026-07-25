import { KeyRound, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import axiosClient from '../services/axiosClient'
import type { RootState } from '../store'
import { Sidebar } from './Sidebar'

// Map routes to page titles
function getPageTitle(pathname: string): string {
  if (pathname === '/home') return 'Dashboard'
  if (pathname === '/app') return 'Nuevo análisis'
  if (pathname === '/select') return 'Seleccionar archivos'
  if (pathname.startsWith('/dashboard/')) return 'Tablero de tickets'
  if (pathname.startsWith('/ticket/')) return 'Detalle del ticket'
  if (pathname.startsWith('/interview/')) return 'Entrevista técnica'
  if (pathname === '/ranking') return 'Ranking'
  if (pathname === '/achievements') return 'Logros'
  if (pathname.startsWith('/profile/')) return 'Perfil'
  if (pathname === '/report') return 'Developer Report'
  if (pathname === '/settings') return 'Configuración'
  return 'DevCoach AI'
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const location = useLocation()

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

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header — height matches sidebar header exactly */}
        <header className="hidden lg:flex items-center px-6 h-[72px] border-b-2 border-indigo-500/20 dark:border-indigo-400/20 bg-white dark:bg-slate-800/50 backdrop-blur-sm">
          <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{pageTitle}</h1>
        </header>

        {/* Mobile header with hamburger */}
        <header className="lg:hidden flex items-center px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {pageTitle}
          </span>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto relative">
          {/* API Key banner — floats over content without pushing anything */}
          {showBanner && !bannerDismissed && (
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-2 bg-amber-50/95 dark:bg-amber-900/90 border-b border-amber-200 dark:border-amber-500/20 text-sm text-amber-800 dark:text-amber-300 backdrop-blur-sm shadow-sm">
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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
