'use client'

import { cn } from '@/lib/utils'
import type { Ticket } from '@/lib/data'
import { PriorityBadge, DifficultyBadge, EstimateBadge } from '@/components/badges'
import {
  ArrowLeft,
  FileCode2,
  MessagesSquare,
  GitCommitHorizontal,
  CheckCircle2,
  History,
  Lightbulb,
} from 'lucide-react'

const statusMeta: Record<
  Ticket['status'],
  { label: string; className: string }
> = {
  todo: { label: 'Por hacer', className: 'bg-muted text-muted-foreground' },
  review: {
    label: 'En revisión',
    className: 'bg-warning/15 text-warning-foreground dark:text-warning',
  },
  done: { label: 'Completado', className: 'bg-success/10 text-success' },
}

export function TicketDetailView({
  ticket,
  onBack,
  onStartInterview,
}: {
  ticket: Ticket
  onBack: () => void
  onStartInterview: () => void
}) {
  const status = statusMeta[ticket.status]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al tablero
      </button>

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative border-b border-border p-6">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-gradient opacity-10 blur-3xl" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  status.className,
                )}
              >
                {status.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                #{ticket.id.toUpperCase()}
              </span>
            </div>
            <h2 className="text-pretty text-xl font-bold tracking-tight text-foreground">
              {ticket.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              <DifficultyBadge difficulty={ticket.difficulty} />
              <EstimateBadge estimate={ticket.estimate} />
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
              Descripción
            </h3>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {ticket.description}
            </p>
          </div>

          <div>
            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
              Archivo afectado
            </h3>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-sm text-foreground">
              <FileCode2 className="size-4 shrink-0 text-primary" />
              {ticket.file}
            </div>
          </div>

          {/* Action */}
          {ticket.status === 'done' ? (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2 className="size-5" />
              Este ticket ya fue completado con éxito.
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <GitCommitHorizontal className="size-4" />
                Verificar commit
              </button>
              <button
                type="button"
                onClick={onStartInterview}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110"
              >
                <MessagesSquare className="size-4" />
                Iniciar entrevista
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="size-4" />
          Historial de intentos
        </h3>

        {ticket.attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <History className="size-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Aún no has intentado este ticket. ¡Inicia una entrevista para
              empezar!
            </p>
          </div>
        ) : (
          <ol className="relative space-y-4 pl-6">
            <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {ticket.attempts.map((a) => (
              <li key={a.id} className="relative">
                <span
                  className={cn(
                    'absolute -left-6 top-1.5 size-3.5 rounded-full border-2 border-background',
                    a.score >= 8
                      ? 'bg-success'
                      : a.score >= 6
                        ? 'bg-warning'
                        : 'bg-destructive',
                  )}
                />
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {a.date}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                        a.score >= 8
                          ? 'bg-success/10 text-success'
                          : a.score >= 6
                            ? 'bg-warning/15 text-warning-foreground dark:text-warning'
                            : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {a.score.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {a.feedback}
                  </p>
                  {a.concepts.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Lightbulb className="size-3.5 text-warning" />
                        Conceptos a mejorar
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.concepts.map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
