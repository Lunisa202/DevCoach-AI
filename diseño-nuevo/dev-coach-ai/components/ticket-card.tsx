'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Ticket } from '@/lib/data'
import { PriorityBadge, DifficultyBadge, EstimateBadge } from '@/components/badges'
import {
  ChevronDown,
  GitCommitHorizontal,
  MessagesSquare,
  History,
  FileCode2,
  ExternalLink,
} from 'lucide-react'

const accent: Record<Ticket['status'], string> = {
  todo: 'hover:border-muted-foreground/30',
  review: 'hover:border-warning/50',
  done: 'hover:border-success/50',
}

export function TicketCard({
  ticket,
  onOpen,
  onStartInterview,
}: {
  ticket: Ticket
  onOpen: () => void
  onStartInterview: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
        accent[ticket.status],
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-pretty text-sm font-semibold leading-snug text-foreground">
            {ticket.title}
          </h4>
          <ChevronDown
            className={cn(
              'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>
        <p
          className={cn(
            'mt-1.5 text-xs leading-relaxed text-muted-foreground',
            !expanded && 'line-clamp-2',
          )}
        >
          {ticket.description}
        </p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <FileCode2 className="size-3" />
          <span className="truncate">{ticket.file}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={ticket.priority} />
          <DifficultyBadge difficulty={ticket.difficulty} />
          <EstimateBadge estimate={ticket.estimate} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 pt-3">
          {ticket.attempts.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History className="size-3.5" />
                Historial de intentos
              </p>
              <div className="space-y-1.5">
                {ticket.attempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">{a.date}</span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        a.score >= 8
                          ? 'text-success'
                          : a.score >= 6
                            ? 'text-warning-foreground dark:text-warning'
                            : 'text-destructive',
                      )}
                    >
                      {a.score.toFixed(1)}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {ticket.status !== 'done' && (
              <>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <GitCommitHorizontal className="size-4" />
                  Verificar commit
                </button>
                <button
                  type="button"
                  onClick={onStartInterview}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:brightness-110"
                >
                  <MessagesSquare className="size-4" />
                  Iniciar entrevista
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
            >
              Ver detalle completo
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
