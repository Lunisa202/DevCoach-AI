import {
    ArrowRight,
    CheckCircle,
    Clock,
    Code2,
    FolderGit2,
    GitBranch,
    Plus,
    Star,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { SkillRadar } from '../components/SkillRadar'
import { useProjects } from '../hooks/useProjects'
import axiosClient from '../services/axiosClient'
import { getProjectTickets } from '../services/projectService'
import type { RootState } from '../store'
import type { ProjectResponse, TicketResponse } from '../types/project'
import { getRepoName } from '../utils/repoUrl'

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
  xp: number
  level: number
  xp_progress: number
  xp_needed: number
  current_streak: number
  trends: Array<{ week: string; avg: number | null; count: number }>
}

interface ProjectProgress {
  done: number
  total: number
}

// ============================================================
// HomePage — Dashboard rediseñado (Solo Frontend)
// ============================================================
export function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [projectProgress, setProjectProgress] = useState<Record<string, ProjectProgress>>({})
  const [loadingProgress, setLoadingProgress] = useState(true)

  const user = useSelector((state: RootState) => state.auth.user)
  const currentUserId = user?.id ?? ''
  const { projects, isLoading: loadingProjects } = useProjects()
  const navigate = useNavigate()

  // Fetch stats globales
  useEffect(() => {
    axiosClient
      .get('/api/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  // Fetch tickets por proyecto en paralelo para computar progreso real
  useEffect(() => {
    if (loadingProjects) return
    if (projects.length === 0) {
      setLoadingProgress(false)
      return
    }
    setLoadingProgress(true)
    Promise.all(
      projects.map(async (p) => {
        try {
          const tickets = await getProjectTickets(p.id)
          const done = tickets.filter((t: TicketResponse) => t.estado === 'done').length
          return [p.id, { done, total: tickets.length }] as const
        } catch {
          return [p.id, { done: 0, total: 0 }] as const
        }
      }),
    )
      .then((entries) => {
        setProjectProgress(Object.fromEntries(entries))
      })
      .finally(() => setLoadingProgress(false))
  }, [projects, loadingProjects])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const firstName = (user?.full_name ?? 'Dev').split(' ')[0]

  const s = stats ?? {
    total_projects: 0,
    total_tickets: 0,
    tickets_by_state: { to_do: 0, in_review: 0, done: 0 },
    tickets_by_priority: { alta: 0, media: 0, baja: 0 },
    tickets_by_difficulty: {},
    total_reviews: 0,
    approved_reviews: 0,
    avg_score: null,
    recent_reviews: [],
  }

  const pendingTickets = s.tickets_by_state.to_do + s.tickets_by_state.in_review
  const completedTickets = s.tickets_by_state.done
  const avgScoreDisplay = s.avg_score !== null ? `${Math.round(s.avg_score)}%` : '—'

  const isLoading = loadingStats || loadingProjects

  // ─── Loading skeleton ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-6xl">
        {/* Greeting skeleton */}
        <div className="mb-8">
          <div className="bg-slate-200 dark:bg-slate-700 mb-2 rounded w-24 h-3 animate-pulse" />
          <div className="bg-slate-200 dark:bg-slate-700 rounded w-56 h-8 animate-pulse" />
        </div>
        {/* Stat cards skeleton */}
        <div className="gap-4 grid grid-cols-2 lg:grid-cols-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
        {/* Projects skeleton */}
        <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700/50 rounded-2xl h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mx-auto p-6 lg:p-8 max-w-6xl fade-in">
      {/* ═══ Saludo personalizado ═══ */}
      <div className="mb-8">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="mb-1 text-slate-500 dark:text-slate-400 text-sm">{greeting},</p>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-3xl leading-tight">
              {firstName} 👋
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
              {pendingTickets > 0 ? (
                <>
                  Tienes{' '}
                  <span className="font-semibold text-amber-500">
                    {pendingTickets} ticket{pendingTickets !== 1 ? 's' : ''} pendiente{pendingTickets !== 1 ? 's' : ''}
                  </span>{' '}
                  en {s.total_projects} proyecto{s.total_projects !== 1 ? 's' : ''} activo{s.total_projects !== 1 ? 's' : ''}.
                </>
              ) : s.total_projects > 0 ? (
                <>Todos tus tickets están al día. <span className="text-emerald-500 font-semibold">¡Buen trabajo!</span></>
              ) : (
                <>Empieza analizando tu primer repositorio.</>
              )}
            </p>
          </div>
          <Link
            to="/app"
            className="hidden sm:inline-flex items-center gap-2 btn-primary shrink-0 px-5 py-2.5 rounded-xl font-medium text-white text-sm"
          >
            <Plus className="size-4" />
            Nuevo análisis
          </Link>
        </div>
      </div>

      {/* ═══ Stats grid ═══ */}
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={<GitBranch size={20} />}
          label="Proyectos"
          value={s.total_projects}
          sub="repos analizados"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Por completar"
          value={pendingTickets}
          sub="tickets pendientes"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Completados"
          value={completedTickets}
          sub="tickets finalizados"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={<Star size={20} />}
          label="Promedio"
          value={avgScoreDisplay}
          sub={s.avg_score !== null ? 'calificación entrevistas' : 'sin reviews aún'}
          gradient="bg-gradient-to-br from-rose-500 to-pink-500"
        />
      </div>

      {/* ═══ XP / Level / Streak ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Level badge */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-lg">
            {s.level}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">Nivel</p>
            <p className="font-semibold text-slate-800 dark:text-white">Nivel {s.level}</p>
            <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: s.xp_needed > 0 ? `${Math.min((s.xp_progress / s.xp_needed) * 100, 100)}%` : '100%' }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{s.xp_progress} / {s.xp_needed} XP</p>
          </div>
        </div>

        {/* Total XP */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Star size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Experiencia total</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.xp} <span className="text-sm font-normal text-slate-400">XP</span></p>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className={`flex size-12 items-center justify-center rounded-xl text-white ${s.current_streak >= 7 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
            🔥
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Racha de actividad</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {s.current_streak} <span className="text-sm font-normal text-slate-400">{s.current_streak === 1 ? 'día' : 'días'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Trends Chart + Skill Radar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {s.trends && s.trends.some(t => t.avg !== null) && (
          <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Evolución de calificaciones</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Promedio semanal de tus entrevistas</p>
            <TrendsChart data={s.trends} />
          </div>
        )}
        <SkillRadarSection userId={currentUserId} />
      </div>

      {/* ═══ Proyectos recientes ═══ */}
      {projects.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-slate-100 dark:border-slate-700/50 border-b">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Proyectos recientes</h3>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-xs">
                {projects.length} repositorio{projects.length !== 1 ? 's' : ''} analizado{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/app"
              className="flex items-center gap-1.5 font-medium text-indigo-500 hover:text-indigo-400 text-xs transition-colors"
            >
              Nuevo análisis <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                progress={projectProgress[p.id]}
                loadingProgress={loadingProgress}
                onClick={() => navigate(`/dashboard/${p.id}`)}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyProjectsState />
      )}

      {/* Mobile CTA */}
      <Link
        to="/app"
        className="sm:hidden flex justify-center items-center gap-2 btn-primary mt-6 px-5 py-3 rounded-xl w-full font-medium text-white text-sm"
      >
        <Plus className="size-4" />
        Analizar nuevo repositorio
      </Link>
    </div>
  )
}

/* ─── Sub-componentes ─── */

/* ─── Trends Line Chart (SVG) ─── */
function TrendsChart({ data }: { data: Array<{ week: string; avg: number | null; count: number }> }) {
  const width = 600
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  // Filter points that have data
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartW,
    y: d.avg !== null ? padding.top + chartH - (d.avg / 100) * chartH : null,
    label: d.week,
    avg: d.avg,
    count: d.count,
  }))

  // Build the line path (only connecting non-null points)
  const validPoints = points.filter(p => p.y !== null) as Array<{ x: number; y: number; label: string; avg: number; count: number }>
  const linePath = validPoints.length > 1
    ? `M ${validPoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    : ''

  // Area path (fill under line)
  const areaPath = validPoints.length > 1
    ? `M ${validPoints[0].x},${padding.top + chartH} L ${validPoints.map(p => `${p.x},${p.y}`).join(' L ')} L ${validPoints[validPoints.length - 1].x},${padding.top + chartH} Z`
    : ''

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[200px]" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis grid lines */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = padding.top + chartH - (v / 100) * chartH
        return (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} strokeDasharray={v === 0 ? '' : '4 4'} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px]">{v}</text>
          </g>
        )
      })}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#trendGradient)" opacity={0.3} />}

      {/* Line */}
      {linePath && <path d={linePath} fill="none" stroke="rgb(99,102,241)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

      {/* Data points with tooltip */}
      {validPoints.map((p, i) => (
        <g key={i} className="group cursor-pointer">
          {/* Hover area (larger for easier hovering) */}
          <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
          {/* Visible dot */}
          <circle cx={p.x} cy={p.y} r={4} fill="rgb(99,102,241)" stroke="white" strokeWidth={2} className="group-hover:r-[6]" />
          {/* Tooltip */}
          <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <rect x={p.x - 32} y={p.y - 38} width={64} height={26} rx={6} fill="rgb(30,41,59)" />
            <text x={p.x} y={p.y - 21} textAnchor="middle" className="fill-white text-[11px] font-semibold">{p.avg}/100</text>
            <polygon points={`${p.x - 4},${p.y - 12} ${p.x + 4},${p.y - 12} ${p.x},${p.y - 7}`} fill="rgb(30,41,59)" />
          </g>
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={height - 5} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[10px]">
          {p.label}
        </text>
      ))}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
}


function StatCard({
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  gradient: string
}) {
  return (
    <div className="relative bg-white dark:bg-slate-800 shadow-sm p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden card-hover">
      {/* Halo decorativo */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 ${gradient}`} />
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
        {icon}
      </div>
      <p className="mb-0.5 font-bold text-slate-900 dark:text-slate-100 text-3xl">{value}</p>
      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{label}</p>
      {sub && <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs">{sub}</p>}
    </div>
  )
}

function ProjectRow({
  project,
  progress,
  loadingProgress,
  onClick,
}: {
  project: ProjectResponse
  progress: ProjectProgress | undefined
  loadingProgress: boolean
  onClick: () => void
}) {
  const repoName = getRepoName(project.repo_url)
  const done = progress?.done ?? 0
  const total = progress?.total ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const dateStr = new Date(project.fecha_analisis).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const statusLabel = total === 0
    ? 'Sin tickets'
    : pct === 100
      ? 'Completado'
      : pct > 0
        ? 'En progreso'
        : 'Sin iniciar'

  const statusColor = pct === 100
    ? 'text-emerald-500'
    : pct > 0
      ? 'text-amber-500'
      : 'text-slate-400'

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 px-6 py-4 w-full text-left transition-colors"
    >
      <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-700 rounded-xl w-10 h-10 shrink-0">
        <Code2 size={18} className="text-indigo-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{repoName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full max-w-32 h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full h-full transition-all duration-500"
              style={{ width: loadingProgress ? '0%' : `${pct}%` }}
            />
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            {loadingProgress ? '…' : `${done}/${total} tickets`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-slate-500 dark:text-slate-400 text-xs">{dateStr}</p>
          <p className={`text-xs font-medium ${statusColor}`}>{statusLabel}</p>
        </div>
        <ArrowRight size={16} className="text-slate-400" />
      </div>
    </button>
  )
}

function SkillRadarSection({ userId }: { userId: string }) {
  const [skills, setSkills] = useState<Array<{ dimension: string; score: number; max_score: number; count: number }>>([])

  useEffect(() => {
    if (!userId) return
    axiosClient.get('/api/stats/skills')
      .then(res => setSkills(res.data.skills || []))
      .catch(() => {})
  }, [userId])

  if (skills.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Perfil de competencias</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Promedio de tus evaluaciones por dimensión</p>
      <SkillRadar skills={skills} />
    </div>
  )
}

function EmptyProjectsState() {
  return (
    <div className="py-12 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl text-center">
      <FolderGit2 className="mx-auto mb-4 size-12 text-slate-300 dark:text-slate-600" />
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-lg">
        No tienes proyectos aún
      </h3>
      <p className="mt-1 mb-4 text-slate-500 dark:text-slate-400 text-sm">
        Conecta un repositorio de GitHub para comenzar tu primer análisis
      </p>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-lg font-medium text-white text-sm"
      >
        <Plus className="size-4" />
        Comenzar
      </Link>
    </div>
  )
}
