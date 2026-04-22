import http from '../utils/http'

function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<any> as Promise<T>
}

export const getLeaveStatistics = (): Promise<any> => get('/statistics/leaves')
export const getLeaveTrend = (days = 30): Promise<any> => get('/statistics/leaves/trend', { days })
export const getUserStatistics = (): Promise<any> => get('/statistics/users')
export const getReviewerStudentsStatistics = (): Promise<any> => get('/statistics/reviewers/students')
