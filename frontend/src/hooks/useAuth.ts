import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { clearCredentials } from '../store/slices/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const { token, user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  )

  const logout = () => {
    dispatch(clearCredentials())
  }

  return { token, user, isAuthenticated, logout }
}
