'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import type { View } from '@/components/app-shell'
import { Menu, Bell, Search } from 'lucide-react'

const titles: Record<View, { title: string; subtitle: string }> = {
  home: { title: 'Dashboard', subtitle: 'Resumen de tu actividad y progreso' },
  kanban: { title: 'Tablero', subtitle: 'Gestiona los tickets de mejora del proyecto' },
  repo: { title: 'Nuevo análisis', subtitle: 'Conecta un repositorio de GitHub' },
  files: { title: 'Seleccionar archivos', subtitle: 'Elige qué código analizará la IA' },
  settings: { title: 'Configuración', subtitle: 'Administra tu cuenta y preferencias' },
  ticket: { title: 'Detalle del ticket', subtitle: 'Información y progreso del ticket' },
  interview: { title: 'Entrevista técnica', subtitle: 'Demuestra tu dominio ante el Tech Lead virtual' },
}

export function Header({
  view,
  onOpenMenu,
}: {
  view: View
  onOpenMenu: () => void
}) {
  const { title, subtitle } = titles[view]

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={onOpenMenu}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {title}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Buscar"
          className="hidden size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:inline-flex"
        >
          <Search className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative hidden size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:inline-flex"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
