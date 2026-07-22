export interface ValidateRepoResponse {
  valid: boolean
  owner: string | null
  repo: string | null
}

export interface ProjectResponse {
  id: string
  repo_url: string
  archivos_seleccionados: string[]
  fecha_analisis: string
  user_id: string
}

export interface TicketResponse {
  id: string
  project_id: string
  titulo: string
  descripcion: string
  prioridad: 'alta' | 'media' | 'baja'
  dificultad: 'fácil' | 'media' | 'difícil'
  tiempo_estimado: string
  estado: 'to_do' | 'in_review' | 'done'
}

export interface CreateProjectResponse {
  project: ProjectResponse
  tickets: TicketResponse[]
}

export interface RepoFormData {
  repo_url: string
}

export interface TreeNode {
  path: string
  type: 'blob' | 'tree'  // blob = archivo, tree = carpeta
  size?: number
}

export interface VerifyTicketResponse {
  ticket: TicketResponse
  diff: string | null
  message: string | null
}
