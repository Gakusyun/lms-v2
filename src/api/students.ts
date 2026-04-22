import http from '../utils/http'
import type { Course, StudentCourse, StudentCourseCreate, StudentCourseResponse } from '../types'

function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<any> as Promise<T>
}
function post<T>(url: string, data?: unknown): Promise<T> {
  return http.post(url, data) as Promise<any> as Promise<T>
}

export const getAllCourses = (): Promise<Course[]> => get('/courses')
export const getStudentCourses = (studentId: number): Promise<StudentCourse[]> => get(`/student-courses/student/${studentId}`)
export const getCourseStudents = (courseId: number): Promise<StudentCourseResponse[]> => get(`/student-courses/course/${courseId}`)
export const getCourseEnrollmentCount = (courseId: number): Promise<number> => get(`/student-courses/course/${courseId}/count`)
export const createStudentCourse = (payload: StudentCourseCreate): Promise<StudentCourseResponse> => post('/student-courses', payload)
export const deleteStudentCourse = (studentId: number, courseId: number): Promise<void> =>
  http.delete(`/student-courses/student/${studentId}/course/${courseId}`) as Promise<any> as Promise<void>

export const downloadStudentImportTemplate = (): Promise<Blob> =>
  http.get('/students/import/template', { responseType: 'blob' }) as Promise<any> as Promise<Blob>
export const importStudents = (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  return post('/students/import', formData)
}
