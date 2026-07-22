import axios from 'axios'
import type { TokenResponse, LoginFormData, RegisterFormData } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * Auth service uses a plain axios instance (no interceptors)
 * because login/register don't need Authorization header
 * and shouldn't trigger the 401 redirect logic.
 */
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export async function loginService(data: LoginFormData): Promise<TokenResponse> {
  const response = await authAxios.post<TokenResponse>('/api/auth/login', {
    email: data.email,
    password: data.password,
  })
  return response.data
}

export async function registerService(
  data: Omit<RegisterFormData, 'confirmPassword'>
): Promise<TokenResponse> {
  const response = await authAxios.post<TokenResponse>('/api/auth/register', {
    full_name: data.full_name,
    email: data.email,
    password: data.password,
  })
  return response.data
}
