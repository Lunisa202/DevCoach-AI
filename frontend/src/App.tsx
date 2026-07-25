import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AchievementsPage } from './pages/AchievementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ReportPage } from './pages/ReportPage'
import { DashboardPage } from './pages/DashboardPage'
import { FileSelectorPage } from './pages/FileSelectorPage'
import { HomePage } from './pages/HomePage'
import { InterviewPage } from './pages/InterviewPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RankingPage } from './pages/RankingPage'
import { RegisterPage } from './pages/RegisterPage'
import { RepoInputPage } from './pages/RepoInputPage'
import { SettingsPage } from './pages/SettingsPage'
import { TicketDetailPage } from './pages/TicketDetailPage'

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
        <Route path="/home" element={<HomePage />} />
        <Route path="/app" element={<RepoInputPage />} />
        <Route path="/select" element={<FileSelectorPage />} />
        <Route path="/dashboard/:projectId" element={<DashboardPage />} />
        <Route path="/ticket/:ticketId" element={<TicketDetailPage />} />
        <Route path="/interview/:ticketId" element={<InterviewPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
