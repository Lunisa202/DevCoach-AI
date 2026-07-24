import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, KeyRound, Eye, EyeOff, Save } from 'lucide-react'
import { UserAvatar } from '../components/UserAvatar'
import { setCredentials } from '../store/slices/authSlice'
import axiosClient from '../services/axiosClient'
import type { RootState } from '../store'

interface ProfileFormData {
  full_name: string
}

interface PasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

interface ApiKeyFormData {
  gemini_api_key: string
}

export function SettingsPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const dispatch = useDispatch()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Administra tu perfil y preferencias</p>
      </div>

      {/* Profile Section */}
      <ProfileSection user={user} token={token} dispatch={dispatch} />

      {/* Password Section */}
      <PasswordSection />

      {/* API Key Section */}
      <ApiKeySection />
    </div>
  )
}

/* ─── Profile Section ─── */
function ProfileSection({ user, token, dispatch }: { user: any; token: string | null; dispatch: any }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    defaultValues: { full_name: user?.full_name ?? '' },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const res = await axiosClient.put('/api/auth/profile', { full_name: data.full_name })
      dispatch(setCredentials({ token: token!, user: res.data.user }))
      toast.success('Nombre actualizado')
    } catch {
      toast.error('No se pudo actualizar el perfil')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="size-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Perfil</h2>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <UserAvatar name={user?.full_name ?? 'U'} size="lg" />
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{user?.full_name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre completo
          </label>
          <input
            id="full_name"
            {...register('full_name', { required: 'El nombre es obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
          />
          {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input
            disabled
            value={user?.email ?? ''}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-400">El email no se puede cambiar</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save className="size-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}

/* ─── Password Section ─── */
function PasswordSection() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = useForm<PasswordFormData>()

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await axiosClient.put('/api/auth/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Contraseña actualizada')
      reset()
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'No se pudo cambiar la contraseña'
      toast.error(msg)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <KeyRound className="size-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Cambiar contraseña</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña actual</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              {...register('current_password', { required: 'Requerida' })}
              className="w-full px-4 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.current_password && <p className="mt-1 text-sm text-red-500">{errors.current_password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              {...register('new_password', { required: 'Requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
              className="w-full px-4 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.new_password && <p className="mt-1 text-sm text-red-500">{errors.new_password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar contraseña</label>
          <input
            type="password"
            {...register('confirm_password', {
              required: 'Requerida',
              validate: (val) => val === watch('new_password') || 'Las contraseñas no coinciden',
            })}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          {errors.confirm_password && <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save className="size-4" />
          {isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  )
}

/* ─── API Key Section ─── */
function ApiKeySection() {
  const [showKey, setShowKey] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ApiKeyFormData>()
  const [hasKey, setHasKey] = useState<boolean | null>(null)

  // Check if user already has a key configured
  useState(() => {
    axiosClient.get('/api/auth/api-key-status')
      .then(res => setHasKey(res.data.has_key))
      .catch(() => setHasKey(false))
  })

  const onSubmit = async (data: ApiKeyFormData) => {
    try {
      await axiosClient.put('/api/auth/api-key', { gemini_api_key: data.gemini_api_key })
      toast.success('API Key guardada')
      setHasKey(true)
      window.dispatchEvent(new Event('api-key-saved'))
    } catch {
      toast.error('No se pudo guardar la API Key')
    }
  }

  const handleRemoveKey = async () => {
    try {
      await axiosClient.delete('/api/auth/api-key')
      toast.success('API Key eliminada — se usará la del sistema')
      setHasKey(false)
    } catch {
      toast.error('No se pudo eliminar la API Key')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound className="size-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">API Key de Gemini</h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Configura tu propia API Key para no depender de la del sistema. Tu key se almacena de forma segura y solo se usa para tus análisis.
      </p>

      {hasKey && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400">Tienes una API Key configurada</span>
          <button
            onClick={handleRemoveKey}
            className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Eliminar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {hasKey ? 'Reemplazar API Key' : 'Gemini API Key'}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              {...register('gemini_api_key', { required: true, minLength: 10 })}
              className="w-full px-4 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
            />
            <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Obtén tu key en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Google AI Studio</a>
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save className="size-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar API Key'}
        </button>
      </form>
    </section>
  )
}
