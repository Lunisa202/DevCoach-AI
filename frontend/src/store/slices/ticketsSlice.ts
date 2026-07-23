import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { TicketResponse } from '../../types/project'

interface TicketsState {
  tickets: TicketResponse[]
  isLoading: boolean
  projectId: string | null
}

const initialState: TicketsState = {
  tickets: [],
  isLoading: false,
  projectId: null,
}

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets(state, action: PayloadAction<{ projectId: string; tickets: TicketResponse[] }>) {
      state.tickets = action.payload.tickets
      state.projectId = action.payload.projectId
      state.isLoading = false
    },
    setTicketsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    updateTicketState(state, action: PayloadAction<{ ticketId: string; estado: TicketResponse['estado'] }>) {
      const ticket = state.tickets.find((t) => t.id === action.payload.ticketId)
      if (ticket) {
        ticket.estado = action.payload.estado
      }
    },
    clearTickets(state) {
      state.tickets = []
      state.projectId = null
      state.isLoading = false
    },
  },
})

export const { setTickets, setTicketsLoading, updateTicketState, clearTickets } = ticketsSlice.actions
export default ticketsSlice.reducer
