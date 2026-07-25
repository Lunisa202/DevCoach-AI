export interface User {
  id: string
  full_name: string
  email: string
  created_at: string
  alias?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  full_name: string
  email: string
  password: string
  confirmPassword: string
}
