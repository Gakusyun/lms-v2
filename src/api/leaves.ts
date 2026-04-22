import http from '../utils/http'
import type { Leave, LeaveCreate } from '../types'

function post<T>(url: string, data?: unknown): Promise<T> {
  return http.post(url, data) as Promise<any> as Promise<T>
}
function put<T>(url: string, data?: unknown): Promise<T> {
  return http.put(url, data) as Promise<any> as Promise<T>
}
function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<any> as Promise<T>
}

export const createLeave = (payload: LeaveCreate): Promise<Leave> => post('/leaves', payload)
export const editLeave = (leaveId: number, payload: Partial<LeaveCreate>): Promise<Leave> => put(`/leaves/edit/${leaveId}`, payload)
export const approveLeave = (leaveId: number, _auditRemarks = ''): Promise<Leave> => post(`/leaves/approve/${leaveId}`, null)
export const rejectLeave = (leaveId: number, _auditRemarks = ''): Promise<Leave> => post(`/leaves/reject/${leaveId}`, null)
export const cancelLeave = (leaveId: number): Promise<Leave> => post(`/leaves/cancel/${leaveId}`)
export const closeOffLeave = (leaveId: number, _penaltyDays?: number): Promise<Leave> => post(`/leaves/close-off/${leaveId}`, null)
export const guaranteeLeave = (leaveId: number): Promise<Leave> => post(`/leaves/guarantee/${leaveId}`)

export const getLeaveQRCode = (leaveId: number): Promise<string> => get(`/leaves/${leaveId}/qr`)
export const verifyQRCode = (qrContent: string): Promise<any> => post('/leaves/verify-qr', { qr_content: qrContent })
export const getApprovalRecommendation = (leaveId: number): Promise<any> => get(`/leaves/${leaveId}/recommendation`)

export const uploadLeaveFile = (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  return post('/leaves/upload', formData)
}
export const uploadLeaveFiles = (leaveId: number, files: File[]): Promise<any> => {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  return post(`/leaves/${leaveId}/upload`, formData)
}
export const exportLeavesJSON = (): Promise<Blob> => http.get('/export/leaves/json', { responseType: 'blob' }) as Promise<any> as Promise<Blob>
export const exportStudentsJSON = (): Promise<Blob> => http.get('/export/students/json', { responseType: 'blob' }) as Promise<any> as Promise<Blob>
