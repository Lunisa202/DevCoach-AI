import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { Spinner } from '../components/Spinner'
import { InterviewModeModal } from '../components/InterviewModeModal'
import { getProjectTickets } from '../services/projectService'
import { verifyTicket, getTicketReviews } from '../services/ticketService'
import type { TicketResponse } from '../types/project'
import type { ReviewDetailed } from '../types/interview'

type ColumnId = 'to_do' | 'in_review' | 'done'

// ============================================================
// TicketCard — tarjeta expandible con historial de reviews
// ============================================================

function TicketCard({
  ticket,
  columnId,
  isVerifying,
  onVerify,
  onStartInterview,
}: {
  ticket: TicketResponse
  columnId: ColumnId
  isVerifying: boolean
  onVerify: () => void
  onStartInterview: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reviews, setReviews] = useState<ReviewDetailed[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const loadReviews = async () => {
    if (reviews.length > 0) return // ya cargadas
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

  const handleExpand = () => {
    const next = !expanded
    setExpanded(next)
    if (next && (columnId === 'in_review' || columnId === 'done')) {
      loadReviews()
    }
  }

  const attemptCount = reviews.length

  return (
    <div
      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
      onClick={handleExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {ticket.titulo}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {attemptCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
              {attemptCount} intento{attemptCount !== 1 ? 's' : ''}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Description */}
      <p className={`text-xs text-slate-500 dark:text-slate-400 mt-2 ${expanded ? '' : 'line-clamp-2'}`}>
        {ticket.descripcion}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[ticket.prioridad]}`}>
          {ticket.prioridad}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {ticket.dificultad}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {ticket.tiempo_estimado}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
          {/* Actions */}
          {columnId === 'to_do' && (
            <button
              onClick={onVerify}
              disabled={isVerifying}
              className="w-full py-1.5 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                'Verificar commit'
              )}
            </button>
          )}

          {columnId === 'in_review' && (
            <button
              onClick={onStartInterview}
              className="w-full py-1.5 px-3 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
            >
              Iniciar entrevista
            </button>
          )}

          {columnId === 'done' && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Aprobado
            </span>
          )}

          {/* Reviews history */}
          {loadingReviews && (
            <div className="mt-3 flex justify-center">
              <Spinner size="sm" />
            </div>
          )}

          {!loadingReviews && reviews.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Historial de intentos
              </p>
              {reviews.map((review, i) => (
                <div key={review.id} className="p-2 rounded bg-slate-100 dark:bg-slate-700/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Intento {reviews.length - i}
                      {review.created_at && ` — ${new Date(review.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                    <span className={`text-xs font-medium ${review.aprobado ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {review.calificacion != null ? `${review.calificacion}/100` : (review.aprobado ? 'Aprobado' : 'No aprobado')}
                    </span>
                  </div>
                  {review.conceptos_a_mejorar && review.conceptos_a_mejorar.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {review.conceptos_a_mejorar.map((c, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const COLUMN_CONFIG: Record<ColumnId, { label: string; color: string }> = {
  to_do: { label: 'Por hacer', color: 'border-slate-300 dark:border-slate-600' },
  in_review: { label: 'En revisión', color: 'border-amber-400 dark:border-amber-500' },
  done: { label: 'Completado', color: 'border-emerald-400 dark:border-emerald-500' },
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  baja: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadTickets()
    }
  }, [projectId])

  const loadTickets = async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const data = await getProjectTickets(projectId)
      setTickets(data)
    } catch {
      toast.error('No se pudieron cargar los tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (ticketId: string) => {
    setVerifyingId(ticketId)
    try {
      const result = await verifyTicket(ticketId)
      if (result.ticket.estado === 'in_review') {
        toast.success(result.message ?? 'Commit verificado — ticket en revisión')
      } else {
        toast(result.message ?? 'No se detectaron cambios relevantes', { icon: 'ℹ️' })
      }
      await loadTickets()
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Error al verificar el commit')
    } finally {
      setVerifyingId(null)
    }
  }

  const [interviewTicketId, setInterviewTicketId] = useState<string | null>(null)

  const handleStartInterview = (ticketId: string) => {
    setInterviewTicketId(ticketId)
  }

  const handleSelectMode = (mode: 'chat' | 'voice') => {
    if (interviewTicketId) {
      navigate(`/interview/${interviewTicketId}?mode=${mode}`)
      setInterviewTicketId(null)
    }
  }

  const getColumnTickets = (estado: ColumnId): TicketResponse[] => {
    return tickets.filter((t) => t.estado === estado)
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Spinner size="md" label="Cargando tickets..." />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Este proyecto no tiene tickets todavía.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Tablero de tickets
      </h1>

      {/* Kanban grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['to_do', 'in_review', 'done'] as ColumnId[]).map((columnId) => {
          const config = COLUMN_CONFIG[columnId]
          const columnTickets = getColumnTickets(columnId)

          return (
            <div key={columnId} className={`border-t-4 ${config.color} rounded-lg bg-white dark:bg-slate-800 p-4`}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {config.label}
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                  {columnTickets.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    columnId={columnId}
                    isVerifying={verifyingId === ticket.id}
                    onVerify={() => handleVerify(ticket.id)}
                    onStartInterview={() => handleStartInterview(ticket.id)}
                  />
                ))}

                {columnTickets.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                    Sin tickets
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal selector de modalidad */}
      <InterviewModeModal
        isOpen={interviewTicketId !== null}
        onSelectMode={handleSelectMode}
        onCancel={() => setInterviewTicketId(null)}
      />
    </div>
  )
}
