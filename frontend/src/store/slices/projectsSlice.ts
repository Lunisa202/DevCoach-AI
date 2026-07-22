import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ProjectResponse } from '../../types/project'

interface ProjectsState {
  projects: ProjectResponse[]
  activeProjectId: string | null
  isLoading: boolean
}

const initialState: ProjectsState = {
  projects: [],
  activeProjectId: null,
  isLoading: false,
}

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<ProjectResponse[]>) {
      state.projects = action.payload
      state.isLoading = false
    },
    setActiveProject(state, action: PayloadAction<string | null>) {
      state.activeProjectId = action.payload
    },
    setProjectsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    removeProject(state, action: PayloadAction<string>) {
      state.projects = state.projects.filter((p) => p.id !== action.payload)
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = null
      }
    },
    addProject(state, action: PayloadAction<ProjectResponse>) {
      state.projects.unshift(action.payload)
    },
  },
})

export const {
  setProjects,
  setActiveProject,
  setProjectsLoading,
  removeProject,
  addProject,
} = projectsSlice.actions

export default projectsSlice.reducer
