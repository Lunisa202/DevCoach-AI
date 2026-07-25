import { AxiosError } from 'axios'
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    GitCommit,
    MessageSquare,
    Trophy
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { InterviewModeModal } from '../components/InterviewModeModal'
import { Spinner } from '../components/Spinner'
import { useProjects } from '../hooks/useProjects'
import { useTickets } from '../hooks/useTickets'
import { getTicketReviews, verifyTicket } from '../services/ticketService'
import type { ReviewDetailed } from '../types/interview'
import type { TicketResponse } from '../types/project'
import { getOwnerRepo, getRepoName } from '../utils/repoUrl'

type ColumnId = 'to_do' | 'in_review' | 'done'

// ============================================================
// Config visual — columnas y pills
// ============================================================

const COLUMNS: Array<{
  id: ColumnId
  label: string
  color: string
  countBg: string
  emptyIcon: ReactNode
  emptyMsg: string
}> = [
  {
    id: 'to_do',
    label: 'Por hacer',
    color: 'bg-slate-400',
    countBg: 'bg-slate-500/20 text-slate-500 dark:text-slate-400',
    emptyIcon: <Sparkles className="size-8 text-slate-400 dark:text-slate-500" />,
    emptyMsg: 'No hay tickets pendientes. ¡Buen trabajo!',
  },
  {
    id: 'in_review',
    label: 'En revisión',
    color: 'bg-amber-400',
    countBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    emptyIcon: <Search className="size-8 text-amber-500/70" />,
    emptyMsg: 'Ningún ticket en revisión. Verifica un commit para mover uno aquí.',
  },
  {
    id: 'done',
    label: 'Completado',
    color: 'bg-emerald-500',
    countBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    emptyIcon: <Trophy className="size-8 text-emerald-500/70" />,
    emptyMsg: 'Completa una entrevista técnica para mover tickets aquí.',
  },
]

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  alta: { label: 'Alta', bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  media: { label: 'Media', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  baja: { label: 'Baja', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
}

const DIFFICULTY_CONFIG: Record<string, { bg: string; text: string }> = {
  'fácil': { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400' },
  'media': { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  'difícil': { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
}

// ============================================================
// TicketCard — tarjeta expandible con badges + historial
// ============================================================

function TicketCard({
  ticket,
  columnId,
  isVerifying,
  onVerify,
  onStartInterview,
  onViewDetail,
}: {
  ticket: TicketResponse
  columnId: ColumnId
  isVerifying: boolean
  onVerify: () => void
  onStartInterview: () => void
  onViewDetail: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reviews, setReviews] = useState<ReviewDetailed[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const loadReviews = async () => {
    if (reviews.length > 0) return
    setLoadingReviews(true)
    try {
      const data = await getTicketReviews(ticket.id)
      setReviews(data)
    } catch {
      // silencioso — no es crítico
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    if (next && (columnId === 'in_review' || columnId === 'done')) {
      loadReviews()
    }
  }

  const pri = PRIORITY_CONFIG[ticket.prioridad] ?? PRIORITY_CONFIG.media
  const diff = DIFFICULTY_CONFIG[ticket.dificultad] ?? DIFFICULTY_CONFIG.media
  const lastReview = reviews[0] // ordenados desc por created_at en el backend

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-200 card-hover">
      {/* Cabecera clickeable */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-4 w-full text-left"
      >
        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pri.bg} ${pri.text}`}>
            {pri.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}>
            {ticket.dificultad}
          </span>
        </div>

        {/* Título */}
        <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100 text-sm text-left line-clamp-2 leading-snug">
          {ticket.titulo}
        </h4>

        {/* Descripción (colapsada) */}
        {!expanded && (
          <p className="text-slate-500 dark:text-slate-400 text-xs text-left line-clamp-2 leading-relaxed">
            {ticket.descripcion}
          </p>
        )}

        {/* Meta row */}
        <div className="flex justify-between items-center mt-3 pt-3 border-slate-100 dark:border-slate-700/60 border-t">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
              <Clock size={12} />
              {ticket.tiempo_estimado}
            </span>
            {lastReview && lastReview.calificacion !== null && (
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                <Trophy size={12} />
                {lastReview.calificacion}%
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Cerrar' : 'Ver más'}
          </span>
        </div>
      </button>

      {/* Sección expandida */}
      {expanded && (
        <div className="px-4 py-4 border-slate-100 dark:border-slate-700/60 border-t slide-in">
          {/* Descripción completa */}
          <p className="mb-4 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {ticket.descripcion}
          </p>

          {/* Historial de intentos */}
          {loadingReviews && (
            <div className="flex justify-center py-3">
              <Spinner size="sm" />
            </div>
          )}

          {!loadingReviews && reviews.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Historial de intentos
              </p>
              {reviews.map((review, i) => {
                const score = review.calificacion ?? 0
                const scoreColor =
                  score >= 80
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : score >= 60
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400'

                return (
                  <div
                    key={review.id}
                    className="flex items-start gap-2.5 py-2 border-slate-100 dark:border-slate-700/60 last:border-0 border-b"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${scoreColor}`}
                    >
                      {review.calificacion !== null ? review.calificacion : '—'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                        Intento {reviews.length - i} {review.aprobado ? '· Aprobado' : ''}
                      </p>
                      {review.conceptos_a_mejorar && review.conceptos_a_mejorar.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {review.conceptos_a_mejorar.slice(0, 3).map((c, j) => (
                            <span
                              key={j}
                              className="bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-[10px] text-indigo-600 dark:text-indigo-300"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {review.created_at && (
                        <p className="mt-0.5 text-slate-400 text-xs">
                          {new Date(review.created_at).toLocaleDateString('es', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            {columnId === 'to_do' && (
              <button
                type="button"
                onClick={onVerify}
                disabled={isVerifying}
                className="flex flex-1 justify-center items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-700/60 dark:hover:bg-slate-700 px-3 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 text-xs transition-all"
              >
                {isVerifying ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando…
                  </>
                ) : (
                  <>
                    <GitCommit size={13} />
                    Verificar commit
                  </>
                )}
              </button>
            )}

            {columnId === 'in_review' && (
              <button
                type="button"
                onClick={onStartInterview}
                className="flex flex-1 justify-center items-center gap-1.5 btn-primary px-3 py-2 rounded-xl font-medium text-white text-xs"
              >
                <MessageSquare size={13} />
                Iniciar entrevista
              </button>
            )}

            <button
              type="button"
              onClick={onViewDetail}
              className={`flex ${columnId === 'done' ? 'flex-1' : 'flex-1'} justify-center items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 px-3 py-2 font-medium text-slate-700 dark:text-slate-300 text-xs transition-all`}
            >
              {columnId === 'done' ? (
                <>
                  <CheckCircle size={13} className="text-emerald-500" />
                  Ver detalle
                </>
              ) : (
                <>Ver detalle</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Column — contenedor por estado del kanban
// ============================================================

function KanbanColumn({
  columnId,
  tickets,
  verifyingId,
  onVerify,
  onStartInterview,
  onViewDetail,
}: {
  columnId: ColumnId
  tickets: TicketResponse[]
  verifyingId: string | null
  onVerify: (id: string) => void
  onStartInterview: (id: string) => void
  onViewDetail: (id: string) => void
}) {
  const config = COLUMNS.find((c) => c.id === columnId)!

  return (
    <div className="flex flex-col bg-slate-100/60 dark:bg-slate-800/40 rounded-2xl min-h-[480px] overflow-hidden">
      {/* Header con line de color */}
      <div className="px-4 pt-0 pb-3">
        <div className={`h-1 rounded-b-full mb-4 ${config.color}`} />
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {config.label}
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.countBg}`}>
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 px-3 pb-3 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="flex flex-col justify-center items-center px-4 h-48 text-center">
            <div className="mb-3">{config.emptyIcon}</div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              {config.emptyMsg}
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              columnId={columnId}
              isVerifying={verifyingId === ticket.id}
              onVerify={() => onVerify(ticket.id)}
              onStartInterview={() => onStartInterview(ticket.id)}
              onViewDetail={() => onViewDetail(ticket.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// Página
// ============================================================

export function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { tickets, isLoading, loadTickets, setTicketState } = useTickets()
  const { projects } = useProjects()
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [interviewTicketId, setInterviewTicketId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadTickets(projectId)
    }
  }, [projectId])

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  const handleVerify = async (ticketId: string) => {
    setVerifyingId(ticketId)
    try {
      const result = await verifyTicket(ticketId)
      if (result.ticket.estado === 'in_review') {
        toast.success(result.message ?? 'Commit verificado — ticket en revisión')
        setTicketState(ticketId, 'in_review')
      } else {
        toast(result.message ?? 'No se detectaron cambios relevantes', {
          icon: <Info className="size-5 text-indigo-500" />,
        })
      }
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Error al verificar el commit')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleStartInterview = (ticketId: string) => {
    setInterviewTicketId(ticketId)
  }

  const handleSelectMode = (mode: 'chat' | 'voice') => {
    if (interviewTicketId) {
      navigate(`/interview/${interviewTicketId}?mode=${mode}`)
      setInterviewTicketId(null)
    }
  }

  const getColumnTickets = (estado: ColumnId): TicketResponse[] =>
    tickets.filter((t) => t.estado === estado)

  const done = tickets.filter((t) => t.estado === 'done').length
  const total = tickets.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // ─── Loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white dark:bg-slate-800 mb-6 p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl h-28 animate-pulse" />
        <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-slate-100/60 dark:bg-slate-800/40 rounded-2xl h-96 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Empty state ─────────────────────────────────────────
  if (tickets.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 min-h-full">
        <div className="text-center">
          <Inbox className="mx-auto mb-4 size-12 text-slate-300 dark:text-slate-600" />
          <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
            Este proyecto no tiene tickets todavía.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Vuelve al selector de archivos para regenerarlos.
          </p>
        </div>
      </div>
    )
  }

  const repoName = currentProject ? getRepoName(currentProject.repo_url) : 'Proyecto'
  const ownerRepo = currentProject ? getOwnerRepo(currentProject.repo_url) : ''

  return (
    <div className="p-6 lg:p-8 min-h-full fade-in">
      {/* ═══ Header de proyecto ═══ */}
      {currentProject && (
        <div className="bg-white dark:bg-slate-800/40 shadow-sm mb-6 p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono text-slate-600 dark:text-slate-300 text-xs">
                  github.com
                </span>
              </div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xl truncate">
                {repoName}
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs truncate">
                {ownerRepo}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold ${pct === 100 ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100'}`}>
                {pct}%
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {done}/{total} completados
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="bg-slate-200 dark:bg-slate-700 mt-4 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full h-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ═══ Columnas ═══ */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
        {(['to_do', 'in_review', 'done'] as ColumnId[]).map((columnId) => (
          <KanbanColumn
            key={columnId}
            columnId={columnId}
            tickets={getColumnTickets(columnId)}
            verifyingId={verifyingId}
            onVerify={handleVerify}
            onStartInterview={handleStartInterview}
            onViewDetail={(id) => navigate(`/ticket/${id}`)}
          />
        ))}
      </div>

      {/* Modal de modalidad de entrevista */}
      <InterviewModeModal
        isOpen={interviewTicketId !== null}
        onSelectMode={handleSelectMode}
        onCancel={() => setInterviewTicketId(null)}
      />
    </div>
  )
}
