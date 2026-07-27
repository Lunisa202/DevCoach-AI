import { AxiosError } from 'axios'
import {
    ArrowLeft,
    Check,
    Info,
    Mic,
    RotateCcw,
    Send,
    Timer,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { AvatarSpeaker } from '../components/AvatarSpeaker'
import { Spinner } from '../components/Spinner'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { evaluateAnswers, startInterview } from '../services/interviewService'
import type { EvaluateResponse } from '../types/interview'
import { clearCache } from '../utils/apiCache'
import { ResultView } from './ChatInterviewPage'

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
  const {
    start: startListening,
    stop: stopListening,
    transcript,
    isListening,
    error: sttError,
    resetTranscript,
  } = useSpeechRecognition()

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

  // Detect active speech
  useEffect(() => {
    if (transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript
      setIsSpeechActive(true)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        setIsSpeechActive(false)
      }, 1500)
    }
  }, [transcript])

  // Timeout 60s sin hablar → desactiva micrófono
  useEffect(() => {
    if (phase !== 'listening' || !isListening) return
    const timeout = setTimeout(() => {
      if (transcript.trim().length === 0) {
        stopListening()
        setMicTimedOut(true)
        toast('Micrófono deshabilitado por falta de respuesta. Usa "Reiniciar mic" para continuar.', {
          icon: <Timer className="size-5 text-amber-500" />,
          duration: 6000,
        })
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
      await speak('Bienvenido a tu defensa de PR. Vamos a hablar sobre tu código. Te haré algunas preguntas.')
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
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = currentAnswer
    setAnswers(newAnswers)
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
    const emptyIndex = answers.findIndex((a) => a.trim().length === 0)
    if (emptyIndex !== -1) {
      toast.error(`Responde la pregunta ${emptyIndex + 1} antes de enviar`)
      return
    }
    setPhase('evaluating')
    try {
      const data = await evaluateAnswers(ticketId, questions, answers)
      setResult(data)
      setPhase('result')
      if (data.aprobado) {
        toast.success('¡Entrevista aprobada!')
        clearCache()
        if (data.xp_earned) {
          toast.success(`+${data.xp_earned} XP ganados`, { icon: '⭐' })
        }
        if (data.level_up) {
          setTimeout(() => toast.success(`🎉 ¡Subiste al nivel ${data.new_level}!`, { duration: 5000 }), 800)
        }
        if (data.new_achievements && data.new_achievements.length > 0) {
          data.new_achievements.forEach((_id: string, i: number) => {
            setTimeout(() => toast.success(`🏅 ¡Nuevo logro desbloqueado!`, { duration: 5000 }), 1200 + i * 600)
          })
        }
      } else {
        toast('Puedes intentar de nuevo', { icon: <Info className="size-5 text-indigo-500" /> })
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

  const areBarsActive = isSpeaking || (phase === 'listening' && isSpeechActive)

  // ─── Loading ─────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-full">
        <Spinner size="md" label={loadingMessage} />
      </div>
    )
  }

  // ─── Result ──────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <ResultView
        result={result}
        isSpeaking={isSpeaking}
        speak={speak}
        onBack={() => navigate(-1)}
        onRetry={() => {
          setResult(null)
          setAnswers(new Array(questions.length).fill(''))
          hasStartedRef.current = false
          loadAndStart()
        }}
      />
    )
  }

  // ─── Review phase ────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="mx-auto p-6 max-w-2xl min-h-full fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mb-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        {/* Header card */}
        <div className="bg-white dark:bg-slate-800/40 shadow-sm mb-6 p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
          <p className="mb-0.5 font-medium text-slate-500 dark:text-slate-400 text-xs">Entrevista técnica</p>
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xl">
            Revisa tus respuestas
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs">
            Puedes editar el texto o volver a grabar cualquier respuesta antes de enviar
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((question, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800/40 shadow-sm p-4 border border-slate-200 dark:border-slate-700/50 rounded-2xl slide-in"
            >
              <p className="mb-2 font-medium text-slate-700 dark:text-slate-200 text-sm">
                Pregunta {i + 1}: {question}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => handleEditAnswer(i, e.target.value)}
                rows={3}
                className="bg-slate-50 dark:bg-slate-900 focus:border-indigo-500 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 w-full text-slate-900 dark:text-slate-100 text-sm transition-all resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                {reRecordingIndex === i && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <Mic className="size-4 animate-pulse" />
                    <span>Grabando…</span>
                    {transcript && (
                      <span className="max-w-[150px] text-slate-400 italic truncate">
                        "{transcript}"
                      </span>
                    )}
                  </div>
                )}
                <div className={`flex gap-2 ${reRecordingIndex === i ? '' : 'ml-auto'}`}>
                  {reRecordingIndex === i ? (
                    <button
                      onClick={handleFinishReRecord}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-white text-xs transition-colors"
                    >
                      <span className="bg-white rounded-full w-2 h-2 animate-pulse" />
                      Terminé de grabar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReRecord(i)}
                      disabled={reRecordingIndex !== null}
                      className="flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 px-3 py-1.5 border border-indigo-300 dark:border-indigo-600 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs transition-colors"
                    >
                      <Mic className="size-3.5" />
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
          disabled={(phase as Phase) === 'evaluating'}
          className="flex justify-center items-center gap-2 disabled:opacity-60 btn-primary mt-6 px-4 py-2.5 rounded-xl w-full font-medium text-white text-sm"
        >
          <Send size={14} />
          Enviar respuestas
        </button>
      </div>
    )
  }

  // ─── Main interview phase (greeting/asking/listening) ────
  return (
    <div className="flex flex-col justify-center items-center p-6 min-h-full fade-in">
      <AvatarSpeaker isSpeaking={isSpeaking} status={getStatus()} areBarsActive={areBarsActive} />

      {/* Mic timed out message */}
      {micTimedOut && phase === 'listening' && (
        <p className="flex items-center gap-1.5 mt-3 text-amber-500 dark:text-amber-400 text-sm animate-pulse">
          <Timer className="size-4" />
          Micrófono deshabilitado por inactividad. Presiona "Reiniciar mic" para continuar.
        </p>
      )}

      {/* Live transcript */}
      {phase === 'listening' && (
        <div className="mt-6 w-full max-w-md">
          <div className="bg-white dark:bg-slate-800/40 shadow-sm p-4 border border-slate-200 dark:border-slate-700/50 rounded-2xl min-h-[80px]">
            <p className="mb-1 font-medium text-slate-500 dark:text-slate-400 text-xs">
              Transcripción en tiempo real
            </p>
            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
              {transcript || <span className="text-slate-400 italic">Esperando tu respuesta…</span>}
            </p>
          </div>

          <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 mt-3">
            {!isListening && (
              <button
                onClick={() => {
                  resetTranscript()
                  setMicTimedOut(false)
                  startListening()
                }}
                className="flex justify-center items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg w-full sm:w-auto text-indigo-600 dark:text-indigo-400 text-xs transition-colors"
              >
                <Mic className="size-3.5" />
                Reiniciar mic
              </button>
            )}
            <button
              onClick={async () => {
                stopListening()
                setPhase('asking')
                resetTranscript()
                await speak(questions[currentQuestionIndex])
                setPhase('listening')
                startListening()
              }}
              className="flex justify-center items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full sm:w-auto text-slate-500 dark:text-slate-400 text-xs transition-colors"
            >
              <RotateCcw className="size-3.5" />
              Repetir pregunta
            </button>
            <button
              onClick={handleFinishedAnswering}
              className="flex justify-center items-center gap-1.5 sm:ml-auto bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg w-full sm:w-auto font-medium text-white text-xs transition-colors"
            >
              <Check className="size-3.5" />
              Terminé de responder
            </button>
          </div>

          <p className="mt-2 text-slate-400 dark:text-slate-500 text-xs text-center">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
      )}

      {/* Cancel */}
      <div className="mt-8">
        <button
          onClick={() => {
            stopListening()
            stopSpeaking()
            navigate(-1)
          }}
          className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Cancelar entrevista
        </button>
      </div>

      {/* Evaluating spinner */}
      {(phase as Phase) === 'evaluating' && (
        <div className="mt-6">
          <Spinner size="md" label="Evaluando tus respuestas..." />
        </div>
      )}
    </div>
  )
}
