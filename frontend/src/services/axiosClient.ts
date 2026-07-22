import axios from 'axios'
import toast from 'react-hot-toast'
import { store } from '../store'
import { clearCredentials } from '../store/slices/authSlice'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — agrega Authorization header si hay token
axiosClient.interceptors.request.use((config) => {
  const { token } = store.getState().auth
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — maneja token expirado (401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { isAuthenticated } = store.getState().auth
      // Solo mostrar toast si el usuario ESTABA autenticado (no en login/register)
      if (isAuthenticated) {
        store.dispatch(clearCredentials())
        toast.error('Sesión expirada. Inicia sesión nuevamente.')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient
