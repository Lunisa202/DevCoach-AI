import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { setTickets, setTicketsLoading, updateTicketState } from '../store/slices/ticketsSlice'
import { getProjectTickets } from '../services/projectService'
import type { RootState } from '../store'

export function useTickets() {
  const dispatch = useDispatch()
  const { tickets, isLoading, projectId } = useSelector(
    (state: RootState) => state.tickets,
  )

  const loadTickets = async (targetProjectId: string) => {
    // Skip if already loaded for this project
    if (projectId === targetProjectId && tickets.length > 0) return

    dispatch(setTicketsLoading(true))
    try {
      const data = await getProjectTickets(targetProjectId)
      dispatch(setTickets({ projectId: targetProjectId, tickets: data }))
    } catch {
      toast.error('No se pudieron cargar los tickets')
      dispatch(setTicketsLoading(false))
    }
  }

  const refreshTickets = async (targetProjectId: string) => {
    dispatch(setTicketsLoading(true))
    try {
      const data = await getProjectTickets(targetProjectId)
      dispatch(setTickets({ projectId: targetProjectId, tickets: data }))
    } catch {
      toast.error('No se pudieron cargar los tickets')
      dispatch(setTicketsLoading(false))
    }
  }

  const setTicketState = (ticketId: string, estado: 'to_do' | 'in_review' | 'done') => {
    dispatch(updateTicketState({ ticketId, estado }))
  }

  const getTicketById = (ticketId: string) => {
    return tickets.find((t) => t.id === ticketId) ?? null
  }

  return {
    tickets,
    isLoading,
    projectId,
    loadTickets,
    refreshTickets,
    setTicketState,
    getTicketById,
  }
}
