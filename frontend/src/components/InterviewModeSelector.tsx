import { useState } from 'react'
import { apiFetch } from '../lib/api'

/**
 * Detecta si el navegador soporta la Web Speech API (SpeechRecognition).
 * Chrome y Edge la tienen; Firefox y Safari tienen soporte limitado o nulo.
 */
function hasSpeechRecognitionSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

interface InterviewModeSelectorProps {
  /** ID del ticket que inicia la entrevista */
  ticketId: string
  /** Callback que recibe las preguntas generadas y el modo seleccionado */
  onModeSelected: (mode: 'chat' | 'voice', questions: string[]) => void
}

type InterviewMode = 'chat' | 'voice'

interface StartInterviewResponse {
  questions: string[]
}

export function InterviewModeSelector({
  ticketId,
  onModeSelected,
}: InterviewModeSelectorProps) {
  const speechSupported = hasSpeechRecognitionSupport()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelectMode(mode: InterviewMode) {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch<StartInterviewResponse>(
        '/api/interviews/start',
        {
          method: 'POST',
          body: JSON.stringify({ ticket_id: ticketId, mode }),
        },
      )
      onModeSelected(mode, response.questions)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar la entrevista. Inténtalo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Entrevista técnica
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            El Tech Lead te hará preguntas sobre el cambio que realizaste.
            Elige cómo quieres responder.
          </p>
        </div>

        {/* Botones de modo */}
        <div className="flex flex-col gap-4">
          {/* Modo Chat */}
          <button
            onClick={() => handleSelectMode('chat')}
            disabled={loading}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            aria-label="Iniciar entrevista en modo Chat"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Chat</p>
              <p className="text-sm text-gray-500">
                Responde las preguntas escribiendo texto
              </p>
            </div>
          </button>

          {/* Modo Llamada */}
          <button
            onClick={() => handleSelectMode('voice')}
            disabled={loading || !speechSupported}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl border-2 transition-colors text-left ${
              speechSupported
                ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            }`}
            aria-label={
              speechSupported
                ? 'Iniciar entrevista en modo Llamada'
                : 'Modo Llamada no disponible en este navegador'
            }
            aria-disabled={!speechSupported}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                speechSupported ? 'bg-emerald-600' : 'bg-gray-400'
              }`}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Llamada</p>
              <p className="text-sm text-gray-500">
                {speechSupported
                  ? 'Responde las preguntas hablando por voz'
                  : 'No disponible — tu navegador no soporta reconocimiento de voz'}
              </p>
            </div>
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div
            role="alert"
            className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Indicador de carga */}
        {loading && (
          <p className="mt-4 text-sm text-gray-400 animate-pulse">
            Iniciando entrevista...
          </p>
        )}
      </div>
    </div>
  )
}
