import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { RepoInputPage } from './pages/RepoInputPage'
import { FileSelectorPage } from './pages/FileSelectorPage'
import { DashboardPage } from './pages/DashboardPage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { InterviewPage } from './pages/InterviewPage'
import { AppLayout } from './components/AppLayout'

function App() {
  return (
    <Routes>
      {/* Landing page como página principal */}
      <Route path="/" element={<LandingPage />} />

      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas con sidebar */}
      <Route element={<AppLayout />}>
        <Route path="/app" element={<RepoInputPage />} />
        <Route path="/select" element={<FileSelectorPage />} />
        <Route path="/dashboard/:projectId" element={<DashboardPage />} />
        <Route path="/ticket/:ticketId" element={<TicketDetailPage />} />
        <Route path="/interview/:ticketId" element={<InterviewPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
