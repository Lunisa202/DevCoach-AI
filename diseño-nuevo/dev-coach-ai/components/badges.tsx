import { cn } from '@/lib/utils'
import type { Priority, Difficulty } from '@/lib/data'
import { Flame, SignalHigh, SignalMedium, SignalLow, Clock } from 'lucide-react'

const priorityStyles: Record<Priority, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning',
  baja: 'bg-success/10 text-success border-success/20',
}

const difficultyIcon: Record<Difficulty, typeof SignalLow> = {
  fácil: SignalLow,
  intermedio: SignalMedium,
  avanzado: SignalHigh,
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        priorityStyles[priority],
      )}
    >
      {priority === 'alta' && <Flame className="size-3" />}
      {priority}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const Icon = difficultyIcon[difficulty]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
      <Icon className="size-3" />
      {difficulty}
    </span>
  )
}

export function EstimateBadge({ estimate }: { estimate: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Clock className="size-3" />
      {estimate}
    </span>
  )
}
