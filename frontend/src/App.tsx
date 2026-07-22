import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DarkModeToggle } from './components/DarkModeToggle'

// Placeholder pages — se implementan en tareas 9.x y 11.x
function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
      <DarkModeToggle />
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Bienvenido a DevCoach AI
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Páginas protegidas — próximamente RepoInput, Dashboard, etc.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        {/* Futuras rutas:
        <Route path="/select" element={<FileSelectorPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/interview/:ticketId" element={<InterviewPage />} />
        */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
