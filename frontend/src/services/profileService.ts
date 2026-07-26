import axiosClient from './axiosClient'
import type { User } from '../types/auth'

export interface UpdateProfileResponse {
  user: User
}

export async function updateProfile(fullName: string): Promise<UpdateProfileResponse> {
  const { data } = await axiosClient.put<UpdateProfileResponse>('/api/auth/profile', { full_name: fullName })
  return data
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  await axiosClient.put('/api/auth/password', { current_password: currentPassword, new_password: newPassword })
}

export async function updateAvatar(avatarUrl: string): Promise<UpdateProfileResponse> {
  const { data } = await axiosClient.put<UpdateProfileResponse>('/api/auth/avatar', { avatar_url: avatarUrl })
  return data
}

export async function removeAvatar(): Promise<void> {
  await axiosClient.delete('/api/auth/avatar')
}

export async function getApiKeyStatus(): Promise<{ has_key: boolean }> {
  const { data } = await axiosClient.get<{ has_key: boolean }>('/api/auth/api-key-status')
  return data
}

export async function saveApiKey(geminiApiKey: string): Promise<void> {
  await axiosClient.put('/api/auth/api-key', { gemini_api_key: geminiApiKey })
}

export async function removeApiKey(): Promise<void> {
  await axiosClient.delete('/api/auth/api-key')
}

export async function updateProfileInfo(bio: string | null, linkedinUrl: string | null, githubUsername: string | null): Promise<void> {
  await axiosClient.put('/api/auth/profile-info', { bio, linkedin_url: linkedinUrl, github_username: githubUsername })
}

export async function updateUserAlias(alias: string | null): Promise<User> {
  const { data } = await axiosClient.put<User>('/api/auth/alias', { alias })
  return data
}

// --- GitHub Token ---

export async function getGitHubTokenStatus(): Promise<{ has_token: boolean }> {
  const { data } = await axiosClient.get<{ has_token: boolean }>('/api/auth/github-token-status')
  return data
}

export async function saveGitHubToken(githubToken: string): Promise<void> {
  await axiosClient.put('/api/auth/github-token', { github_token: githubToken })
}

export async function removeGitHubToken(): Promise<void> {
  await axiosClient.delete('/api/auth/github-token')
}
