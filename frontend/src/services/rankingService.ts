import axiosClient from './axiosClient'
import type { RankingResponse } from '../types/ranking'
import type { User } from '../types/auth'

/**
 * Trae el leaderboard con el Top_N y la posición del usuario actual.
 *
 * @param limit tamaño del Top_N (1..100). Default backend: 10.
 * @param signal AbortSignal opcional (se usa para el timeout de 10s en la Ranking Page).
 */
export async function getRanking(limit = 10, signal?: AbortSignal): Promise<RankingResponse> {
  const { data } = await axiosClient.get<RankingResponse>('/api/ranking', {
    params: { limit },
    signal,
    timeout: 20_000,
  })
  return data
}

/**
 * Actualiza el alias público del usuario autenticado.
 *
 * @param alias nuevo alias (1..30 chars tras trim) o null para limpiarlo.
 *              El backend responde 422 si es inválido, sin persistir cambios.
 */
export async function updateAlias(alias: string | null): Promise<User> {
  const { data } = await axiosClient.put<{ user: User }>('/api/auth/alias', { alias })
  return data.user
}
