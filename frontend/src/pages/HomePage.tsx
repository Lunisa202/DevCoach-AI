import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderGit2,
  Ticket,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Plus,
} from 'lucide-react'
import axiosClient from '../services/axiosClient'
import { UserAvatar } from '../components/UserAvatar'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

interface Stats {
  total_projects: number
  total_tickets: number
  tickets_by_state: { to_do: number; in_review: number; done: number }
  tickets_by_priority: { alta: number; media: number; baja: number }
  tickets_by_difficulty: Record<string, number>
  total_reviews: number
  approved_reviews: number
  avg_score: number | null
  recent_reviews: Array<{
    id: string
    ticket_id: string
    calificacion: number | null
    aprobado: boolean
    created_at: string
  }>
}

export function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    axiosClient.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin size-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const s = stats ?? {
    total_projects: 0, total_tickets: 0,
    tickets_by_state: { to_do: 0, in_review: 0, done: 0 },
    tickets_by_priority: { alta: 0, media: 0, baja: 0 },
    tickets_by_difficulty: {},
    total_reviews: 0, approved_reviews: 0, avg_score: null,
    recent_reviews: [],
  }

  const completionRate = s.total_tickets > 0
    ? Math.round((s.tickets_by_state.done / s.total_tickets) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar name={user?.full_name ?? 'U'} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Hola, {user?.full_name?.split(' ')[0] ?? 'Dev'} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aquí está tu resumen de progreso
            </p>
          </div>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="size-4" />
          Nuevo análisis
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderGit2 className="size-5 text-indigo-500" />}
          label="Proyectos"
          value={s.total_projects}
        />
        <StatCard
          icon={<Ticket className="size-5 text-purple-500" />}
          label="Tickets totales"
          value={s.total_tickets}
        />
        <StatCard
          icon={<CheckCircle2 className="size-5 text-emerald-500" />}
          label="Completados"
          value={s.tickets_by_state.done}
          subtitle={s.total_tickets > 0 ? `${completionRate}%` : undefined}
        />
        <StatCard
          icon={<TrendingUp className="size-5 text-amber-500" />}
          label="Promedio"
          value={s.avg_score !== null ? s.avg_score : '—'}
          subtitle={s.avg_score !== null ? 'de 100' : 'sin reviews'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets by state */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-indigo-500" />
            Estado de tickets
          </h3>
          <div className="space-y-3">
            <ProgressRow label="Por hacer" value={s.tickets_by_state.to_do} total={s.total_tickets} color="bg-slate-400" />
            <ProgressRow label="En revisión" value={s.tickets_by_state.in_review} total={s.total_tickets} color="bg-amber-400" />
            <ProgressRow label="Completados" value={s.tickets_by_state.done} total={s.total_tickets} color="bg-emerald-400" />
          </div>
        </div>

        {/* Tickets by priority */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            Por prioridad
          </h3>
          <div className="space-y-3">
            <ProgressRow label="Alta" value={s.tickets_by_priority.alta} total={s.total_tickets} color="bg-red-400" />
            <ProgressRow label="Media" value={s.tickets_by_priority.media} total={s.total_tickets} color="bg-amber-400" />
            <ProgressRow label="Baja" value={s.tickets_by_priority.baja} total={s.total_tickets} color="bg-blue-400" />
          </div>
        </div>
      </div>

      {/* Recent reviews */}
      {s.recent_reviews.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="size-4 text-indigo-500" />
            Últimas evaluaciones
          </h3>
          <div className="space-y-2">
            {s.recent_reviews.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`size-2.5 rounded-full ${r.aprobado ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {r.aprobado ? 'Aprobado' : 'No aprobado'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
                    {r.calificacion ?? '—'}<span className="text-xs font-normal text-slate-400">/100</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {s.total_projects === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <FolderGit2 className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No tienes proyectos aún</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
            Conecta un repositorio de GitHub para comenzar tu primer análisis
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="size-4" />
            Comenzar
          </Link>
        </div>
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function StatCard({ icon, label, value, subtitle }: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function ProgressRow({ label, value, total, color }: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
