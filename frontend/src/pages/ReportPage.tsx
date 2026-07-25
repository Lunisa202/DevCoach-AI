import { CheckCircle, FileText, Star, TrendingUp, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { SkillRadar } from '../components/SkillRadar'
import { UserAvatar } from '../components/UserAvatar'
import axiosClient from '../services/axiosClient'
import type { RootState } from '../store'

interface ReportData {
  display_name: string
  avatar_url: string | null
  level: number
  xp: number
  current_streak: number
  member_since: string
  stats: {
    projects_analyzed: number
    total_interviews: number
    approved_interviews: number
    approval_rate: number
    avg_score: number | null
    tickets_completed: number
    tickets_total: number
  }
  skills: Array<{ dimension: string; score: number; max_score: number; count: number }>
  strengths: Array<{ dimension: string; score: number }>
  weaknesses: Array<{ dimension: string; score: number }>
  best_skill: { dimension: string; score: number } | null
  achievements: Array<{ id: string; title: string; icon: string }>
  projects: Array<{ repo_url: string; date: string }>
}

export function ReportPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    axiosClient.get('/api/report')
      .then(res => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto p-8 max-w-3xl">
        <div className="bg-white dark:bg-slate-800 rounded-2xl h-[600px] animate-pulse" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto p-8 max-w-3xl text-center py-16">
        <FileText className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">No se pudo generar el reporte. Completa al menos una entrevista.</p>
      </div>
    )
  }

  const r = report
  const today = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto p-6 lg:p-8 max-w-3xl fade-in">
      {/* Report document */}
      <div className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-8 py-8 text-white">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-medium mb-4">
            <FileText className="size-4" />
            DEVELOPER REPORT
          </div>
          <div className="flex items-center gap-4">
            <UserAvatar name={r.display_name} imageUrl={r.avatar_url} size="lg" className="ring-2 ring-white/30 size-16 text-xl" />
            <div>
              <h1 className="text-2xl font-bold">{r.display_name}</h1>
              <p className="text-indigo-200 text-sm">Nivel {r.level} · {r.xp} XP</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-indigo-200">Generado el {today}</p>
        </div>

        {/* Stats summary */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Resumen de desempeño</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStat label="Entrevistas" value={r.stats.total_interviews} />
            <MiniStat label="Aprobadas" value={r.stats.approved_interviews} />
            <MiniStat label="Tasa de éxito" value={`${r.stats.approval_rate}%`} />
            <MiniStat label="Promedio" value={r.stats.avg_score !== null ? `${r.stats.avg_score}/100` : '—'} />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <MiniStat label="Proyectos" value={r.stats.projects_analyzed} />
            <MiniStat label="Tickets completados" value={`${r.stats.tickets_completed}/${r.stats.tickets_total}`} />
            <MiniStat label="Racha actual" value={`${r.current_streak} días`} />
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Fortalezas</h2>
              {r.strengths.length > 0 ? (
                <div className="space-y-2">
                  {r.strengths.map(s => (
                    <div key={s.dimension} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg px-3 py-2">
                      <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{s.dimension}</span>
                      <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-bold">{s.score}/20</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Aún no se identifican fortalezas claras</p>
              )}
            </div>

            {/* Weaknesses */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Áreas a mejorar</h2>
              {r.weaknesses.length > 0 ? (
                <div className="space-y-2">
                  {r.weaknesses.map(s => (
                    <div key={s.dimension} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
                      <XCircle className="size-4 text-amber-500 shrink-0" />
                      <span className="text-sm text-amber-800 dark:text-amber-300 font-medium">{s.dimension}</span>
                      <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-bold">{s.score}/20</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Sin áreas críticas detectadas</p>
              )}
            </div>
          </div>

          {/* Best skill highlight */}
          {r.best_skill && (
            <div className="mt-6 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-4 py-3">
              <Star className="size-5 text-indigo-500" />
              <div>
                <p className="text-xs text-indigo-500 font-medium">Habilidad más fuerte</p>
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{r.best_skill.dimension} — {r.best_skill.score}/20</p>
              </div>
            </div>
          )}
        </div>

        {/* Skill radar */}
        {r.skills.length > 0 && (
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Perfil de competencias</h2>
            <SkillRadar skills={r.skills} size={260} />
          </div>
        )}

        {/* Achievements */}
        {r.achievements.length > 0 && (
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Logros desbloqueados</h2>
            <div className="flex flex-wrap gap-2">
              {r.achievements.map(a => (
                <span key={a.id} className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {a.icon} {a.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects analyzed */}
        {r.projects.length > 0 && (
          <div className="px-8 py-6">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Repositorios analizados</h2>
            <div className="space-y-2">
              {r.projects.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 font-mono text-xs truncate">{p.repo_url.replace('https://github.com/', '')}</span>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {new Date(p.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              Reporte generado por DevCoach AI · Basado en {r.stats.total_interviews} entrevista{r.stats.total_interviews !== 1 ? 's' : ''} técnica{r.stats.total_interviews !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <TrendingUp className="size-3" />
              Última actualización: {today}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}
