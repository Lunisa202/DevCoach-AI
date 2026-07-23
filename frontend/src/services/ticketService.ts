import axiosClient from './axiosClient'
import type { VerifyTicketResponse, TicketResponse } from '../types/project'
import type { ReviewDetailed } from '../types/interview'

export async function verifyTicket(ticketId: string): Promise<VerifyTicketResponse> {
  const { data } = await axiosClient.post<VerifyTicketResponse>(
    `/api/tickets/${ticketId}/verify`,
  )
  return data
}

export async function getTicketReviews(ticketId: string): Promise<ReviewDetailed[]> {
  const { data } = await axiosClient.get<ReviewDetailed[]>(
    `/api/tickets/${ticketId}/reviews`,
  )
  return data
}

export async function getTicketById(ticketId: string): Promise<TicketResponse> {
  const { data } = await axiosClient.get<TicketResponse>(
    `/api/tickets/${ticketId}`,
  )
  return data
}
