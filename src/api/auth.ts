import http from '../utils/http'
import type { LoginResponse, CheckAuthResponse, HealthCheckResponse } from '../types'

export const login = (payload: { id: string; password: string }): Promise<LoginResponse> => {
  return http.post('/login', payload) as Promise<any> as Promise<LoginResponse>
}

export const checkAuth = (): Promise<CheckAuthResponse> => {
  return http.get('/login/check') as Promise<any> as Promise<CheckAuthResponse>
}

export const logout = (): Promise<void> => {
  return http.post('/logout') as Promise<any> as Promise<void>
}

export const changePassword = (payload: { old_password: string; new_password: string }): Promise<void> => {
  return http.post('/change-password', payload) as Promise<any> as Promise<void>
}

export const changeUserPassword = (userId: number, payload: { old_password: string; new_password: string }): Promise<void> => {
  return http.post(`/change-password/${userId}`, payload) as Promise<any> as Promise<void>
}

export const checkSystemHealth = (): Promise<HealthCheckResponse> => {
  return http.get('/') as Promise<any> as Promise<HealthCheckResponse>
}

export const createAdmin = (payload: { admin_id: number; name: string; password: string }): Promise<any> => {
  return http.post('/create/admin', payload) as Promise<any>
}
