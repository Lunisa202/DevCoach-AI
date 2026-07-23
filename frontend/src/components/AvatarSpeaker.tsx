import { User } from 'lucide-react'
import { AudioBars } from './AudioBars'

interface Props {
  isSpeaking: boolean
  status: 'idle' | 'speaking' | 'listening' | 'processing'
  areBarsActive?: boolean
}

const STATUS_LABELS: Record<Props['status'], string> = {
  idle: '',
  speaking: 'Tech Lead hablando...',
  listening: 'Tu turno — el micrófono está habilitado',
  processing: 'Procesando...',
}

export function AvatarSpeaker({ isSpeaking, status, areBarsActive }: Props) {
  const isActive = areBarsActive ?? (status === 'speaking' || status === 'listening')
  const barColor = status === 'listening' ? 'emerald' : 'indigo'

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
        <User className={`h-12 w-12 transition-colors ${
          isSpeaking ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
        }`} />

        {/* Pulse rings when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-20" />
            <div className="absolute inset-[-4px] rounded-full border border-indigo-300 animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>

      {/* Audio bars */}
      {isActive && <AudioBars isActive={isActive} color={barColor} size="md" />}

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
