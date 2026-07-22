/**
 * Base URL for all API requests.
 * Set VITE_API_URL in .env.local for local dev (e.g. http://localhost:8000)
 * and in Vercel's environment variables for production.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail ?? 'Error en la solicitud')
  }

  return response.json() as Promise<T>
}
