import { AxiosError } from 'axios'
import {
    AlertTriangle,
    ArrowLeft,
    Bot,
    CheckCircle,
    Info,
    Loader2,
    RotateCcw,
    Send,
    Volume2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { Spinner } from '../components/Spinner'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { evaluateAnswers, startInterview } from '../services/interviewService'
import type { EvaluateResponse } from '../types/interview'

const LOADING_MESSAGES = [
  'Tech Lead preparando entrevista...',
  'Analizando tus commits...',
  'Leyendo tu código...',
  'Entrevista lista, comencemos...',
]

export function ChatInterviewPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { speak, isSpeaking } = useSpeechSynthesis()

  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [result, setResult] = useState<EvaluateResponse | null>(null)

  useEffect(() => {
    if (ticketId) {
      loadQuestions()
    }
  }, [ticketId])

  useEffect(() => {
    if (!isLoadingQuestions) return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[i])
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoadingQuestions])

  const loadQuestions = async () => {
    if (!ticketId) return
    setIsLoadingQuestions(true)
    try {
      const data = await startInterview(ticketId, 'chat')
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(''))
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'No se pudieron cargar las preguntas')
      navigate(-1)
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSubmit = async () => {
    if (!ticketId) return
    const emptyIndex = answers.findIndex((a) => a.trim().length === 0)
    if (emptyIndex !== -1) {
      toast.error(`Responde la pregunta ${emptyIndex + 1} antes de enviar`)
      return
    }

    setIsEvaluating(true)
    try {
      const data = await evaluateAnswers(ticketId, questions, answers)
      setResult(data)
      if (data.aprobado) {
        toast.success('¡Entrevista aprobada!')
      } else {
        toast('Puedes intentar de nuevo', { icon: <Info className="size-5 text-indigo-500" /> })
      }
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Error al evaluar las respuestas')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleBack = () => navigate(-1)

  // ─── Loading ─────────────────────────────────────────────
  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col justify-center items-center gap-4 min-h-full">
        <Spinner size="md" label={loadingMessage} />
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Cancelar entrevista
        </button>
      </div>
    )
  }

  // ─── Resultado ───────────────────────────────────────────
  if (result) {
    return <ResultView result={result} isSpeaking={isSpeaking} speak={speak} onBack={handleBack} onRetry={() => {
      setResult(null)
      setAnswers(new Array(questions.length).fill(''))
    }} />
  }

  // ─── Formulario de entrevista ────────────────────────────
  const answered = answers.filter((a) => a.trim().length > 0).length
  const pct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0

  return (
    <div className="mx-auto p-6 max-w-2xl min-h-full fade-in">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 mb-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800/40 shadow-sm mb-6 p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="mb-0.5 font-medium text-slate-500 dark:text-slate-400 text-xs">Entrevista técnica</p>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xl">
              Defiende tu código ante el Tech Lead
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs">
              Responde {questions.length} pregunta{questions.length !== 1 ? 's' : ''} para completar la revisión
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-medium text-slate-600 dark:text-slate-300 text-xs shrink-0">
            <Bot size={12} />
            {answered}/{questions.length}
          </div>
        </div>
        {/* Progress */}
        <div className="bg-slate-200 dark:bg-slate-700 mt-4 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full h-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Preguntas + respuestas */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="space-y-2 slide-in">
            {/* Question bubble */}
            <div className="flex items-start gap-3">
              <div className="flex justify-center items-center bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 rounded-full size-8 shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700/80 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                <p className="text-slate-700 dark:text-slate-100 text-sm leading-relaxed">
                  {question}
                </p>
              </div>
            </div>

            {/* Answer input */}
            <div className="ml-11">
              <textarea
                value={answers[index]}
                onChange={(e) => updateAnswer(index, e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Escribe tu respuesta..."
                className="bg-white dark:bg-slate-800 focus:border-indigo-500 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 w-full text-slate-900 dark:text-slate-100 text-sm transition-all resize-none"
              />
              <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs text-right">
                {answers[index].length}/2000
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={isEvaluating}
          className="flex justify-center items-center gap-2 disabled:opacity-60 btn-primary px-4 py-2.5 rounded-xl w-full font-medium text-white text-sm"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Evaluando…
            </>
          ) : (
            <>
              <Send size={14} />
              Enviar respuestas
            </>
          )}
        </button>
        <button
          onClick={handleBack}
          className="flex justify-center items-center gap-1.5 mt-3 py-2 w-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Cancelar entrevista
        </button>
      </div>
    </div>
  )
}

// ============================================================
// ResultView — compartido entre chat y voz
// ============================================================
export function ResultView({
  result,
  isSpeaking,
  speak,
  onBack,
  onRetry,
}: {
  result: EvaluateResponse
  isSpeaking: boolean
  speak: (text: string) => void
  onBack: () => void
  onRetry: () => void
}) {
  return (
    <div className="mx-auto p-6 max-w-2xl min-h-full fade-in">
      <div className="bg-white dark:bg-slate-800/40 shadow-sm p-6 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
        {/* Header: badge + score */}
        <div className="flex justify-between items-center mb-6">
          {result.aprobado ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 px-3 py-1.5 rounded-full text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-5" />
              <span className="font-semibold text-sm">Aprobado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-amber-500/15 px-3 py-1.5 rounded-full text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-5" />
              <span className="font-semibold text-sm">No aprobado</span>
            </div>
          )}
          <div className="text-right">
            <p
              className={`text-3xl font-bold ${
                result.calificacion >= 70 ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {result.calificacion}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">de 100</p>
          </div>
        </div>

        {/* Barra general */}
        <div className="bg-slate-200 dark:bg-slate-700 mb-6 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              result.calificacion >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${result.calificacion}%` }}
          />
        </div>

        {/* Dimensiones */}
        {result.aspectos_evaluados && result.aspectos_evaluados.length > 0 && (
          <>
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Evaluación por dimensión
            </h3>
            <div className="space-y-3 mb-6">
              {result.aspectos_evaluados.map((aspecto, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                      {aspecto.dimension}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {aspecto.puntaje}/20
                    </span>
                  </div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full w-full h-1.5">
                    <div
                      className={`h-full rounded-full ${
                        aspecto.puntaje >= 14
                          ? 'bg-emerald-500'
                          : aspecto.puntaje >= 10
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${(aspecto.puntaje / 20) * 100}%` }}
                    />
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{aspecto.comentario}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Conceptos a mejorar */}
        {result.conceptos_a_mejorar && result.conceptos_a_mejorar.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Conceptos a profundizar
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.conceptos_a_mejorar.map((concepto, i) => (
                <span
                  key={i}
                  className="bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full text-indigo-700 dark:text-indigo-300 text-xs"
                >
                  {concepto}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="bg-slate-50 dark:bg-slate-900/50 mb-6 p-4 rounded-xl">
          <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100 text-sm">
            Feedback del evaluador
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {result.feedback}
          </p>
        </div>

        {/* Escuchar resultados */}
        <button
          onClick={() =>
            speak(`Tu calificación fue ${result.calificacion} de 100. ${result.feedback}`)
          }
          disabled={isSpeaking}
          className="flex items-center gap-2 disabled:opacity-50 mb-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm transition-colors"
        >
          <Volume2 size={16} />
          {isSpeaking ? 'Leyendo…' : 'Escuchar resultados'}
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 btn-primary px-4 py-2.5 rounded-xl font-medium text-white text-sm transition-colors"
          >
            Volver al dashboard
          </button>
          {!result.aprobado && (
            <button
              onClick={onRetry}
              className="flex flex-1 justify-center items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 text-sm transition-colors"
            >
              <RotateCcw size={14} />
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
