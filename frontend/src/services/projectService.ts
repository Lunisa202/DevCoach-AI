import axiosClient from './axiosClient'
import type { ValidateRepoResponse, CreateProjectResponse, ProjectResponse, TicketResponse, TreeNode } from '../types/project'

export async function validateRepo(repoUrl: string): Promise<ValidateRepoResponse> {
  const { data } = await axiosClient.post<ValidateRepoResponse>(
    '/api/projects/validate-repo',
    { repo_url: repoUrl },
  )
  return data
}

export async function getRepoTree(owner: string, repo: string): Promise<TreeNode[]> {
  const { data } = await axiosClient.get<TreeNode[]>(`/api/projects/tree/${owner}/${repo}`)
  return data
}

export async function createProject(
  repoUrl: string,
  archivosSeleccionados: string[],
): Promise<CreateProjectResponse> {
  const { data } = await axiosClient.post<CreateProjectResponse>(
    '/api/projects',
    { repo_url: repoUrl, archivos_seleccionados: archivosSeleccionados },
  )
  return data
}

export async function getProjects(): Promise<ProjectResponse[]> {
  const { data } = await axiosClient.get<ProjectResponse[]>('/api/projects')
  return data
}

export async function deleteProject(projectId: string): Promise<void> {
  await axiosClient.delete(`/api/projects/${projectId}`)
}

export async function getProjectTickets(projectId: string): Promise<TicketResponse[]> {
  const { data } = await axiosClient.get<TicketResponse[]>(`/api/projects/${projectId}/tickets`)
  return data
}
