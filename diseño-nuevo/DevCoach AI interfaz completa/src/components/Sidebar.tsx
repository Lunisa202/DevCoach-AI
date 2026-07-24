import {
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  Zap,
  Code2,
} from "lucide-react";
import { currentUser, mockProjects } from "../data/mock";

type Page =
  | "home"
  | "repo-input"
  | "file-selector"
  | "kanban"
  | "ticket-detail"
  | "interview"
  | "settings";

interface SidebarProps {
  dark: boolean;
  currentPage: Page;
  activeProjectId: string | null;
  onNavigate: (page: Page, projectId?: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  dark,
  currentPage,
  activeProjectId,
  onNavigate,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const base = dark
    ? "bg-[#0d1526] border-slate-800"
    : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textSecondary = dark ? "text-slate-400" : "text-slate-500";
  const hoverBg = dark ? "hover:bg-slate-800/60" : "hover:bg-slate-100";
  const activeBg = dark ? "bg-indigo-600/20 text-indigo-400" : "bg-indigo-50 text-indigo-700";
  const activeItemBg = dark ? "bg-slate-800" : "bg-slate-100";
  const divider = dark ? "border-slate-800" : "border-slate-100";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-70 border-r flex flex-col transition-transform duration-300 ease-in-out
          ${base}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: 280 }}
      >
        {/* Logo / Brand — matches header height */}
        <div className={`flex items-center gap-3 px-5 h-[72px] border-b ${divider} shrink-0`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className={`font-semibold text-sm ${textPrimary}`}>DevCoach</span>
            <span className="text-xs font-medium text-indigo-400 ml-1">AI</span>
          </div>
        </div>

        {/* User info */}
        <div className={`px-4 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-md shadow-indigo-500/20">
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${textPrimary}`}>{currentUser.name}</p>
              <p className={`text-xs truncate ${textSecondary}`}>{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* New Analysis CTA */}
        <div className="px-4 py-3">
          <button
            onClick={() => onNavigate("repo-input")}
            className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white"
          >
            <Plus size={16} />
            Nuevo análisis
          </button>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className={`px-2 mb-2 text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
            Proyectos
          </p>
          <div className="space-y-0.5">
            {mockProjects.map((project) => {
              const isActive = activeProjectId === project.id;
              const completedCount = project.tickets.filter((t) => t.status === "done").length;
              return (
                <button
                  key={project.id}
                  onClick={() => onNavigate("kanban", project.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left group transition-all duration-150
                    ${isActive ? activeItemBg : hoverBg}
                  `}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                      ${isActive ? "bg-indigo-600/20" : dark ? "bg-slate-700/60" : "bg-slate-100"}
                    `}
                  >
                    <Code2 size={14} className={isActive ? "text-indigo-400" : textSecondary} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isActive ? (dark ? "text-indigo-300" : "text-indigo-700") : textPrimary}`}>
                      {project.repoName}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      {completedCount}/{project.tickets.length} completados
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer nav */}
        <div className={`border-t ${divider} px-3 py-3 space-y-0.5`}>
          <button
            onClick={() => onNavigate("home")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
              ${currentPage === "home" ? activeBg : `${textSecondary} ${hoverBg}`}
            `}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onNavigate("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
              ${currentPage === "settings" ? activeBg : `${textSecondary} ${hoverBg}`}
            `}
          >
            <Settings size={16} />
            <span>Configuración</span>
          </button>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${textSecondary} ${hoverBg}`}
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
