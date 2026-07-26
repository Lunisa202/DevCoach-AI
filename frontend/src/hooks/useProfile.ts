import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { setCredentials } from '../store/slices/authSlice'
import {
  updateProfile,
  updatePassword,
  updateAvatar,
  removeAvatar,
  getApiKeyStatus,
  saveApiKey,
  removeApiKey,
  updateProfileInfo,
  updateUserAlias,
  getGitHubTokenStatus,
  saveGitHubToken,
  removeGitHubToken,
} from '../services/profileService'
import type { RootState } from '../store'
import type { User } from '../types/auth'

export function useProfile() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [isLoading, setIsLoading] = useState(false)

  const updateUser = (updatedUser: User) => {
    if (token) {
      dispatch(setCredentials({ token, user: updatedUser }))
    }
  }

  const handleUpdateProfile = async (fullName: string) => {
    setIsLoading(true)
    try {
      const { user: updated } = await updateProfile(fullName)
      updateUser(updated)
      toast.success('Nombre actualizado')
    } catch {
      toast.error('No se pudo actualizar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true)
    try {
      await updatePassword(currentPassword, newPassword)
      toast.success('Contraseña actualizada')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'No se pudo cambiar la contraseña'
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAvatar = async (avatarUrl: string) => {
    setIsLoading(true)
    try {
      const { user: updated } = await updateAvatar(avatarUrl)
      updateUser(updated)
      toast.success('Avatar actualizado')
    } catch {
      toast.error('No se pudo actualizar el avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsLoading(true)
    try {
      await removeAvatar()
      if (user) {
        updateUser({ ...user, avatar_url: null } as User)
      }
      toast.success('Avatar eliminado')
    } catch {
      toast.error('No se pudo eliminar el avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetApiKeyStatus = async (): Promise<boolean> => {
    try {
      const { has_key } = await getApiKeyStatus()
      return has_key
    } catch {
      return false
    }
  }

  const handleSaveApiKey = async (key: string) => {
    setIsLoading(true)
    try {
      await saveApiKey(key)
      toast.success('API Key guardada')
      window.dispatchEvent(new Event('api-key-saved'))
    } catch {
      toast.error('No se pudo guardar la API Key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveApiKey = async () => {
    setIsLoading(true)
    try {
      await removeApiKey()
      toast.success('API Key eliminada — se usará la del sistema')
    } catch {
      toast.error('No se pudo eliminar la API Key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfileInfo = async (bio: string | null, linkedinUrl: string | null, githubUsername: string | null) => {
    setIsLoading(true)
    try {
      await updateProfileInfo(bio, linkedinUrl, githubUsername)
      if (user) {
        updateUser({ ...user, bio, linkedin_url: linkedinUrl, github_username: githubUsername } as User)
      }
      toast.success('Perfil actualizado')
    } catch {
      toast.error('No se pudo actualizar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAlias = async (alias: string | null) => {
    setIsLoading(true)
    try {
      const updated = await updateUserAlias(alias)
      updateUser(updated)
      toast.success(alias ? 'Alias guardado' : 'Alias eliminado')
      return updated
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'No se pudo actualizar el alias'
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetGitHubTokenStatus = async (): Promise<boolean> => {
    try {
      const { has_token } = await getGitHubTokenStatus()
      return has_token
    } catch {
      return false
    }
  }

  const handleSaveGitHubToken = async (token: string) => {
    setIsLoading(true)
    try {
      await saveGitHubToken(token)
      toast.success('GitHub Token guardado')
    } catch {
      toast.error('No se pudo guardar el GitHub Token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveGitHubToken = async () => {
    setIsLoading(true)
    try {
      await removeGitHubToken()
      toast.success('GitHub Token eliminado — se usará el del sistema')
    } catch {
      toast.error('No se pudo eliminar el GitHub Token')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    token,
    isLoading,
    updateProfile: handleUpdateProfile,
    updatePassword: handleUpdatePassword,
    updateAvatar: handleUpdateAvatar,
    removeAvatar: handleRemoveAvatar,
    getApiKeyStatus: handleGetApiKeyStatus,
    saveApiKey: handleSaveApiKey,
    removeApiKey: handleRemoveApiKey,
    updateProfileInfo: handleUpdateProfileInfo,
    updateAlias: handleUpdateAlias,
    getGitHubTokenStatus: handleGetGitHubTokenStatus,
    saveGitHubToken: handleSaveGitHubToken,
    removeGitHubToken: handleRemoveGitHubToken,
  }
}
