import { Plus, GitBranch, CheckCircle, Clock, Star, ArrowRight, Code2 } from "lucide-react";
import { currentUser, mockProjects } from "../data/mock";

type Page = "home" | "repo-input" | "file-selector" | "kanban" | "ticket-detail" | "interview" | "settings";

interface HomePageProps {
  dark: boolean;
  onNavigate: (page: Page, projectId?: string) => void;
}

function StatCard({
  dark,
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  dark: boolean;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
}) {
  const bg = dark ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  return (
    <div className={`${bg} border rounded-2xl p-5 card-hover shadow-sm relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 ${gradient}`} />
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${textPrimary} mb-0.5`}>{value}</p>
      <p className={`text-sm font-medium ${textPrimary}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${textMuted}`}>{sub}</p>}
    </div>
  );
}

export default function HomePage({ dark, onNavigate }: HomePageProps) {
  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const cardBg = dark ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textSecondary = dark ? "text-slate-300" : "text-slate-600";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const hoverRow = dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50";
  const divider = dark ? "border-slate-700/50" : "border-slate-100";

  const totalProjects = mockProjects.length;
  const allTickets = mockProjects.flatMap((p) => p.tickets);
  const completedTickets = allTickets.filter((t) => t.status === "done").length;
  const pendingTickets = allTickets.filter((t) => t.status !== "done").length;
  const allScores = allTickets.flatMap((t) => t.attempts.map((a) => a.score));
  const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className={`min-h-full ${bg} p-6 lg:p-8 fade-in`}>
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-sm ${textMuted} mb-1`}>{greeting},</p>
            <h2 className={`text-3xl font-bold ${textPrimary} leading-tight`}>
              {currentUser.name.split(" ")[0]}{" "}
              <span className="gradient-text">👋</span>
            </h2>
            <p className={`mt-2 text-sm ${textSecondary}`}>
              Tienes{" "}
              <span className={`font-semibold ${pendingTickets > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {pendingTickets} tickets pendientes
              </span>{" "}
              en {totalProjects} proyectos activos.
            </p>
          </div>
          <button
            onClick={() => onNavigate("repo-input")}
            className="btn-primary hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shrink-0"
          >
            <Plus size={16} />
            Nuevo análisis
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          dark={dark}
          icon={<GitBranch size={20} />}
          label="Proyectos"
          value={totalProjects}
          sub="repos analizados"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <StatCard
          dark={dark}
          icon={<Clock size={20} />}
          label="Por completar"
          value={pendingTickets}
          sub="tickets pendientes"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          dark={dark}
          icon={<CheckCircle size={20} />}
          label="Completados"
          value={completedTickets}
          sub="tickets finalizados"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
        <StatCard
          dark={dark}
          icon={<Star size={20} />}
          label="Promedio"
          value={`${avgScore}%`}
          sub="calificación entrevistas"
          gradient="bg-gradient-to-br from-rose-500 to-pink-500"
        />
      </div>

      {/* Recent projects */}
      <div className={`${cardBg} border rounded-2xl overflow-hidden shadow-sm`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Proyectos recientes</h3>
            <p className={`text-xs ${textMuted} mt-0.5`}>{totalProjects} repositorios analizados</p>
          </div>
          <button
            onClick={() => onNavigate("repo-input")}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            Nuevo análisis <ArrowRight size={12} />
          </button>
        </div>

        <div className="divide-y divide-[var(--border-default)]">
          {mockProjects.map((project) => {
            const done = project.tickets.filter((t) => t.status === "done").length;
            const total = project.tickets.length;
            const pct = Math.round((done / total) * 100);
            return (
              <button
                key={project.id}
                onClick={() => onNavigate("kanban", project.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${hoverRow}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
                  <Code2 size={18} className="text-indigo-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${textPrimary} truncate`}>{project.repoName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                      {project.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 max-w-32 h-1.5 rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-200"}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs ${textMuted}`}>{done}/{total} tickets</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className={`text-xs ${textMuted}`}>{project.date}</p>
                    <p className={`text-xs font-medium ${pct === 100 ? "text-emerald-500" : pct > 50 ? "text-amber-500" : "text-slate-400"}`}>
                      {pct === 100 ? "Completado" : pct > 0 ? "En progreso" : "Sin iniciar"}
                    </p>
                  </div>
                  <ArrowRight size={16} className={textMuted} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile CTA */}
      <button
        onClick={() => onNavigate("repo-input")}
        className="btn-primary sm:hidden w-full mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white"
      >
        <Plus size={16} />
        Analizar nuevo repositorio
      </button>
    </div>
  );
}
