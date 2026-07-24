'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { interviewQuestions, type Ticket } from '@/lib/data'
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  AudioLines,
  Send,
  Mic,
  User,
} from 'lucide-react'

type Mode = 'chat' | 'voice'
type Message = { role: 'bot' | 'user'; text: string }

export function InterviewView({
  ticket,
  onBack,
}: {
  ticket: Ticket
  onBack: () => void
}) {
  const [mode, setMode] = useState<Mode>('chat')
  const [step, setStep] = useState(0)

  return (
    <div className="flex h-full flex-col">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Salir
        </button>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {ticket.title}
          </p>
          <p className="text-xs text-muted-foreground">
            Pregunta {Math.min(step + 1, interviewQuestions.length)} de{' '}
            {interviewQuestions.length}
          </p>
        </div>

        {/* Mode switch */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <ModeButton
            active={mode === 'chat'}
            onClick={() => setMode('chat')}
            icon={MessageSquare}
            label="Chat"
          />
          <ModeButton
            active={mode === 'voice'}
            onClick={() => setMode('voice')}
            icon={AudioLines}
            label="Voz"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-brand-gradient transition-all duration-500"
          style={{
            width: `${(step / interviewQuestions.length) * 100}%`,
          }}
        />
      </div>

      {mode === 'chat' ? (
        <ChatMode step={step} setStep={setStep} />
      ) : (
        <VoiceMode step={step} setStep={setStep} />
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof MessageSquare
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-gradient text-white shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function ChatMode({
  step,
  setStep,
}: {
  step: number
  setStep: (n: number) => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '¡Hola! Soy tu Tech Lead virtual. Vamos a repasar tu solución con algunas preguntas. Responde con tus propias palabras.' },
    { role: 'bot', text: interviewQuestions[0].text },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    const nextStep = step + 1
    const nextMessages: Message[] = [...messages, { role: 'user', text }]
    if (nextStep < interviewQuestions.length) {
      nextMessages.push({ role: 'bot', text: interviewQuestions[nextStep].text })
    } else {
      nextMessages.push({
        role: 'bot',
        text: 'Gracias por tus respuestas. Estoy evaluando tu desempeño… recibirás tu calificación en unos segundos.',
      })
    }
    setMessages(nextMessages)
    setStep(nextStep)
    setInput('')
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'flex items-end gap-2.5',
              m.role === 'user' && 'flex-row-reverse',
            )}
          >
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                m.role === 'bot'
                  ? 'bg-brand-gradient text-white'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {m.role === 'bot' ? (
                <Bot className="size-4" />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[80%] text-pretty rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                m.role === 'bot'
                  ? 'rounded-bl-sm border border-border bg-card text-foreground'
                  : 'rounded-br-sm bg-brand-gradient text-white',
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Escribe tu respuesta…"
            className="max-h-32 min-h-9 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim()}
            aria-label="Enviar respuesta"
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl transition-all',
              input.trim()
                ? 'bg-brand-gradient text-white hover:brightness-110'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function VoiceMode({
  step,
  setStep,
}: {
  step: number
  setStep: (n: number) => void
}) {
  const [recording, setRecording] = useState(false)
  const current = interviewQuestions[Math.min(step, interviewQuestions.length - 1)]

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      {/* Bot avatar */}
      <div className="relative">
        <span
          className={cn(
            'absolute inset-0 rounded-full bg-primary/30 blur-xl transition-opacity',
            recording ? 'opacity-100 animate-pulse' : 'opacity-40',
          )}
        />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-brand-gradient shadow-xl shadow-primary/30">
          <Bot className="size-11 text-white" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-primary">Tech Lead virtual</p>

      {/* Waveform */}
      <div className="mt-6 flex h-16 items-center justify-center gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1 rounded-full transition-all',
              recording ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
            style={{
              height: recording ? `${20 + Math.abs(Math.sin(i * 0.9)) * 44}px` : '8px',
              animation: recording
                ? `pulse 1s ease-in-out ${i * 0.05}s infinite alternate`
                : undefined,
            }}
          />
        ))}
      </div>

      {/* Current question */}
      <div className="mt-6 max-w-md rounded-2xl border border-border bg-card px-5 py-4">
        <p className="text-pretty text-sm leading-relaxed text-foreground">
          {current.text}
        </p>
      </div>

      {/* Mic button */}
      <button
        type="button"
        onClick={() => {
          if (recording && step < interviewQuestions.length) {
            setStep(step + 1)
          }
          setRecording((v) => !v)
        }}
        className="group relative mt-8 flex size-20 items-center justify-center rounded-full"
      >
        <span
          className={cn(
            'absolute inset-0 rounded-full transition-all',
            recording
              ? 'animate-ping bg-destructive/40'
              : 'bg-primary/20 group-hover:bg-primary/30',
          )}
        />
        <span
          className={cn(
            'relative flex size-20 items-center justify-center rounded-full text-white shadow-lg transition-all',
            recording
              ? 'bg-destructive shadow-destructive/30'
              : 'bg-brand-gradient shadow-primary/30 group-hover:brightness-110',
          )}
        >
          <Mic className="size-8" />
        </span>
      </button>
      <p className="mt-3 text-sm text-muted-foreground">
        {recording ? 'Escuchando… toca para responder' : 'Toca para hablar'}
      </p>

      {/* Live transcript */}
      <div className="mt-6 min-h-[3rem] w-full max-w-md rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Transcripción en vivo
        </p>
        <p className="mt-1 text-sm text-foreground">
          {recording
            ? 'Extraer la lógica a un hook mejora la reutilización y separa responsabilidades…'
            : '—'}
        </p>
      </div>
    </div>
  )
}
