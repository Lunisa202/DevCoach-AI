import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onSelectMode: (mode: 'chat' | 'voice') => void
  onCancel: () => void
}

const isSpeechSupported =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export function InterviewModeModal({ isOpen, onSelectMode, onCancel }: Props) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
          ¿Cómo querés hacer la entrevista?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Elegí la modalidad que prefieras para responder las preguntas del Tech Lead
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Chat */}
          <button
            onClick={() => onSelectMode('chat')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Chat
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Escribí tus respuestas
            </span>
          </button>

          {/* Voice */}
          <button
            onClick={() => onSelectMode('voice')}
            disabled={!isSpeechSupported}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors group ${
              isSpeechSupported
                ? 'border-slate-200 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                : 'border-slate-100 dark:border-slate-700 opacity-50 cursor-not-allowed'
            }`}
            title={!isSpeechSupported ? 'Tu navegador no soporta reconocimiento de voz. Usá Chrome o Edge.' : undefined}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Llamada
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isSpeechSupported ? 'Hablá con el Tech Lead' : 'No disponible en tu navegador'}
            </span>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-4 w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>,
    document.body,
  )
}
