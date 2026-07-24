import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { setCredentials } from '../store/slices/authSlice'
import { loginService } from '../services/authService'
import { DevCoachLogo } from '../components/DevCoachLogo'
import { DarkModeToggle } from '../components/DarkModeToggle'
import type { LoginFormData, TokenResponse } from '../types/auth'
import type { RootState } from '../store'

export function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  // Si ya está logueada, redirigir al home
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    mode: 'onTouched',
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response: TokenResponse = await loginService({
        email: data.email,
        password: data.password,
      })
      dispatch(setCredentials({ token: response.access_token, user: response.user }))
      toast.success('Sesión iniciada')
      navigate('/home')
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      const message = error.response?.data?.detail ?? 'Ocurrió un error inesperado'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors">
      <DarkModeToggle />

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-indigo-600 dark:bg-indigo-900 p-12">
        <div className="text-center max-w-md">
          <DevCoachLogo className="h-20 w-20 mx-auto mb-6 text-white" />
          <h1 className="text-3xl font-bold text-white mb-4">DevCoach AI</h1>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Tu código habla. Nosotros te ayudamos a mejorarlo con feedback real de un Tech Lead con IA.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <DevCoachLogo className="h-14 w-14 mb-3" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">DevCoach AI</h1>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Iniciar sesión
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Todo listo para crecer con tu tech lead
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'El email es obligatorio',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Formato de email inválido',
                  },
                })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
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
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            {/* Server error */}
            {errors.root && (
              <p className="text-sm text-red-500 text-center">{errors.root.message}</p>
            )}
          </form>

          {/* Link to register */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
