import { ArrowDownAZ, Filter, Heart, Search, X } from 'lucide-react'
import type { Facets, Filters } from '../types'

interface Props {
  filters: Filters
  facets: Facets
  onChange: (filters: Filters) => void
}

export function FilterBar({ filters, facets, onChange }: Props) {
  const hasFilters = filters.search || filters.category || filters.tag || filters.favorite

  return (
    <div className="filter-bar">
      <div className="search-box">
        <Search size={18} />
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search bookmarks…"
          aria-label="Search bookmarks"
        />
        {filters.search && (
          <button onClick={() => onChange({ ...filters, search: '' })} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filter-controls">
        <label className="select-control">
          <Filter size={16} />
          <select
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {facets.categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>

        <label className="select-control">
          <ArrowDownAZ size={16} />
          <select
            value={`${filters.sort_by}:${filters.order}`}
            onChange={(event) => {
              const [sort_by, order] = event.target.value.split(':') as [Filters['sort_by'], Filters['order']]
              onChange({ ...filters, sort_by, order })
            }}
            aria-label="Sort bookmarks"
          >
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="updated_at:desc">Recently updated</option>
            <option value="title:asc">Title A–Z</option>
            <option value="title:desc">Title Z–A</option>
          </select>
        </label>

        <button
          className={`favorite-filter ${filters.favorite ? 'active' : ''}`}
          onClick={() => onChange({ ...filters, favorite: !filters.favorite })}
        >
          <Heart size={16} fill={filters.favorite ? 'currentColor' : 'none'} /> Favorites
        </button>

        {hasFilters && (
          <button
            className="clear-filters"
            onClick={() => onChange({ ...filters, search: '', category: '', tag: '', favorite: false })}
          >
            Clear
          </button>
        )}
      </div>

      {filters.tag && (
        <div className="active-filter">
          Tag: <strong>#{filters.tag}</strong>
          <button onClick={() => onChange({ ...filters, tag: '' })} aria-label="Remove tag filter"><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
