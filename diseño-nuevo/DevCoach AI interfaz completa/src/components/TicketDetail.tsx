import {
  Clock,
  Tag,
  Trophy,
  CheckCircle,
  MessageSquare,
  GitCommit,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { Priority } from "../data/mock";
import { mockProjects } from "../data/mock";

type Page = "home" | "repo-input" | "file-selector" | "kanban" | "ticket-detail" | "interview" | "settings";

interface TicketDetailProps {
  dark: boolean;
  ticketId: string | null;
  onNavigate: (page: Page, id?: string) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  alta: { label: "Alta prioridad", bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30" },
  media: { label: "Prioridad media", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
  baja: { label: "Baja prioridad", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  todo: { label: "Por hacer", color: "text-slate-400" },
  inreview: { label: "En revisión", color: "text-amber-500" },
  done: { label: "Completado", color: "text-emerald-500" },
};

export default function TicketDetail({ dark, ticketId, onNavigate }: TicketDetailProps) {
  const allTickets = mockProjects.flatMap((p) => p.tickets);
  const ticket = allTickets.find((t) => t.id === ticketId) ?? allTickets[0];
  const project = mockProjects.find((p) => p.tickets.some((t) => t.id === ticket?.id));

  if (!ticket) return null;

  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const cardBg = dark ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textSecondary = dark ? "text-slate-300" : "text-slate-600";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700/60" : "border-slate-100";
  const tagBg = dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600";

  const pri = PRIORITY_CONFIG[ticket.priority];
  const statusInfo = STATUS_LABELS[ticket.status];

  return (
    <div className={`min-h-full ${bg} p-6 lg:p-8 fade-in`}>
      <div className="max-w-2xl mx-auto">
        {/* Back nav */}
        <button
          onClick={() => onNavigate("kanban", project?.id)}
          className={`flex items-center gap-1.5 text-sm ${textMuted} hover:${dark ? "text-slate-200" : "text-slate-700"} mb-6 transition-colors`}
        >
          <ArrowLeft size={16} />
          Volver al tablero
        </button>

        {/* Ticket card */}
        <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden mb-4`}>
          {/* Status bar */}
          <div className={`px-6 py-3 border-b ${divider} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${textMuted}`}>{ticket.id.toUpperCase()}</span>
              <ChevronRight size={12} className={textMuted} />
              <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            {ticket.status === "done" && (
              <CheckCircle size={16} className="text-emerald-500" />
            )}
          </div>

          <div className="p-6">
            {/* Priority badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mb-4 ${pri.bg} ${pri.text} ${pri.border}`}>
              <AlertCircle size={12} />
              {pri.label}
            </div>

            {/* Title */}
            <h2 className={`text-xl font-bold ${textPrimary} leading-snug mb-3`}>{ticket.title}</h2>

            {/* Description */}
            <p className={`text-sm ${textSecondary} leading-relaxed mb-5`}>{ticket.description}</p>

            {/* Meta grid */}
            <div className={`grid grid-cols-3 gap-4 py-4 border-y ${divider} mb-5`}>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 text-xs ${textMuted} mb-1`}>
                  <Zap size={12} />
                  Dificultad
                </div>
                <p className={`text-sm font-semibold ${textPrimary} capitalize`}>{ticket.difficulty}</p>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 text-xs ${textMuted} mb-1`}>
                  <Clock size={12} />
                  Estimado
                </div>
                <p className={`text-sm font-semibold ${textPrimary}`}>{ticket.estimatedTime}</p>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 text-xs ${textMuted} mb-1`}>
                  <Trophy size={12} />
                  Intentos
                </div>
                <p className={`text-sm font-semibold ${textPrimary}`}>{ticket.attempts.length}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {ticket.tags.map((tag) => (
                <span key={tag} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono ${tagBg}`}>
                  <Tag size={11} />
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            {ticket.status !== "done" && (
              <div className="flex gap-3">
                {ticket.status === "inreview" && (
                  <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${dark ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}
                  `}>
                    <GitCommit size={15} />
                    Verificar commit
                  </button>
                )}
                <button
                  onClick={() => onNavigate("interview", ticket.id)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                >
                  <MessageSquare size={15} />
                  Iniciar entrevista
                </button>
              </div>
            )}
            {ticket.status === "done" && (
              <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Ticket completado exitosamente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attempts timeline */}
        {ticket.attempts.length > 0 && (
          <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${divider}`}>
              <h3 className={`font-semibold ${textPrimary}`}>Historial de entrevistas</h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>{ticket.attempts.length} intento{ticket.attempts.length !== 1 ? "s" : ""} realizados</p>
            </div>

            <div className="px-6 py-4">
              <div className="relative">
                {/* Timeline line */}
                <div className={`absolute left-4 top-0 bottom-0 w-px ${dark ? "bg-slate-700" : "bg-slate-200"}`} />

                <div className="space-y-6">
                  {ticket.attempts.map((attempt) => {
                    const scoreColor =
                      attempt.score >= 80
                        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
                        : attempt.score >= 60
                          ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                          : "text-red-500 bg-red-500/10 border-red-500/30";

                    return (
                      <div key={attempt.id} className="relative flex gap-4 pl-10">
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${attempt.score >= 80 ? "bg-emerald-500 border-emerald-500" : attempt.score >= 60 ? "bg-amber-500 border-amber-500" : "bg-red-400 border-red-400"} shadow-sm`} style={{ top: 6 }} />

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm font-bold ${scoreColor}`}>
                              <Trophy size={13} />
                              {attempt.score}%
                            </div>
                            <span className={`flex items-center gap-1 text-xs ${textMuted}`}>
                              <Calendar size={12} />
                              {attempt.date}
                            </span>
                          </div>

                          <p className={`text-sm ${textSecondary} mb-2 leading-relaxed`}>{attempt.feedback}</p>

                          {attempt.concepts.length > 0 && (
                            <div>
                              <p className={`text-xs font-medium ${textMuted} mb-1.5`}>Conceptos evaluados:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {attempt.concepts.map((c) => (
                                  <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-mono ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
