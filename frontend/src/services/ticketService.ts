import axiosClient from './axiosClient'
import type { VerifyTicketResponse } from '../types/project'

export async function verifyTicket(ticketId: string): Promise<VerifyTicketResponse> {
  const { data } = await axiosClient.post<VerifyTicketResponse>(
    `/api/tickets/${ticketId}/verify`,
  )
  return data
}
