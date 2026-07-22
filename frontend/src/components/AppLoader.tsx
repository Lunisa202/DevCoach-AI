import { Spinner } from './Spinner'
import { DevCoachLogo } from './DevCoachLogo'

export function AppLoader() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-6 transition-colors">
      <DevCoachLogo className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
      <Spinner size="md" label="Cargando..." />
    </div>
  )
}
