import { useState } from 'react'
import { getRepoName } from '../utils/repoUrl'
import { CheckCircle2, Trash2 } from 'lucide-react'
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

  const total = project.tickets_total ?? 0
  const done = project.tickets_done ?? 0
  const isComplete = total > 0 && done === total

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
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{repoName}</p>
            {isComplete && (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {dateStr}{total > 0 && ` · ${done}/${total}`}
          </p>
        </div>

        <button
          onClick={handleDeleteClick}
          title="Eliminar proyecto"
          className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
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
