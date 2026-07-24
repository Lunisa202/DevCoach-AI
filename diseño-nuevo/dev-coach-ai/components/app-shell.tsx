'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { HomeView } from '@/components/views/home-view'
import { KanbanView } from '@/components/views/kanban-view'
import { RepoInputView } from '@/components/views/repo-input-view'
import { FileSelectorView } from '@/components/views/file-selector-view'
import { SettingsView } from '@/components/views/settings-view'
import { TicketDetailView } from '@/components/views/ticket-detail-view'
import { InterviewView } from '@/components/views/interview-view'
import { tickets, type Ticket } from '@/lib/data'
import { X } from 'lucide-react'

export type View =
  | 'home'
  | 'kanban'
  | 'repo'
  | 'files'
  | 'settings'
  | 'ticket'
  | 'interview'

export function AppShell() {
  const [view, setView] = useState<View>('home')
  const [activeProjectId, setActiveProjectId] = useState<string | null>('p1')
  const [selectedTicket, setSelectedTicket] = useState<Ticket>(tickets[0])
  const [drawerOpen, setDrawerOpen] = useState(false)

  function navigate(next: View) {
    setView(next)
    setDrawerOpen(false)
  }

  function selectProject(id: string) {
    setActiveProjectId(id)
    navigate('kanban')
  }

  function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    navigate('ticket')
  }

  function startInterview(ticket: Ticket) {
    setSelectedTicket(ticket)
    navigate('interview')
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 border-r border-sidebar-border lg:block">
        <Sidebar
          view={view}
          onNavigate={navigate}
          activeProjectId={activeProjectId}
          onSelectProject={selectProject}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-[280px] border-r border-sidebar-border shadow-2xl',
              'animate-in slide-in-from-left duration-300',
            )}
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-6 z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            >
              <X className="size-4" />
            </button>
            <Sidebar
              view={view}
              onNavigate={navigate}
              activeProjectId={activeProjectId}
              onSelectProject={selectProject}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header view={view} onOpenMenu={() => setDrawerOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {view === 'home' && (
            <HomeView onNavigate={navigate} onSelectProject={selectProject} />
          )}
          {view === 'kanban' && (
            <KanbanView
              projectId={activeProjectId}
              onOpenTicket={openTicket}
              onStartInterview={startInterview}
            />
          )}
          {view === 'repo' && <RepoInputView onNavigate={navigate} />}
          {view === 'files' && <FileSelectorView onNavigate={navigate} />}
          {view === 'settings' && <SettingsView />}
          {view === 'ticket' && (
            <TicketDetailView
              ticket={selectedTicket}
              onBack={() => navigate('kanban')}
              onStartInterview={() => startInterview(selectedTicket)}
            />
          )}
          {view === 'interview' && (
            <InterviewView
              ticket={selectedTicket}
              onBack={() => navigate('kanban')}
            />
          )}
        </main>
      </div>
    </div>
  )
}
