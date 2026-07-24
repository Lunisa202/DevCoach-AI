'use client'

import { cn } from '@/lib/utils'
import { columns, projects, tickets, type ColumnId, type Ticket } from '@/lib/data'
import { TicketCard } from '@/components/ticket-card'
import { Inbox, Coffee, PartyPopper, GitBranch } from 'lucide-react'

const columnStyles: Record<
  ColumnId,
  { bar: string; count: string; empty: typeof Inbox; emptyText: string }
> = {
  todo: {
    bar: 'bg-muted-foreground/40',
    count: 'bg-muted text-muted-foreground',
    empty: Coffee,
    emptyText: 'Nada por hacer. ¡Disfruta el momento!',
  },
  review: {
    bar: 'bg-warning',
    count: 'bg-warning/15 text-warning-foreground dark:text-warning',
    empty: Inbox,
    emptyText: 'Sin tickets en revisión todavía.',
  },
  done: {
    bar: 'bg-success',
    count: 'bg-success/10 text-success',
    empty: PartyPopper,
    emptyText: 'Completa tu primer ticket para verlo aquí.',
  },
}

export function KanbanView({
  projectId,
  onOpenTicket,
  onStartInterview,
}: {
  projectId: string | null
  onOpenTicket: (ticket: Ticket) => void
  onStartInterview: (ticket: Ticket) => void
}) {
  const project = projects.find((p) => p.id === projectId) ?? projects[0]

  return (
    <div className="flex h-full flex-col">
      {/* Project bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 md:px-8">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md shadow-primary/20">
          <GitBranch className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{project.name}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {project.repo}
          </p>
        </div>
        <span className="ml-auto rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          {project.completed}/{project.total} completados
        </span>
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="grid h-full min-w-[720px] grid-cols-3 gap-4 p-4 md:min-w-0 md:gap-6 md:p-8">
          {columns.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.id)
            const style = columnStyles[col.id]
            const Empty = style.empty
            return (
              <section key={col.id} className="flex min-h-0 flex-col">
                <div className="overflow-hidden rounded-t-xl">
                  <div className={cn('h-1 w-full', style.bar)} />
                </div>
                <div className="flex items-center justify-between px-1 py-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {col.label}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                      style.count,
                    )}
                  >
                    {colTickets.length}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4 pr-1">
                  {colTickets.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <Empty className="size-6 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-pretty text-xs text-muted-foreground">
                        {style.emptyText}
                      </p>
                    </div>
                  ) : (
                    colTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onOpen={() => onOpenTicket(ticket)}
                        onStartInterview={() => onStartInterview(ticket)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
