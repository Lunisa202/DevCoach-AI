import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { Spinner } from './Spinner'
import { SidebarProjectItem } from './SidebarProjectItem'
import { DarkModeToggle } from './DarkModeToggle'
import { useProjects } from '../hooks/useProjects'
import { setActiveProject } from '../store/slices/projectsSlice'
import { clearCredentials } from '../store/slices/authSlice'
import type { RootState } from '../store'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: Props) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)
  const { projects, activeProjectId, isLoading, deleteProject } = useProjects()

  const handleProjectClick = (projectId: string) => {
    dispatch(setActiveProject(projectId))
    navigate(`/dashboard/${projectId}`)
    onClose()
  }

  const handleNewAnalysis = () => {
    dispatch(setActiveProject(null))
    navigate('/app')
    onClose()
  }

  const handleLogout = () => {
    dispatch(clearCredentials())
    navigate('/login')
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <UserAvatar name={user?.full_name ?? 'U'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {user?.full_name ?? 'Usuario'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {user?.email ?? ''}
            </p>
          </div>
          <DarkModeToggle />
        </div>

        {/* New analysis button */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={handleNewAnalysis}
            className="w-full py-2 px-3 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo análisis
          </button>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
              No tienes proyectos aún
            </p>
          ) : (
            projects.map((project) => (
              <SidebarProjectItem
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onClick={() => handleProjectClick(project.id)}
                onDelete={() => deleteProject(project.id)}
              />
            ))
          )}
        </div>

        {/* Footer — dashboard + settings + logout */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
          <button
            onClick={() => { navigate('/home'); onClose() }}
            className="w-full py-2 px-3 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => { navigate('/settings'); onClose() }}
            className="w-full py-2 px-3 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuración
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
