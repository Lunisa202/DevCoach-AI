import axiosClient from './axiosClient'
import type { InterviewStartResponse, EvaluateResponse } from '../types/interview'

export async function startInterview(
  ticketId: string,
  mode: 'chat' | 'llamada',
): Promise<InterviewStartResponse> {
  const { data } = await axiosClient.post<InterviewStartResponse>(
    '/api/interviews/start',
    { ticket_id: ticketId, mode },
  )
  return data
}

export async function evaluateAnswers(
  ticketId: string,
  questions: string[],
  answers: string[],
): Promise<EvaluateResponse> {
  const { data } = await axiosClient.post<EvaluateResponse>(
    '/api/interviews/evaluate',
    { ticket_id: ticketId, questions, answers },
  )
  return data
}
