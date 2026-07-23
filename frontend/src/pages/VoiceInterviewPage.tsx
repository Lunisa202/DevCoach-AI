import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { Spinner } from '../components/Spinner'
import { AvatarSpeaker } from '../components/AvatarSpeaker'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { startInterview, evaluateAnswers } from '../services/interviewService'
import type { EvaluateResponse } from '../types/interview'

type Phase = 'loading' | 'greeting' | 'asking' | 'listening' | 'review' | 'evaluating' | 'result'

const LOADING_MESSAGES = [
  'Tech Lead preparando entrevista...',
  'Analizando tus commits...',
  'Leyendo tu código...',
  'Entrevista lista, comencemos...',
]

export function VoiceInterviewPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis()
  const { start: startListening, stop: stopListening, transcript, isListening, error: sttError, resetTranscript } = useSpeechRecognition()

  const [phase, setPhase] = useState<Phase>('loading')
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [result, setResult] = useState<EvaluateResponse | null>(null)
  const [reRecordingIndex, setReRecordingIndex] = useState<number | null>(null)
  const [isSpeechActive, setIsSpeechActive] = useState(false)
  const [micTimedOut, setMicTimedOut] = useState(false)

  const hasStartedRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTranscriptRef = useRef('')

  // Load questions on mount
  useEffect(() => {
    if (ticketId && !hasStartedRef.current) {
      hasStartedRef.current = true
      loadAndStart()
    }
  }, [ticketId])

  // Handle STT errors — fallback to chat
  useEffect(() => {
    if (sttError) {
      toast.error('Problema con el micrófono. Cambiando a modo chat.')
      navigate(`/interview/${ticketId}?mode=chat`, { replace: true })
    }
  }, [sttError])

  // Progressive loading messages
  useEffect(() => {
    if (phase !== 'loading') return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[i])
    }, 2500)
    return () => clearInterval(interval)
  }, [phase])

  // Detect active speech — barras solo se mueven cuando hay nueva transcripción
  useEffect(() => {
    if (transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript
      setIsSpeechActive(true)

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        setIsSpeechActive(false)
      }, 1500) // 1.5s sin nueva transcripción = silencio
    }
  }, [transcript])

  // Timeout 60s sin hablar → desactiva micrófono
  useEffect(() => {
    if (phase !== 'listening' || !isListening) return

    const timeout = setTimeout(() => {
      if (transcript.trim().length === 0) {
        stopListening()
        setMicTimedOut(true)
        toast('Micrófono deshabilitado por falta de respuesta. Usa "Reiniciar mic" para continuar.', { icon: '⏱️', duration: 6000 })
      }
    }, 60000)

    return () => clearTimeout(timeout)
  }, [phase, isListening, transcript])

  const loadAndStart = async () => {
    if (!ticketId) return
    try {
      const data = await startInterview(ticketId, 'llamada')
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(''))
      setPhase('greeting')

      // Greeting
      await speak('Bienvenido a tu defensa de PR. Vamos a hablar sobre tu código. Te haré algunas preguntas.')
      
      // Start first question
      await askQuestion(0, data.questions)
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'No se pudo iniciar la entrevista')
      navigate(-1)
    }
  }

  const askQuestion = async (index: number, qs: string[]) => {
    setCurrentQuestionIndex(index)
    setPhase('asking')
    await speak(`Pregunta ${index + 1}. ${qs[index]}`)
    
    // Start listening after question is spoken
    setPhase('listening')
    resetTranscript()
    startListening()
  }

  const handleFinishedAnswering = () => {
    stopListening()
    
    const currentAnswer = transcript.trim()
    if (!currentAnswer) {
      toast.error('Responde antes de continuar')
      startListening()
      return
    }

    // Save answer
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = currentAnswer
    setAnswers(newAnswers)

    // Move to next question or review
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex < questions.length) {
      askQuestion(nextIndex, questions)
    } else {
      setPhase('review')
    }
  }

  const handleReRecord = (index: number) => {
    setReRecordingIndex(index)
    resetTranscript()
    startListening()
  }

  const handleFinishReRecord = () => {
    if (reRecordingIndex === null) return
    stopListening()
    
    const newAnswer = transcript.trim()
    if (newAnswer) {
      const newAnswers = [...answers]
      newAnswers[reRecordingIndex] = newAnswer
      setAnswers(newAnswers)
    }
    setReRecordingIndex(null)
  }

  const handleEditAnswer = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    if (!ticketId) return
    
    const emptyIndex = answers.findIndex(a => a.trim().length === 0)
    if (emptyIndex !== -1) {
      toast.error(`Responde la pregunta ${emptyIndex + 1} antes de enviar`)
      return
    }

    setPhase('evaluating')
    try {
      const data = await evaluateAnswers(ticketId, questions, answers)
      setResult(data)
      setPhase('result')

      // No leer automáticamente — el usuario puede usar el botón de bocina
      if (data.aprobado) {
        toast.success('¡Entrevista aprobada!')
      } else {
        toast('Puedes intentar de nuevo', { icon: 'ℹ️' })
      }
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      toast.error(error.response?.data?.detail ?? 'Error al evaluar')
      setPhase('review')
    }
  }

  const getStatus = (): 'idle' | 'speaking' | 'listening' | 'processing' => {
    if (phase === 'evaluating' || phase === 'loading') return 'processing'
    if (isSpeaking) return 'speaking'
    if (phase === 'listening' && isListening && !micTimedOut) return 'listening'
    return 'idle'
  }

  // Barras se activan solo con speech real, pero el status label se mantiene
  const areBarsActive = isSpeaking || (phase === 'listening' && isSpeechActive)

  // Loading
  if (phase === 'loading') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Spinner size="md" label={loadingMessage} />
      </div>
    )
  }

  // Result
  if (phase === 'result' && result) {
    return (
      <div className="min-h-full p-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
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
            <p className={`text-3xl font-bold ${result.calificacion >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {result.calificacion}<span className="text-sm text-slate-400">/100</span>
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-6">
            {result.feedback}
          </p>

          {/* 5 Dimensiones con barras */}
          {result.aspectos_evaluados && result.aspectos_evaluados.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Evaluación por dimensión
              </h3>
              <div className="space-y-3">
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
            </div>
          )}

          {/* Conceptos a mejorar */}
          {result.conceptos_a_mejorar && result.conceptos_a_mejorar.length > 0 && (
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

          {/* Botón de bocina para escuchar los resultados */}
          <div className="mb-4">
            <button
              onClick={() => speak(`Tu calificación fue ${result.calificacion} de 100. ${result.feedback}`)}
              disabled={isSpeaking}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50"
            >
              🔊 {isSpeaking ? 'Leyendo...' : 'Escuchar resultados'}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm">
              Volver al dashboard
            </button>
            {!result.aprobado && (
              <button onClick={() => { setResult(null); setAnswers(new Array(questions.length).fill('')); loadAndStart() }} className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-sm">
                Intentar de nuevo
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Review phase — editable transcriptions
  if (phase === 'review') {
    return (
      <div className="min-h-full p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Revisá tus respuestas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Puedes editar el texto o volver a grabar cualquier respuesta antes de enviar
        </p>

        <div className="space-y-4">
          {questions.map((question, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Pregunta {i + 1}: {question}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => handleEditAnswer(i, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                {reRecordingIndex === i && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                    <span>Grabando...</span>
                    {transcript && <span className="text-slate-400 italic truncate max-w-[150px]">"{transcript}"</span>}
                  </div>
                )}
                <div className={`flex gap-2 ${reRecordingIndex === i ? '' : 'ml-auto'}`}>
                  {reRecordingIndex === i ? (
                    <button
                      onClick={handleFinishReRecord}
                      className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Terminé de grabar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReRecord(i)}
                      disabled={reRecordingIndex !== null}
                      className="text-xs px-3 py-1.5 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                      Volver a grabar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={phase === 'evaluating'}
          className="w-full mt-6 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          Enviar respuestas
        </button>
      </div>
    )
  }

  // Main interview phase (greeting, asking, listening)
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <AvatarSpeaker isSpeaking={isSpeaking} status={getStatus()} areBarsActive={areBarsActive} />

      {/* Mic timed out message */}
      {micTimedOut && phase === 'listening' && (
        <p className="mt-3 text-sm text-amber-500 dark:text-amber-400 animate-pulse">
          Micrófono deshabilitado por inactividad. Presiona "Reiniciar mic" para continuar.
        </p>
      )}

      {/* Live transcript — only show when listening phase */}
      {phase === 'listening' && (
        <div className="mt-6 w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 min-h-[80px]">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {transcript || <span className="text-slate-400 italic">Esperando tu respuesta...</span>}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
            {/* Reiniciar micrófono — solo si el mic se desactivó */}
            {!isListening && (
              <button
                onClick={() => { resetTranscript(); setMicTimedOut(false); startListening() }}
                className="w-full sm:w-auto px-3 py-2 text-xs border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                🎤 Reiniciar mic
              </button>
            )}
            {/* Repetir pregunta */}
            <button
              onClick={async () => {
                stopListening()
                setPhase('asking')
                resetTranscript()
                await speak(questions[currentQuestionIndex])
                setPhase('listening')
                startListening()
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              🔁 Repetir pregunta
            </button>
            {/* Terminé de responder */}
            <button
              onClick={handleFinishedAnswering}
              className="w-full sm:w-auto sm:ml-auto px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
            >
              ✓ Terminé de responder
            </button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
      )}

      {/* Cancel / back button — always visible */}
      <div className="mt-8">
        <button
          onClick={() => {
            stopListening()
            stopSpeaking()
            navigate(-1)
          }}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ← Cancelar entrevista
        </button>
      </div>

      {/* Evaluating spinner */}
      {phase === 'evaluating' && (
        <div className="mt-6">
          <Spinner size="md" label="Evaluando tus respuestas..." />
        </div>
      )}
    </div>
  )
}
