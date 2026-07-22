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

export function VoiceInterviewPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis()
  const { start: startListening, stop: stopListening, transcript, isListening, error: sttError, resetTranscript } = useSpeechRecognition()

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [result, setResult] = useState<EvaluateResponse | null>(null)
  const [reRecordingIndex, setReRecordingIndex] = useState<number | null>(null)

  const hasStartedRef = useRef(false)

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
      toast.error('Respondé antes de continuar')
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
      toast.error(`Respondé la pregunta ${emptyIndex + 1} antes de enviar`)
      return
    }

    setPhase('evaluating')
    try {
      const data = await evaluateAnswers(ticketId, questions, answers)
      setResult(data)
      setPhase('result')

      // Read feedback aloud
      if (data.aprobado) {
        await speak(`¡Felicidades! Has aprobado con ${data.calificacion} puntos de 100. ${data.feedback}`)
        toast.success('¡Entrevista aprobada!')
      } else {
        await speak(`Tu calificación fue ${data.calificacion} de 100. ${data.feedback}. Podés intentar de nuevo.`)
        toast('Podés intentar de nuevo', { icon: 'ℹ️' })
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
    if (isListening) return 'listening'
    return 'idle'
  }

  // Loading
  if (phase === 'loading') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Spinner size="md" label="Preparando la entrevista..." />
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
          Podés editar el texto o volver a grabar cualquier respuesta antes de enviar
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
      <AvatarSpeaker isSpeaking={isSpeaking} status={getStatus()} />

      {/* Live transcript */}
      {(phase === 'listening' || isListening) && (
        <div className="mt-6 w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 min-h-[80px]">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {transcript || <span className="text-slate-400 italic">Esperando tu respuesta...</span>}
            </p>
          </div>

          <div className="flex gap-2 mt-3">
            {!isListening && transcript.trim().length === 0 && (
              <button
                onClick={() => { resetTranscript(); startListening() }}
                className="flex-1 py-2.5 px-4 border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg text-sm"
              >
                🎤 Reiniciar micrófono
              </button>
            )}
            <button
              onClick={() => { stopListening(); speak(questions[currentQuestionIndex]).then(() => { resetTranscript(); startListening() }) }}
              className="py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium rounded-lg text-sm"
            >
              🔁 Repetir pregunta
            </button>
            <button
              onClick={handleFinishedAnswering}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Terminé de responder
            </button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
      )}

      {/* Evaluating spinner */}
      {phase === 'evaluating' && (
        <div className="mt-6">
          <Spinner size="md" label="Evaluando tus respuestas..." />
        </div>
      )}
    </div>
  )
}
