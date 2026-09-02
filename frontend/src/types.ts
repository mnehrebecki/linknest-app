export interface Bookmark {
  id: number
  title: string
  url: string
  description: string | null
  category: string | null
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface BookmarkInput {
  title: string
  url: string
  description: string
  category: string
  tags: string[]
  is_favorite: boolean
}

export interface BookmarkPage {
  items: Bookmark[]
  total: number
  limit: number
  offset: number
}

export interface Stats {
  total: number
  favorites: number
  categories: number
  tags: number
}

export interface Facets {
  categories: string[]
  tags: string[]
}

export interface Filters {
  search: string
  category: string
  tag: string
  favorite: boolean
  sort_by: 'created_at' | 'updated_at' | 'title'
  order: 'asc' | 'desc'
}
