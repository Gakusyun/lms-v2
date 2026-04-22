import http from '../utils/http'

function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<any> as Promise<T>
}
function post<T>(url: string, data?: unknown): Promise<T> {
  return http.post(url, data) as Promise<any> as Promise<T>
}

export const getNotifications = (params?: Record<string, unknown>): Promise<any> => get('/notifications', params)
export const getUnreadCount = (): Promise<number> => get('/notifications/unread-count')
export const markNotificationRead = (id: number): Promise<void> => post(`/notifications/${id}/read`)
export const markAllNotificationsRead = (): Promise<void> => post('/notifications/read-all')
