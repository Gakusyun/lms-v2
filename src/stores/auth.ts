import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('token'))
  const userId = ref<number | null>(localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null)
  const userName = ref<string | null>(localStorage.getItem('userName'))
  const userRole = ref<string | null>(localStorage.getItem('userRole'))

  // Initialize from localStorage on store creation (already done above)

  // Actions
  async function login(id: string, password: string) {
    const res: any = await authApi.login({ id, password } as any)
    token.value = res?.token ?? null
    userId.value = res?.userId ?? null
    userName.value = res?.userName ?? null
    userRole.value = res?.userRole ?? null

    if (token.value) {
      localStorage.setItem('token', token.value)
      if (userId.value != null) localStorage.setItem('userId', String(userId.value))
      if (userName.value != null) localStorage.setItem('userName', userName.value)
      if (userRole.value != null) localStorage.setItem('userRole', userRole.value)
    }

    return res
  }

  async function checkAuth() {
    if (!token.value) return false
    try {
      const res: any = await authApi.checkAuth()
      if (res?.userId != null) {
        userId.value = res.userId
        localStorage.setItem('userId', String(res.userId))
      }
      if (res?.userName != null) {
        userName.value = res.userName
        localStorage.setItem('userName', res.userName)
      }
      if (res?.userRole != null) {
        userRole.value = res.userRole
        localStorage.setItem('userRole', res.userRole)
      }
      return true
    } catch {
      await logout()
      return false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('userRole')
    }
  }

  function clearAuth() {
    token.value = null
    userId.value = null
    userName.value = null
    userRole.value = null
  }

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => userRole.value === 'admin')
  const isStudent = computed(() => userRole.value === 'student')
  const isReviewer = computed(() => userRole.value === 'reviewer')
  const isTeacher = computed(() => userRole.value === 'teacher')

  return {
    token,
    userId,
    userName,
    userRole,
    isAuthenticated,
    isAdmin,
    isStudent,
    isReviewer,
    isTeacher,
    login,
    checkAuth,
    logout,
    clearAuth,
  }
})
