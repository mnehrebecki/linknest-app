import type { Bookmark, BookmarkInput, BookmarkPage, Facets, Filters, Stats } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      message = typeof body.detail === 'string' ? body.detail : message
    } catch {
      // The response did not contain JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function fetchBookmarks(filters: Filters, offset = 0, limit = 12) {
  const params = new URLSearchParams({
    sort_by: filters.sort_by,
    order: filters.order,
    offset: String(offset),
    limit: String(limit),
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.favorite) params.set('favorite', 'true')
  return request<BookmarkPage>(`/api/bookmarks?${params}`)
}

export const fetchStats = () => request<Stats>('/api/bookmarks/stats')
export const fetchFacets = () => request<Facets>('/api/bookmarks/facets')

export const createBookmark = (input: BookmarkInput) =>
  request<Bookmark>('/api/bookmarks', { method: 'POST', body: JSON.stringify(input) })

export const updateBookmark = (id: number, input: Partial<BookmarkInput>) =>
  request<Bookmark>(`/api/bookmarks/${id}`, { method: 'PATCH', body: JSON.stringify(input) })

export const deleteBookmark = (id: number) =>
  request<void>(`/api/bookmarks/${id}`, { method: 'DELETE' })
