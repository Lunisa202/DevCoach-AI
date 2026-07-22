import { useState } from 'react'
import { getRepoName } from '../utils/repoUrl'
import { ConfirmModal } from './ConfirmModal'
import type { ProjectResponse } from '../types/project'

interface Props {
  project: ProjectResponse
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export function SidebarProjectItem({ project, isActive, onClick, onDelete }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const repoName = getRepoName(project.repo_url)
  const dateStr = new Date(project.fecha_analisis).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
  })

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteModal(false)
    onDelete()
  }

  return (
    <>
      <div
        onClick={onClick}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? 'bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{repoName}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{dateStr}</p>
        </div>

        <button
          onClick={handleDeleteClick}
          title="Eliminar proyecto"
          className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar proyecto"
        message={`¿Estás seguro que deseas eliminar "${repoName}"? Se borrarán todos los tickets y entrevistas asociadas.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  )
}
