import http from '../utils/http'
import type { PaginatedResponse } from '../types'

// http interceptor unwraps response.data, so return type is the data directly
// We cast through `any` because TypeScript can't know the interceptor changed the return shape

export const getData = async <T>(endpoint: string, params?: Record<string, unknown>): Promise<T[]> => {
  return http.get(endpoint, { params }) as Promise<any> as Promise<T[]>
}

export const getPagedData = async <T>(endpoint: string, page: number, pageSize: number, extraParams?: Record<string, unknown>): Promise<PaginatedResponse<T>> => {
  const params = { page, page_size: pageSize, ...extraParams }
  return http.get(endpoint, { params }) as Promise<any> as Promise<PaginatedResponse<T>>
}
