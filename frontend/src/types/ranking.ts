export interface RankingEntry {
  user_id: string
  position: number
  display_name: string
  score: number
  approved_reviews_count: number
  completed_tickets_count: number
  is_current_user: boolean
}

export interface RankingResponse {
  /** Top_N entries del leaderboard, ordenadas por posición ascendente. */
  top: RankingEntry[]
  /**
   * Posición del usuario autenticado cuando NO cae dentro del Top_N.
   * Si el usuario está en `top`, este campo va null y la entrada dentro
   * de `top` lleva is_current_user=true.
   */
  current_user: RankingEntry | null
}
