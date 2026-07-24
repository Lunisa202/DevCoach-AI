'use client'

import { cn } from '@/lib/utils'
import { projects, user } from '@/lib/data'
import type { View } from '@/components/app-shell'
import {
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  GitBranch,
  Sparkles,
} from 'lucide-react'

type SidebarProps = {
  view: View
  onNavigate: (view: View) => void
  activeProjectId: string | null
  onSelectProject: (id: string) => void
}

export function Sidebar({
  view,
  onNavigate,
  activeProjectId,
  onSelectProject,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand — matches 72px header height */}
      <div className="flex h-[72px] shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient shadow-lg shadow-primary/25">
          <Sparkles className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">
            DevCoach AI
          </p>
          <p className="text-xs text-muted-foreground">Coaching de código</p>
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
          {user.initials}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* New analysis CTA */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={() => onNavigate('repo')}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
        >
          <Plus className="size-4 transition-transform group-hover:rotate-90" />
          Nuevo análisis
        </button>
      </div>

      {/* Projects */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col px-2">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Proyectos
        </p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto pb-2">
          {projects.map((project) => {
            const active = activeProjectId === project.id && view === 'kanban'
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
              >
                <GitBranch
                  className={cn(
                    'size-4 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {project.completed}/{project.total}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer nav */}
      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        <FooterItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={view === 'home'}
          onClick={() => onNavigate('home')}
        />
        <FooterItem
          icon={Settings}
          label="Configuración"
          active={view === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <FooterItem icon={LogOut} label="Cerrar sesión" onClick={() => {}} />
      </div>
    </div>
  )
}

function FooterItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Settings
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}
