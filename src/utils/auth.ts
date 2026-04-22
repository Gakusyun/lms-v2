import { checkAuth } from '../api/auth'

// Check if the user is authenticated by validating the token and refreshing user info
export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem('token')
  if (!token) {
    return false
  }

  try {
    const response = await checkAuth()
    if (response?.role && response?.id != null && response?.name) {
      localStorage.setItem('role', response.role)
      localStorage.setItem('id', String(response.id))
      localStorage.setItem('name', response.name)
    }
    return true
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('id')
    localStorage.removeItem('name')
    return false
  }
}

// Get user information from localStorage
export const getUserInfo = (): { role: string; id: number; name: string } | null => {
  const role = localStorage.getItem('role')
  const id = localStorage.getItem('id')
  const name = localStorage.getItem('name')
  return role && id && name
    ? { role, id: Number(id), name }
    : null
}

// Clear authentication data from storage
export const clearAuth = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('id')
  localStorage.removeItem('name')
}
