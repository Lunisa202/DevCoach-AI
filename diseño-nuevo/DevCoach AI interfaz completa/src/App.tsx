import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import RepoInput from "./components/RepoInput";
import FileSelector from "./components/FileSelector";
import KanbanBoard from "./components/KanbanBoard";
import TicketDetail from "./components/TicketDetail";
import Interview from "./components/Interview";
import Settings from "./components/Settings";
import { mockProjects } from "./data/mock";

type Page =
  | "home"
  | "repo-input"
  | "file-selector"
  | "kanban"
  | "ticket-detail"
  | "interview"
  | "settings";

const PAGE_TITLES: Record<Page, { title: string; subtitle?: string }> = {
  home: { title: "Dashboard", subtitle: "Tu progreso de aprendizaje" },
  "repo-input": { title: "Nuevo análisis", subtitle: "Analiza un repositorio de GitHub" },
  "file-selector": { title: "Seleccionar archivos", subtitle: "Elige los archivos a analizar" },
  kanban: { title: "Tablero de tickets", subtitle: "Gestiona tu plan de mejora" },
  "ticket-detail": { title: "Detalle del ticket", subtitle: "Información completa y historial" },
  interview: { title: "Entrevista técnica", subtitle: "Evaluación con Tech Lead virtual" },
  settings: { title: "Configuración", subtitle: "Administra tu cuenta" },
};

export default function App() {
  const [dark, setDark] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigate = (targetPage: Page, id?: string) => {
    if (targetPage === "kanban" || targetPage === "ticket-detail") {
      if (id) {
        if (targetPage === "kanban") {
          setActiveProjectId(id);
        } else {
          setActiveTicketId(id);
          const project = mockProjects.find((p) => p.tickets.some((t) => t.id === id));
          if (project) setActiveProjectId(project.id);
        }
      }
    } else if (targetPage === "interview") {
      if (id) setActiveTicketId(id);
    }
    setPage(targetPage);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0 });
  };

  const activeProject = mockProjects.find((p) => p.id === activeProjectId) ?? mockProjects[0];
  const pageInfo = PAGE_TITLES[page];

  const kanbanTitle =
    page === "kanban" && activeProject
      ? { title: activeProject.repoName, subtitle: activeProject.repoUrl }
      : pageInfo;

  return (
    <div className={dark ? "dark" : ""}>
      <div style={{ backgroundColor: dark ? "#0f172a" : "#f8fafc", minHeight: "100vh", color: dark ? "#f1f5f9" : "#0f172a" }}>
        <Sidebar
          dark={dark}
          currentPage={page}
          activeProjectId={activeProjectId}
          onNavigate={navigate}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main layout — offset by sidebar on desktop */}
        <div className="lg:ml-[280px] flex flex-col min-h-screen">
          <Header
            dark={dark}
            onToggleDark={() => setDark((d) => !d)}
            onMenuOpen={() => setMobileSidebarOpen(true)}
            title={page === "kanban" ? kanbanTitle.title : pageInfo.title}
            subtitle={page === "kanban" ? kanbanTitle.subtitle : pageInfo.subtitle}
          />

          {/* Content — scrollable, below header */}
          <main className="flex-1 pt-[72px]">
            {page === "home" && (
              <HomePage dark={dark} onNavigate={navigate} />
            )}
            {page === "repo-input" && (
              <RepoInput dark={dark} onNavigate={navigate} />
            )}
            {page === "file-selector" && (
              <FileSelector dark={dark} onNavigate={navigate} />
            )}
            {page === "kanban" && (
              <KanbanBoard dark={dark} project={activeProject} onNavigate={navigate} />
            )}
            {page === "ticket-detail" && (
              <TicketDetail dark={dark} ticketId={activeTicketId} onNavigate={navigate} />
            )}
            {page === "interview" && (
              <Interview dark={dark} ticketId={activeTicketId} onNavigate={navigate} />
            )}
            {page === "settings" && (
              <Settings dark={dark} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
