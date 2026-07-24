'use client'

import { cn } from '@/lib/utils'
import { projects, tickets, user } from '@/lib/data'
import type { View as ViewType } from '@/components/app-shell'
import {
  FolderGit2,
  ListTodo,
  CheckCircle2,
  Star,
  Plus,
  ArrowUpRight,
  GitBranch,
} from 'lucide-react'

const stats = [
  {
    label: 'Proyectos',
    value: projects.length.toString(),
    icon: FolderGit2,
    tint: 'text-primary bg-primary/10',
  },
  {
    label: 'Tickets pendientes',
    value: tickets.filter((t) => t.status !== 'done').length.toString(),
    icon: ListTodo,
    tint: 'text-warning-foreground dark:text-warning bg-warning/15',
  },
  {
    label: 'Completados',
    value: tickets.filter((t) => t.status === 'done').length.toString(),
    icon: CheckCircle2,
    tint: 'text-success bg-success/10',
  },
  {
    label: 'Calificación media',
    value: '7.8',
    icon: Star,
    tint: 'text-chart-5 bg-chart-5/10',
  },
]

export function HomeView({
  onNavigate,
  onSelectProject,
}: {
  onNavigate: (view: ViewType) => void
  onSelectProject: (id: string) => void
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Bienvenida de vuelta</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Hola, {user.name.split(' ')[0]}
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground">
              Tienes {tickets.filter((t) => t.status !== 'done').length} tickets
              esperando. Analiza un repositorio nuevo o continúa donde lo dejaste.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('repo')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:brightness-110"
          >
            <Plus className="size-4" />
            Nuevo análisis
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-xl',
                stat.tint,
              )}
            >
              <stat.icon className="size-5" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Proyectos recientes
          </h3>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {projects.map((project, i) => {
            const pct = Math.round((project.completed / project.total) * 100)
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  'group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40',
                  i !== projects.length - 1 && 'border-b border-border',
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                  <GitBranch className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium text-foreground">
                    {project.name}
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                      {project.language}
                    </span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {project.repo} · {project.date}
                  </p>
                </div>
                <div className="hidden w-40 shrink-0 sm:block">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span className="tabular-nums">
                      {project.completed}/{project.total}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        pct === 100 ? 'bg-success' : 'bg-brand-gradient',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
