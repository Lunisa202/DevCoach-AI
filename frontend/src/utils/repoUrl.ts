/**
 * Extrae el nombre del repositorio de una URL de GitHub.
 * 
 * Ejemplos:
 *   "https://github.com/Lunisa202/DevCoach-AI"   → "DevCoach-AI"
 *   "https://github.com/Lunisa202/DevCoach-AI/"  → "DevCoach-AI"
 *   "https://github.com/user/my.dotted.repo"     → "my.dotted.repo"
 *   "https://github.com/user/repo-name_v2"       → "repo-name_v2"
 *   ""                                            → "Proyecto"
 */
export function getRepoName(url: string): string {
  if (!url) return 'Proyecto'
  const cleaned = url.replace(/\/+$/, '') // quitar trailing slashes
  const parts = cleaned.split('/')
  return parts[parts.length - 1] || 'Proyecto'
}

/**
 * Extrae owner/repo de una URL de GitHub.
 * 
 * Ejemplos:
 *   "https://github.com/Lunisa202/DevCoach-AI" → "Lunisa202/DevCoach-AI"
 *   ""                                          → "Proyecto"
 */
export function getOwnerRepo(url: string): string {
  if (!url) return 'Proyecto'
  const cleaned = url.replace(/\/+$/, '')
  const parts = cleaned.split('/')
  if (parts.length < 2) return 'Proyecto'
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
}
