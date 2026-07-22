export interface InterviewStartResponse {
  ticket_id: string
  questions: string[]
}

export interface DimensionScore {
  dimension: string
  puntaje: number   // 0-20
  comentario: string
}

export interface EvaluateResponse {
  feedback: string
  aprobado: boolean
  calificacion: number  // 0-100
  aspectos_evaluados: DimensionScore[]
  conceptos_a_mejorar: string[]
}

export interface ReviewDetailed {
  id: string
  ticket_id: string
  preguntas_generadas: string[]
  respuesta_usuario: string
  feedback_evaluator: string
  aprobado: boolean
  calificacion: number | null
  aspectos_evaluados: DimensionScore[] | null
  conceptos_a_mejorar: string[] | null
  created_at: string
}
