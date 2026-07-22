interface Props {
  isSpeaking: boolean
  status: 'idle' | 'speaking' | 'listening' | 'processing'
}

const STATUS_LABELS: Record<Props['status'], string> = {
  idle: '',
  speaking: 'Tech Lead está hablando...',
  listening: 'Tu turno — respondé',
  processing: 'Procesando...',
}

export function AvatarSpeaker({ isSpeaking, status }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
        isSpeaking 
          ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-4 ring-indigo-400 ring-opacity-50 animate-pulse' 
          : status === 'listening'
            ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-4 ring-emerald-400 ring-opacity-50'
            : 'bg-slate-100 dark:bg-slate-700'
      }`}>
        {/* Tech Lead icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors ${
          isSpeaking ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>

        {/* Pulse rings when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-20" />
            <div className="absolute inset-[-4px] rounded-full border border-indigo-300 animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>

      {/* Status label */}
      {status !== 'idle' && (
        <p className={`text-sm font-medium ${
          status === 'speaking' ? 'text-indigo-600 dark:text-indigo-400' :
          status === 'listening' ? 'text-emerald-600 dark:text-emerald-400' :
          'text-slate-500 dark:text-slate-400'
        }`}>
          {STATUS_LABELS[status]}
        </p>
      )}
    </div>
  )
}
