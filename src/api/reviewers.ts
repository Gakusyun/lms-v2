import http from '../utils/http'
import type { Reviewer } from '../types'

function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<any> as Promise<T>
}

export const getReviewers = (): Promise<Reviewer[]> => get('/reviewers')
