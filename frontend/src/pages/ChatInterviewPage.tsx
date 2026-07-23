import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { Spinner } from '../components/Spinner'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { startInterview, evaluateAnswers } from '../services/interviewService'
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

  // Progressive loading messages
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

    // Validar que todas las respuestas tengan contenido
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
        toast('Puedes intentar de nuevo', { icon: 'ℹ️' })
      }
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Error al evaluar las respuestas')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4">
        <Spinner size="md" label={loadingMessage} />
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ← Cancelar entrevista
        </button>
      </div>
    )
  }

  // Result state
  if (result) {
    return (
      <div className="min-h-full p-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Header: Badge + Calificación */}
          <div className="flex items-center justify-between mb-6">
            {result.aprobado ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Aprobado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-semibold">No aprobado</span>
              </div>
            )}
            <div className="text-right">
              <p className={`text-3xl font-bold ${result.calificacion >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {result.calificacion}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">de 100</p>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-6">
            <div
              className={`h-full rounded-full transition-all ${result.calificacion >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${result.calificacion}%` }}
            />
          </div>

          {/* 5 Dimensiones */}
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Evaluación por dimensión
          </h3>
          <div className="space-y-3 mb-6">
            {result.aspectos_evaluados.map((aspecto, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {aspecto.dimension}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {aspecto.puntaje}/20
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                  <div
                    className={`h-full rounded-full ${aspecto.puntaje >= 14 ? 'bg-emerald-500' : aspecto.puntaje >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${(aspecto.puntaje / 20) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">{aspecto.comentario}</p>
              </div>
            ))}
          </div>

          {/* Conceptos a mejorar */}
          {result.conceptos_a_mejorar.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Conceptos a profundizar
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.conceptos_a_mejorar.map((concepto, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                    {concepto}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feedback general */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Feedback del evaluador
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {result.feedback}
            </p>
          </div>

          {/* Botón de bocina */}
          <div className="mb-4">
            <button
              onClick={() => speak(`Tu calificación fue ${result.calificacion} de 100. ${result.feedback}`)}
              disabled={isSpeaking}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50"
            >
              🔊 {isSpeaking ? 'Leyendo...' : 'Escuchar resultados'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Volver al dashboard
            </button>
            {!result.aprobado && (
              <button
                onClick={() => {
                  setResult(null)
                  setAnswers(new Array(questions.length).fill(''))
                }}
                className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Intentar de nuevo
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Interview form
  return (
    <div className="min-h-full p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Entrevista técnica
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Responde las preguntas del Tech Lead sobre tu código
      </p>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="space-y-2">
            {/* Question bubble */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg rounded-tl-none px-4 py-3 max-w-[85%]">
                <p className="text-sm text-slate-700 dark:text-slate-200">
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
                placeholder="Escribí tu respuesta..."
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors resize-none text-sm"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
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
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isEvaluating && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isEvaluating ? 'Evaluando...' : 'Enviar respuestas'}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-3 py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ← Cancelar entrevista
        </button>
      </div>
    </div>
  )
}
