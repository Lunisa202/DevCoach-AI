import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { setProjects, setProjectsLoading, removeProject } from '../store/slices/projectsSlice'
import { getProjects, deleteProject } from '../services/projectService'
import type { RootState } from '../store'

export function useProjects() {
  const dispatch = useDispatch()
  const { projects, activeProjectId, isLoading } = useSelector(
    (state: RootState) => state.projects,
  )

  const loadProjects = async () => {
    dispatch(setProjectsLoading(true))
    try {
      const data = await getProjects()
      dispatch(setProjects(data))
    } catch {
      toast.error('No se pudieron cargar los proyectos')
      dispatch(setProjectsLoading(false))
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      dispatch(removeProject(projectId))
      toast.success('Proyecto eliminado')
    } catch {
      toast.error('No se pudo eliminar el proyecto')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  return {
    projects,
    activeProjectId,
    isLoading,
    loadProjects,
    deleteProject: handleDeleteProject,
  }
}
