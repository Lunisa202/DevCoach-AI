import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { getTicketById as fetchTicket, getTicketReviews, verifyTicket } from '../services/ticketService'
import { updateTicketState } from '../store/slices/ticketsSlice'
import type { RootState } from '../store'
import type { TicketResponse } from '../types/project'
import type { ReviewDetailed, DimensionScore } from '../types/interview'

export function useTicketDetail(ticketId: string | undefined) {
  const dispatch = useDispatch()
  const storeTickets = useSelector((state: RootState) => state.tickets.tickets)

  const [ticket, setTicket] = useState<TicketResponse | null>(null)
  const [reviews, setReviews] = useState<ReviewDetailed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (!ticketId) return
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      try {
        // Try store first, else fetch
        const fromStore = storeTickets.find((t) => t.id === ticketId)
        if (fromStore) {
          setTicket(fromStore)
        } else {
          const data = await fetchTicket(ticketId)
          if (!cancelled) setTicket(data)
        }

        const reviewsData = await getTicketReviews(ticketId)
        if (!cancelled) setReviews(reviewsData)
      } catch {
        if (!cancelled) toast.error('No se pudo cargar el ticket')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [ticketId, storeTickets])

  const handleVerify = async () => {
    if (!ticketId) return
    setIsVerifying(true)
    try {
      const result = await verifyTicket(ticketId)
      if (result.ticket.estado === 'in_review') {
        toast.success(result.message ?? 'Commit verificado')
        setTicket(result.ticket)
        dispatch(updateTicketState({ ticketId, estado: 'in_review' }))
      } else {
        toast(result.message ?? 'No se detectaron cambios relevantes', { icon: 'ℹ️' })
      }
    } catch {
      toast.error('Error al verificar el commit')
    } finally {
      setIsVerifying(false)
    }
  }

  // Parse aspectos_evaluados safely (comes as JSON string from DB)
  const parseAspectos = (raw: unknown): DimensionScore[] => {
    try {
      if (typeof raw === 'string') return JSON.parse(raw)
      if (Array.isArray(raw)) return raw
    } catch { /* ignore */ }
    return []
  }

  return {
    ticket,
    reviews,
    isLoading,
    isVerifying,
    handleVerify,
    parseAspectos,
  }
}
