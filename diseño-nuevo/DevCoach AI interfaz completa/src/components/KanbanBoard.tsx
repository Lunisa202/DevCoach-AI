import { useState } from "react";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  GitCommit,
  MessageSquare,
  Trophy,
} from "lucide-react";
import type { Ticket, TicketStatus, Priority, Project } from "../data/mock";

type Page = "home" | "repo-input" | "file-selector" | "kanban" | "ticket-detail" | "interview" | "settings";

interface KanbanBoardProps {
  dark: boolean;
  project: Project;
  onNavigate: (page: Page, id?: string) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string }> = {
  alta: { label: "Alta", bg: "bg-red-500/15", text: "text-red-500" },
  media: { label: "Media", bg: "bg-amber-500/15", text: "text-amber-500" },
  baja: { label: "Baja", bg: "bg-emerald-500/15", text: "text-emerald-500" },
};

const DIFFICULTY_CONFIG: Record<string, { bg: string; text: string }> = {
  "fácil": { bg: "bg-teal-500/15", text: "text-teal-500" },
  "media": { bg: "bg-blue-500/15", text: "text-blue-500" },
  "difícil": { bg: "bg-violet-500/15", text: "text-violet-500" },
};

const COLUMNS: { id: TicketStatus; label: string; color: string; emptyMsg: string; emptyIcon: string }[] = [
  {
    id: "todo",
    label: "Por hacer",
    color: "bg-slate-400",
    emptyMsg: "No hay tickets pendientes. ¡Buen trabajo!",
    emptyIcon: "✨",
  },
  {
    id: "inreview",
    label: "En revisión",
    color: "bg-amber-400",
    emptyMsg: "Ningún ticket en revisión. Mueve uno cuando hagas un commit.",
    emptyIcon: "🔍",
  },
  {
    id: "done",
    label: "Completado",
    color: "bg-emerald-500",
    emptyMsg: "Completa una entrevista técnica para mover tickets aquí.",
    emptyIcon: "🏆",
  },
];

function TicketCard({
  ticket,
  dark,
  onNavigate,
}: {
  ticket: Ticket;
  dark: boolean;
  onNavigate: (page: Page, id?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const bg = dark ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700/60" : "border-slate-100";
  const btnGhost = dark
    ? "bg-slate-700/60 hover:bg-slate-700 text-slate-300"
    : "bg-slate-100 hover:bg-slate-200 text-slate-700";

  const pri = PRIORITY_CONFIG[ticket.priority];
  const diff = DIFFICULTY_CONFIG[ticket.difficulty] ?? DIFFICULTY_CONFIG["media"];
  const lastAttempt = ticket.attempts[ticket.attempts.length - 1];

  return (
    <div
      className={`${bg} border rounded-2xl shadow-sm card-hover overflow-hidden transition-all duration-200`}
    >
      {/* Card body */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pri.bg} ${pri.text}`}>
            {pri.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}>
            {ticket.difficulty}
          </span>
          {ticket.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h4 className={`text-sm font-semibold ${textPrimary} leading-snug mb-2 line-clamp-2 text-left`}>
          {ticket.title}
        </h4>

        {/* Description (truncated) */}
        {!expanded && (
          <p className={`text-xs ${textMuted} leading-relaxed line-clamp-2 text-left`}>
            {ticket.description}
          </p>
        )}

        {/* Meta row */}
        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${divider}`}>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 text-xs ${textMuted}`}>
              <Clock size={12} />
              {ticket.estimatedTime}
            </span>
            {lastAttempt && (
              <span className={`flex items-center gap-1 text-xs ${textMuted}`}>
                <Trophy size={12} />
                {lastAttempt.score}%
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{expanded ? "Cerrar" : "Ver más"}</span>
          </div>
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className={`border-t ${divider} px-4 py-4 slide-in`}>
          {/* Full description */}
          <p className={`text-xs ${textMuted} leading-relaxed mb-4`}>{ticket.description}</p>

          {/* Attempt history */}
          {ticket.attempts.length > 0 && (
            <div className="mb-4">
              <p className={`text-xs font-semibold ${textMuted} uppercase tracking-wider mb-2`}>
                Historial de intentos
              </p>
              {ticket.attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className={`flex items-start gap-2.5 py-2 border-b last:border-0 ${divider}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      attempt.score >= 80
                        ? "bg-emerald-500/15 text-emerald-500"
                        : attempt.score >= 60
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-red-500/15 text-red-500"
                    }`}
                  >
                    {attempt.score}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${textPrimary}`}>{attempt.feedback}</p>
                    <p className={`text-xs ${textMuted} mt-0.5`}>{attempt.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {ticket.status !== "done" && (
              <>
                {ticket.status === "inreview" && (
                  <button
                    onClick={() => onNavigate("ticket-detail", ticket.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${btnGhost}`}
                  >
                    <GitCommit size={13} />
                    Verificar commit
                  </button>
                )}
                <button
                  onClick={() => onNavigate("interview", ticket.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white btn-primary"
                >
                  <MessageSquare size={13} />
                  Iniciar entrevista
                </button>
              </>
            )}
            {ticket.status === "done" && (
              <button
                onClick={() => onNavigate("ticket-detail", ticket.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${btnGhost}`}
              >
                <CheckCircle size={13} className="text-emerald-500" />
                Ver detalle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  id,
  label,
  color,
  tickets,
  emptyMsg,
  emptyIcon,
  dark,
  onNavigate,
}: {
  id: TicketStatus;
  label: string;
  color: string;
  tickets: Ticket[];
  emptyMsg: string;
  emptyIcon: string;
  dark: boolean;
  onNavigate: (page: Page, id?: string) => void;
}) {
  const colBg = dark ? "bg-slate-800/40" : "bg-slate-100/60";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const countBg =
    id === "todo"
      ? "bg-slate-500/20 text-slate-400"
      : id === "inreview"
        ? "bg-amber-500/20 text-amber-500"
        : "bg-emerald-500/20 text-emerald-500";

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden ${colBg} min-h-[480px]`}>
      {/* Column header */}
      <div className={`px-4 pt-0 pb-3`}>
        <div className={`h-1 rounded-b-full mb-4 ${color}`} />
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${textPrimary}`}>{label}</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countBg}`}>
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <span className="text-3xl mb-3">{emptyIcon}</span>
            <p className={`text-xs ${textMuted} leading-relaxed`}>{emptyMsg}</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} dark={dark} onNavigate={onNavigate} />
          ))
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ dark, project, onNavigate }: KanbanBoardProps) {
  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const headerBg = dark ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200";

  const done = project.tickets.filter((t) => t.status === "done").length;
  const total = project.tickets.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className={`min-h-full ${bg} p-6 lg:p-8 fade-in`}>
      {/* Project header */}
      <div className={`${headerBg} border rounded-2xl p-5 mb-6 shadow-sm`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                github.com
              </span>
            </div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>{project.repoName}</h2>
            <p className={`text-xs ${textMuted} mt-1`}>{project.repoUrl}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold ${pct === 100 ? "text-emerald-500" : textPrimary}`}>{pct}%</p>
            <p className={`text-xs ${textMuted}`}>{done}/{total} completados</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`mt-4 h-2 rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-200"}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            {...col}
            tickets={project.tickets.filter((t) => t.status === col.id)}
            dark={dark}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
