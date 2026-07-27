import {
  Award,
  Calendar,
  ExternalLink,
  Flame,
  FolderGit2,
  GitBranch,
  Link2,
  Star,
  CheckCircle,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axiosClient from '../services/axiosClient'
import { UserAvatar } from '../components/UserAvatar'
import { SkillRadar } from '../components/SkillRadar'

interface ProfileData {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  linkedin_url: string | null
  github_username: string | null
  level: number
  xp: number
  current_streak: number
  member_since: string
  stats: {
    projects: number
    tickets_completed: number
    tickets_total: number
    approved_reviews: number
    avg_score: number | null
  }
  achievements: Array<{ id: string; title: string; icon: string }>
  is_own_profile: boolean
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(false)
    axiosClient.get(`/api/profiles/${userId}`)
      .then(res => setProfile(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-3xl">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl h-64 animate-pulse" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-3xl text-center py-16">
        <p className="text-slate-500 dark:text-slate-400">No se pudo cargar el perfil</p>
      </div>
    )
  }

  const p = profile

  return (
    <div className="mx-auto p-6 lg:p-8 max-w-3xl fade-in space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Banner gradient */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        <div className="px-6 pb-6 -mt-10">
          {/* Avatar */}
          <UserAvatar name={p.display_name} imageUrl={p.avatar_url} size="lg" className="ring-4 ring-white dark:ring-slate-800 size-20 text-2xl" />

          <div className="mt-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{p.display_name}</h1>
              {p.bio && <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">{p.bio}</p>}

              {/* Social links */}
              <div className="flex items-center gap-3 mt-3">
                {p.github_username && (
                  <a href={`https://github.com/${p.github_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 text-sm transition-colors">
                    <GitBranch className="size-4" />
                    {p.github_username}
                  </a>
                )}
                {p.linkedin_url && (
                  <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 text-sm transition-colors">
                    <Link2 className="size-4" />
                    LinkedIn
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {/* Member since */}
              <p className="mt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
                <Calendar className="size-3.5" />
                Miembro desde {new Date(p.member_since).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Level badge */}
            <div className="flex flex-col items-center">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
                {p.level}
              </div>
              <span className="mt-1 text-xs text-slate-400">Nivel</span>
            </div>
          </div>

          {p.is_own_profile && (
            <Link to="/settings" className="inline-flex items-center gap-1.5 mt-4 text-indigo-500 hover:text-indigo-600 text-sm font-medium">
              Editar perfil
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge icon={<Star className="size-4 text-amber-500" />} label="XP" value={p.xp} />
        <StatBadge icon={<Flame className="size-4 text-orange-500" />} label="Racha" value={`${p.current_streak} días`} />
        <StatBadge icon={<FolderGit2 className="size-4 text-indigo-500" />} label="Proyectos" value={p.stats.projects} />
        <StatBadge icon={<CheckCircle className="size-4 text-emerald-500" />} label="Tickets" value={`${p.stats.tickets_completed}/${p.stats.tickets_total}`} />
      </div>

      {/* More stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Reviews aprobadas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{p.stats.approved_reviews}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Promedio calificación</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{p.stats.avg_score !== null ? `${p.stats.avg_score}%` : '—'}</p>
        </div>
      </div>

      {/* Skill Radar */}
      <ProfileSkillRadar userId={p.id} />

      {/* Achievements */}
      {p.achievements.length > 0 && (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="size-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Logros ({p.achievements.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.achievements.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2"
                title={a.title}
              >
                <span className="text-lg">{a.icon}</span>
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {p.achievements.length === 0 && (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 text-center">
          <Award className="mx-auto size-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aún no tiene logros desbloqueados</p>
        </div>
      )}
    </div>
  )
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}


function ProfileSkillRadar({ userId }: { userId: string }) {
  const [skills, setSkills] = useState<Array<{ dimension: string; score: number; max_score: number; count: number }>>([])

  useEffect(() => {
    axiosClient.get(`/api/profiles/${userId}/skills`)
      .then(res => setSkills(res.data.skills || []))
      .catch(() => {})
  }, [userId])

  if (skills.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Perfil de competencias</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Promedio por dimensión de evaluación</p>
      <SkillRadar skills={skills} />
    </div>
  )
}
