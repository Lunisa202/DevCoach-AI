import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { DevCoachLogo } from '../components/DevCoachLogo'
import { validateRepo } from '../services/projectService'
import type { RepoFormData } from '../types/project'

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/?$/

export function RepoInputPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RepoFormData>({
    mode: 'onTouched',
  })

  const onSubmit = async (data: RepoFormData) => {
    try {
      const result = await validateRepo(data.repo_url.trim())

      if (result.valid) {
        toast.success('Repositorio válido')
        // Navegar al file selector con la info del repo
        navigate('/select', {
          state: {
            repoUrl: data.repo_url.trim(),
            owner: result.owner,
            repo: result.repo,
          },
        })
      }
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      const status = error.response?.status
      const message = error.response?.data?.detail ?? 'Error al validar el repositorio'

      if (status === 400) {
        setError('repo_url', { message: 'Formato de URL inválido. Debe ser: https://github.com/owner/repo' })
      } else if (status === 404) {
        setError('repo_url', { message: 'Repositorio no encontrado o no es público' })
        toast.error('Repositorio no encontrado')
      } else if (status === 503) {
        setError('repo_url', { message })
        toast.error('No se pudo conectar con GitHub')
      } else {
        setError('repo_url', { message })
        toast.error(message)
      }
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-8 transition-colors">

      <div className="w-full max-w-lg text-center">
        <DevCoachLogo className="h-16 w-16 mx-auto mb-6 text-indigo-600 dark:text-indigo-400" />

        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Analizar repositorio
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Pega la URL de tu repositorio GitHub público para empezar
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="text-left">
            <label htmlFor="repo_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              URL del repositorio
            </label>
            <input
              id="repo_url"
              type="url"
              autoComplete="url"
              {...register('repo_url', {
                required: 'La URL es obligatoria',
                maxLength: { value: 2048, message: 'La URL es demasiado larga' },
                pattern: {
                  value: GITHUB_URL_PATTERN,
                  message: 'Debe ser una URL válida de GitHub (https://github.com/owner/repo)',
                },
              })}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
              placeholder="https://github.com/owner/repo"
            />
            {errors.repo_url && (
              <p className="mt-1 text-sm text-red-500">{errors.repo_url.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSubmitting ? 'Validando...' : 'Validar repositorio'}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Solo repositorios públicos. El análisis puede tardar unos segundos.
        </p>
      </div>
    </div>
  )
}
