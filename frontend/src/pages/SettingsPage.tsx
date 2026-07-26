import { Eye, EyeOff, GitBranch, KeyRound, Save, Trophy, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserAvatar } from '../components/UserAvatar'
import { useProfile } from '../hooks/useProfile'

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

interface AliasFormData {
  alias: string
}

export function SettingsPage() {
  const profile = useProfile()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <p className="text-sm text-slate-500 dark:text-slate-400">Administra tu perfil y preferencias</p>
      <ProfileSection profile={profile} />
      <AliasSection profile={profile} />
      <ProfileInfoSection profile={profile} />
      <PasswordSection profile={profile} />
      <ApiKeySection profile={profile} />
    </div>
  )
}

/* ─── Profile Section ─── */
function ProfileSection({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const { user } = profile
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    defaultValues: { full_name: user?.full_name ?? '' },
  })

  const onSubmit = async (data: ProfileFormData) => {
    await profile.updateProfile(data.full_name)
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <User className="size-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Perfil</h2>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <UserAvatar name={user?.full_name ?? 'U'} imageUrl={user?.avatar_url} size="lg" />
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{user?.full_name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
      </div>

      <AvatarInput profile={profile} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre completo</label>
          <input
            id="full_name"
            {...register('full_name', { required: 'El nombre es obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
          />
          {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input disabled value={user?.email ?? ''} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
          <p className="mt-1 text-xs text-slate-400">El email no se puede cambiar</p>
        </div>

        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
          <Save className="size-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}

/* ─── Avatar Input ─── */
function AvatarInput({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const [url, setUrl] = useState(profile.user?.avatar_url ?? '')

  const handleSave = async () => {
    if (!url.trim() || url.trim().length < 5) return
    await profile.updateAvatar(url.trim())
  }

  const handleRemove = async () => {
    await profile.removeAvatar()
    setUrl('')
  }

  return (
    <div className="mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">URL de foto de perfil</label>
      <div className="flex gap-2">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://i.imgur.com/tu-foto.jpg" className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
        <button onClick={handleSave} disabled={profile.isLoading} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
          {profile.isLoading ? '...' : 'Guardar'}
        </button>
      </div>
      {profile.user?.avatar_url && (
        <button onClick={handleRemove} disabled={profile.isLoading} className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium">Eliminar foto actual</button>
      )}
      <p className="mt-2 text-xs text-slate-400">Usa un enlace directo a una imagen (PNG, JPG).</p>
    </div>
  )
}

/* ─── Password Section ─── */
function PasswordSection({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = useForm<PasswordFormData>()

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await profile.updatePassword(data.current_password, data.new_password)
      reset()
    } catch { /* error handled in hook */ }
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <KeyRound className="size-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Cambiar contraseña</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña actual</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} {...register('current_password', { required: 'Requerida' })} className="w-full px-4 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
          {errors.current_password && <p className="mt-1 text-sm text-red-500">{errors.current_password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva contraseña</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} {...register('new_password', { required: 'Requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} className="w-full px-4 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
          {errors.new_password && <p className="mt-1 text-sm text-red-500">{errors.new_password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar contraseña</label>
          <input type="password" {...register('confirm_password', { required: 'Requerida', validate: (val) => val === watch('new_password') || 'Las contraseñas no coinciden' })} className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          {errors.confirm_password && <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
          <Save className="size-4" />{isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  )
}

/* ─── API Key Section ─── */
function ApiKeySection({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const [showKey, setShowKey] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ApiKeyFormData>()
  const [hasKey, setHasKey] = useState<boolean | null>(null)

  useEffect(() => {
    profile.getApiKeyStatus().then(setHasKey)
  }, [])

  const onSubmit = async (data: ApiKeyFormData) => {
    await profile.saveApiKey(data.gemini_api_key)
    setHasKey(true)
  }

  const handleRemove = async () => {
    await profile.removeApiKey()
    setHasKey(false)
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound className="size-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">API Key de Gemini</h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configura tu propia API Key para no depender de la del sistema.</p>

      {hasKey && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400">Tienes una API Key configurada</span>
          <button onClick={handleRemove} className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{hasKey ? 'Reemplazar API Key' : 'Gemini API Key'}</label>
          <div className="relative">
            <input type={showKey ? 'text' : 'password'} placeholder="AIzaSy..." {...register('gemini_api_key', { required: true, minLength: 10 })} className="w-full px-4 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono" />
            <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
          <Save className="size-4" />{isSubmitting ? 'Guardando...' : 'Guardar API Key'}
        </button>
      </form>
    </section>
  )
}

/* ─── Alias Section ─── */
function AliasSection({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const { user } = profile
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<AliasFormData>({
    defaultValues: { alias: user?.alias ?? '' },
  })

  const currentAlias = watch('alias')
  const displayName = currentAlias.trim() || user?.full_name || 'Tu nombre'

  const onSubmit = async (data: AliasFormData) => {
    const trimmed = data.alias.trim()
    const updated = await profile.updateAlias(trimmed === '' ? null : trimmed)
    reset({ alias: (updated as { alias?: string })?.alias ?? '' })
  }

  const handleClear = async () => {
    await profile.updateAlias(null)
    reset({ alias: '' })
  }

  return (
    <section className="bg-white dark:bg-slate-800 shadow-sm p-6 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="size-5 text-amber-500" />
        <h2 className="font-semibold text-slate-800 dark:text-white text-lg">Alias público (ranking)</h2>
      </div>
      <p className="mb-6 text-slate-500 dark:text-slate-400 text-sm">Elige el nombre con el que aparecerás en el leaderboard.</p>

      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 mb-6 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div className="flex justify-center items-center bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl w-9 h-9 shrink-0">
          <Trophy className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-slate-500 dark:text-slate-400 text-xs">Aparecerás como</p>
          <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{displayName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="alias" className="block mb-1 font-medium text-slate-700 dark:text-slate-300 text-sm">Alias</label>
          <input id="alias" type="text" placeholder="Ej: dev_ninja" maxLength={30} {...register('alias', { validate: (val) => val.trim().length <= 30 || 'Máximo 30 caracteres' })} className="bg-white dark:bg-slate-700 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full text-slate-900 dark:text-white transition-colors" />
          {errors.alias && <p className="text-red-500 text-sm mt-1">{errors.alias.message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isSubmitting || !isDirty} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            <Save className="size-4" />{isSubmitting ? 'Guardando...' : 'Guardar alias'}
          </button>
          {user?.alias && (
            <button type="button" onClick={handleClear} className="inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-600 dark:text-slate-300 text-sm transition-colors">
              <X className="size-4" />Quitar alias
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

/* ─── Profile Info Section ─── */
function ProfileInfoSection({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const { user } = profile
  const [bio, setBio] = useState(user?.bio ?? '')
  const [linkedin, setLinkedin] = useState(user?.linkedin_url ?? '')
  const [github, setGithub] = useState(user?.github_username ?? '')

  const handleSave = async () => {
    await profile.updateProfileInfo(bio.trim() || null, linkedin.trim() || null, github.trim() || null)
  }

  return (
    <section className="bg-white dark:bg-slate-800 shadow-sm p-6 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <GitBranch className="size-5 text-slate-600 dark:text-slate-400" />
        <h2 className="font-semibold text-slate-800 dark:text-white text-lg">Bio & Redes sociales</h2>
      </div>
      <p className="mb-6 text-slate-500 dark:text-slate-400 text-sm">Esta información es visible en tu perfil público</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} placeholder="Desarrollador frontend apasionado por React y TypeScript..." className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" />
          <p className="mt-1 text-xs text-slate-400 text-right">{bio.length}/300</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">GitHub username</label>
          <div className="flex items-center">
            <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-600 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-lg text-slate-500 dark:text-slate-400 text-sm">github.com/</span>
            <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="tu-usuario" className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-r-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/tu-perfil" className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
        </div>
        <button onClick={handleSave} disabled={profile.isLoading} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
          <Save className="size-4" />{profile.isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </section>
  )
}
