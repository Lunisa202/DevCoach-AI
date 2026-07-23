import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { Spinner } from '../components/Spinner'
import { InterviewModeModal } from '../components/InterviewModeModal'
import { useTicketDetail } from '../hooks/useTicketDetail'

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  baja: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { ticket, reviews, isLoading, isVerifying, handleVerify, parseAspectos } = useTicketDetail(ticketId)

  const [showModeModal, setShowModeModal] = useState(false)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  const handleSelectMode = (mode: 'chat' | 'voice') => {
    setShowModeModal(false)
    navigate(`/interview/${ticketId}?mode=${mode}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Spinner size="md" label="Cargando ticket..." />
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al dashboard
      </button>

      {/* Ticket header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{ticket.titulo}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${ticket.estado === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : ticket.estado === 'in_review' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {ticket.estado === 'to_do' ? 'Por hacer' : ticket.estado === 'in_review' ? 'En revisión' : 'Completado'}
          </span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{ticket.descripcion}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[ticket.prioridad]}`}>Prioridad: {ticket.prioridad}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Dificultad: {ticket.dificultad}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Tiempo: {ticket.tiempo_estimado}</span>
        </div>

        {ticket.estado === 'to_do' && (
          <button onClick={handleVerify} disabled={isVerifying} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            {isVerifying && <Spinner size="sm" />}
            {isVerifying ? 'Verificando...' : 'Verificar commit'}
          </button>
        )}

        {ticket.estado === 'in_review' && (
          <button onClick={() => setShowModeModal(true)} className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
            Iniciar entrevista
          </button>
        )}
      </div>

      {/* Interview history */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Historial de entrevistas
          {reviews.length > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({reviews.length} intento{reviews.length !== 1 ? 's' : ''})</span>}
        </h2>

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-4">Aún no hay entrevistas para este ticket.</p>
        ) : (
          reviews.map((review) => {
            const isExpanded = expandedReview === review.id
            const aspectos = parseAspectos(review.aspectos_evaluados)

            return (
              <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header clickeable */}
                <div
                  onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${review.aprobado ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      {review.aprobado ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {review.aprobado ? 'Aprobado' : 'No aprobado'}
                        {review.calificacion != null && <span className={`ml-2 ${review.calificacion >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{review.calificacion}/100</span>}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{review.created_at ? new Date(review.created_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                    {review.calificacion != null && (
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <div className={`h-full rounded-full ${review.calificacion >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${review.calificacion}%` }} />
                      </div>
                    )}

                    {aspectos.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Evaluación por dimensión</p>
                        {aspectos.map((aspecto, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{aspecto.dimension}</span>
                              <span className="text-xs text-slate-400">{aspecto.puntaje}/20</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div className={`h-full rounded-full ${aspecto.puntaje >= 14 ? 'bg-emerald-500' : aspecto.puntaje >= 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(aspecto.puntaje / 20) * 100}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{aspecto.comentario}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {review.conceptos_a_mejorar && review.conceptos_a_mejorar.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Conceptos a profundizar</p>
                        <div className="flex flex-wrap gap-1.5">
                          {review.conceptos_a_mejorar.map((c, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{review.feedback_evaluator}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <InterviewModeModal isOpen={showModeModal} onSelectMode={handleSelectMode} onCancel={() => setShowModeModal(false)} />
    </div>
  )
}
