import { Award, Lock, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import axiosClient from '../services/axiosClient'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  unlocked: boolean
  unlocked_at: string | null
}

interface AchievementsData {
  achievements: Achievement[]
  total: number
  unlocked: number
  progress: number
}

export function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosClient.get('/api/achievements')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-3xl">
        <div className="bg-slate-200 dark:bg-slate-700 mb-6 rounded w-48 h-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const d = data ?? { achievements: [], total: 0, unlocked: 0, progress: 0 }

  return (
    <div className="mx-auto p-6 lg:p-8 max-w-3xl fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex justify-center items-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/25 rounded-xl size-10">
            <Trophy className="size-5 text-white" />
          </div>
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-2xl">Logros</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Desbloquea badges completando desafíos en la plataforma
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-white text-sm">Progreso total</span>
          </div>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
            {d.unlocked}/{d.total}
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${d.progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">{d.progress}% completado</p>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {d.achievements.map(a => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = achievement.unlocked

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        isUnlocked
          ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 opacity-60'
      }`}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className={`flex size-14 items-center justify-center rounded-xl text-2xl shrink-0 ${
          isUnlocked
            ? 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10'
            : 'bg-slate-100 dark:bg-slate-700/50'
        }`}>
          {isUnlocked ? (
            <span>{achievement.icon}</span>
          ) : (
            <Lock className="size-5 text-slate-400 dark:text-slate-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${
            isUnlocked
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {achievement.title}
          </h3>
          <p className={`text-xs mt-0.5 ${
            isUnlocked
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}>
            {achievement.description}
          </p>
          {isUnlocked && achievement.unlocked_at && (
            <p className="text-[11px] text-indigo-500 mt-1.5 font-medium">
              ✓ Desbloqueado {new Date(achievement.unlocked_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
