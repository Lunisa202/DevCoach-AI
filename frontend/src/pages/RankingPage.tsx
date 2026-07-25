import { AxiosError } from 'axios'
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Medal,
    RotateCcw,
    Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRanking } from '../services/rankingService'
import type { RankingEntry, RankingResponse } from '../types/ranking'

// ============================================================
// RankingPage — Leaderboard Top 10 + posición del usuario
// ============================================================
export function RankingPage() {
  const [data, setData] = useState<RankingResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    setError(null)
    setData(null)
    const controller = new AbortController()
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 20_000)

    getRanking(10, controller.signal)
      .then((res) => setData(res))
      .catch((err: AxiosError | Error) => {
        // Si el cleanup del effect abortó la petición (StrictMode monta dos
        // veces el effect en dev, o el usuario navegó fuera), no es un
        // error real: la próxima corrida montará la petición buena.
        // Solo mostramos error si el timeout de 10s dispara el abort, o si
        // es un error real de red/servidor.
        const isAbort =
          (err as AxiosError).code === 'ERR_CANCELED' ||
          err.name === 'CanceledError' ||
          err.name === 'AbortError'
        if (isAbort && !timedOut) return

        setError('No se pudo cargar el ranking. Verifica tu conexión e intenta de nuevo.')
        console.error('Ranking load error:', err)
      })
      .finally(() => {
        clearTimeout(timeout)
        // Solo bajamos el spinner si NO abortamos desde el cleanup — de lo
        // contrario el componente se está desmontando y setState sería un
        // no-op ruidoso.
        if (!controller.signal.aborted || timedOut) {
          setIsLoading(false)
        }
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }

  useEffect(() => {
    const cleanup = load()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Loading skeleton ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-3xl">
        <div className="bg-slate-200 dark:bg-slate-700 mb-6 rounded w-40 h-8 animate-pulse" />
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 border-slate-100 dark:border-slate-700/50 border-b last:border-0">
              <div className="bg-slate-200 dark:bg-slate-700 rounded w-full h-6 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Error state ─────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-3xl">
        <PageHeader />
        <div className="bg-white dark:bg-slate-800 shadow-sm p-12 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-center">
          <AlertTriangle className="mx-auto mb-4 size-12 text-amber-500" />
          <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
            No se pudo cargar el ranking
          </p>
          <p className="mb-4 text-slate-500 dark:text-slate-400 text-sm">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-xl font-medium text-white text-sm"
          >
            <RotateCcw className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ─── Empty leaderboard ───────────────────────────────────
  if (!data || data.top.length === 0) {
    return (
      <div className="mx-auto p-6 lg:p-8 max-w-3xl">
        <PageHeader />
        <div className="bg-white dark:bg-slate-800 shadow-sm py-16 border-2 border-slate-200 dark:border-slate-700/50 border-dashed rounded-2xl text-center">
          <Trophy className="mx-auto mb-4 size-14 text-slate-300 dark:text-slate-600" />
          <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200 text-lg">
            Aún no hay usuarios en el ranking
          </p>
          <p className="mb-6 text-slate-500 dark:text-slate-400 text-sm">
            Completa una entrevista técnica para aparecer aquí
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-xl font-medium text-white text-sm"
          >
            Analizar un repositorio
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    )
  }

  // ─── Loaded state ────────────────────────────────────────
  return (
    <div className="mx-auto p-6 lg:p-8 max-w-3xl fade-in">
      <PageHeader />

      {/* Top 3 podium — solo si hay al menos 1 */}
      {data.top.length > 0 && <Podium top={data.top} />}

      {/* Lista completa Top_N */}
      <div className="bg-white dark:bg-slate-800 shadow-sm mt-6 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-slate-100 dark:border-slate-700/50 border-b">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Top 10</h3>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-xs">
              Ordenado por puntaje total de entrevistas aprobadas
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {data.top.map((entry) => (
            <RankingRow key={entry.user_id} entry={entry} />
          ))}
        </div>
      </div>

      {/* Posición del usuario si no está en el Top_N */}
      {data.current_user && (
        <div className="mt-6">
          <p className="mb-2 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            Tu posición
          </p>
          <div className="bg-white dark:bg-slate-800 shadow-sm border-2 border-indigo-500/60 dark:border-indigo-500/40 rounded-2xl overflow-hidden">
            <RankingRow entry={data.current_user} />
          </div>
        </div>
      )}

      {/* Hint privacidad */}
      <p className="mt-6 text-slate-400 dark:text-slate-500 text-xs text-center">
        Tu nombre real es visible por defecto. Puedes definir un alias en{' '}
        <Link to="/settings" className="text-indigo-500 hover:underline">
          Configuración
        </Link>
        .
      </p>
    </div>
  )
}

/* ─── Sub-componentes ─── */

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex justify-center items-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/25 rounded-xl size-10">
          <Trophy className="size-5 text-white" />
        </div>
        <h1 className="font-bold text-slate-900 dark:text-slate-100 text-2xl">
          <span className="gradient-text">Ranking</span> global
        </h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        Compite con la comunidad y sube posiciones aprobando entrevistas
      </p>
    </div>
  )
}

function Podium({ top }: { top: RankingEntry[] }) {
  const first = top[0]
  const second = top[1]
  const third = top[2]

  // Mostrar el podio solo si hay al menos 3 entradas.
  if (!first || !second || !third) return null

  return (
    <div className="gap-3 grid grid-cols-3 mt-2">
      <PodiumCard entry={second} rank={2} />
      <PodiumCard entry={first} rank={1} highlight />
      <PodiumCard entry={third} rank={3} />
    </div>
  )
}

function PodiumCard({
  entry,
  rank,
  highlight,
}: {
  entry: RankingEntry
  rank: 1 | 2 | 3
  highlight?: boolean
}) {
  const gradient =
    rank === 1
      ? 'from-amber-400 to-orange-500'
      : rank === 2
        ? 'from-slate-300 to-slate-400'
        : 'from-orange-400 to-amber-600'

  const medalColor =
    rank === 1
      ? 'text-amber-500'
      : rank === 2
        ? 'text-slate-400'
        : 'text-orange-600'

  return (
    <div
      className={`relative bg-white dark:bg-slate-800 shadow-sm rounded-2xl border overflow-hidden card-hover ${
        highlight
          ? 'border-indigo-400/60 dark:border-indigo-500/40 sm:-mt-4 ring-2 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-700/50'
      } ${entry.is_current_user ? 'ring-2 ring-indigo-500/60' : ''}`}
    >
      {/* Halo decorativo con el color del rango */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-4 text-center">
        <div className="flex justify-center mb-2">
          <Medal className={`size-8 ${medalColor}`} strokeWidth={2.25} />
        </div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
          {entry.display_name}
        </p>
        {entry.is_current_user && (
          <span className="inline-block bg-indigo-500/15 mt-1 px-1.5 py-0.5 rounded font-medium text-indigo-600 dark:text-indigo-400 text-[10px]">
            Tú
          </span>
        )}
        <p className="mt-2 font-bold text-slate-900 dark:text-slate-100 text-2xl">{entry.score}</p>
        <p className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider">
          puntos
        </p>
      </div>
    </div>
  )
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  const rowBg = entry.is_current_user
    ? 'bg-indigo-500/[0.06] dark:bg-indigo-500/10'
    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'

  return (
    <div className={`flex items-center gap-4 px-6 py-4 transition-colors ${rowBg}`}>
      {/* Posición */}
      <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-700 rounded-xl w-10 h-10 shrink-0">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
          #{entry.position}
        </span>
      </div>

      {/* Nombre + tú */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`font-medium truncate text-sm ${
              entry.is_current_user
                ? 'text-indigo-700 dark:text-indigo-300'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            <Link to={`/profile/${entry.user_id}`} className="hover:underline">
              {entry.display_name}
            </Link>
          </p>
          {entry.is_current_user && (
            <span className="bg-indigo-500 px-1.5 py-0.5 rounded font-medium text-white text-[10px]">
              Tú
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle className="size-3 text-emerald-500" />
            {entry.approved_reviews_count} aprobada
            {entry.approved_reviews_count !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-xs">
            · {entry.completed_tickets_count} ticket
            {entry.completed_tickets_count !== 1 ? 's' : ''} completo
            {entry.completed_tickets_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p
          className={`text-xl font-bold ${
            entry.is_current_user
              ? 'text-indigo-700 dark:text-indigo-300'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {entry.score}
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">
          puntos
        </p>
      </div>
    </div>
  )
}
