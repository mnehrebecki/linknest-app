import { Bookmark as BookmarkIcon, Heart, Layers3, Plus, Tags } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createBookmark,
  deleteBookmark,
  fetchBookmarks,
  fetchFacets,
  fetchStats,
  updateBookmark,
} from './api'
import { BookmarkCard } from './components/BookmarkCard'
import { BookmarkForm } from './components/BookmarkForm'
import { FilterBar } from './components/FilterBar'
import type { Bookmark, BookmarkInput, Facets, Filters, Stats } from './types'

const PAGE_SIZE = 12
const initialFilters: Filters = {
  search: '',
  category: '',
  tag: '',
  favorite: false,
  sort_by: 'created_at',
  order: 'desc',
}

export default function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, favorites: 0, categories: 0, tags: 0 })
  const [facets, setFacets] = useState<Facets>({ categories: [], tags: [] })
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Bookmark | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [page, nextStats, nextFacets] = await Promise.all([
        fetchBookmarks(filters, offset, PAGE_SIZE),
        fetchStats(),
        fetchFacets(),
      ])
      setBookmarks(page.items)
      setTotal(page.total)
      setStats(nextStats)
      setFacets(nextFacets)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load bookmarks')
    } finally {
      setLoading(false)
    }
  }, [filters, offset])

  useEffect(() => {
    const timeout = window.setTimeout(load, filters.search ? 250 : 0)
    return () => window.clearTimeout(timeout)
  }, [load, filters.search])

  function changeFilters(next: Filters) {
    setOffset(0)
    setFilters(next)
  }

  async function save(input: BookmarkInput) {
    if (editing) await updateBookmark(editing.id, input)
    else await createBookmark(input)
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  async function remove(bookmark: Bookmark) {
    if (!window.confirm(`Delete “${bookmark.title}”?`)) return
    try {
      await deleteBookmark(bookmark.id)
      if (offset > 0 && bookmarks.length === 1) setOffset(Math.max(0, offset - PAGE_SIZE))
      else await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete bookmark')
    }
  }

  async function toggleFavorite(bookmark: Bookmark) {
    try {
      await updateBookmark(bookmark.id, { is_favorite: !bookmark.is_favorite })
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update favorite')
    }
  }

  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="LinkNest home">
          <span className="brand-mark"><BookmarkIcon size={21} fill="currentColor" /></span>
          <span>LinkNest</span>
        </a>
        <button className="button primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus size={18} /> Add bookmark
        </button>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Your useful corner of the internet</p>
          <h1>Everything worth finding,<br /><span>easy to find again.</span></h1>
          <p className="hero-copy">Save the resources that move your work forward. Organize them once, reach them in seconds.</p>
        </section>

        <section className="stats-grid" aria-label="Bookmark statistics">
          <div><span className="stat-icon violet"><BookmarkIcon /></span><p><strong>{stats.total}</strong>Total links</p></div>
          <div><span className="stat-icon rose"><Heart /></span><p><strong>{stats.favorites}</strong>Favorites</p></div>
          <div><span className="stat-icon blue"><Layers3 /></span><p><strong>{stats.categories}</strong>Categories</p></div>
          <div><span className="stat-icon amber"><Tags /></span><p><strong>{stats.tags}</strong>Unique tags</p></div>
        </section>

        <FilterBar filters={filters} facets={facets} onChange={changeFilters} />

        <div className="collection-heading">
          <div>
            <p className="eyebrow">Collection</p>
            <h2>{filters.favorite ? 'Favorite bookmarks' : filters.category || 'All bookmarks'}</h2>
          </div>
          {!loading && <span>{total} {total === 1 ? 'result' : 'results'}</span>}
        </div>

        {error && (
          <div className="error-banner">
            <div><strong>Something went wrong</strong><span>{error}</span></div>
            <button className="button secondary" onClick={load}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="bookmark-grid" aria-label="Loading bookmarks">
            {Array.from({ length: 6 }).map((_, index) => <div className="skeleton" key={index} />)}
          </div>
        ) : bookmarks.length ? (
          <div className="bookmark-grid">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={(item) => { setEditing(item); setFormOpen(true) }}
                onDelete={remove}
                onToggleFavorite={toggleFavorite}
                onSelectTag={(tag) => changeFilters({ ...filters, tag })}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span><BookmarkIcon size={30} /></span>
            <h2>{stats.total ? 'No bookmarks match these filters' : 'Your collection starts here'}</h2>
            <p>{stats.total ? 'Try clearing a filter or using another search.' : 'Save your first useful link and keep it within reach.'}</p>
            {stats.total ? (
              <button className="button secondary" onClick={() => changeFilters(initialFilters)}>Clear filters</button>
            ) : (
              <button className="button primary" onClick={() => setFormOpen(true)}><Plus size={18} /> Add first bookmark</button>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="pagination" aria-label="Pagination">
            <button className="button secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Previous</button>
            <span>Page {pageNumber} of {totalPages}</span>
            <button className="button secondary" disabled={pageNumber >= totalPages} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</button>
          </nav>
        )}
      </main>

      <footer>LinkNest · Built as a hands-on DevOps project</footer>

      {formOpen && (
        <BookmarkForm
          bookmark={editing}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSave={save}
        />
      )}
    </div>
  )
}
