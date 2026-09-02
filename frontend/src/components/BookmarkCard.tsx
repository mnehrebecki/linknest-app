import { ExternalLink, Heart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Bookmark } from '../types'

interface Props {
  bookmark: Bookmark
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmark: Bookmark) => void
  onToggleFavorite: (bookmark: Bookmark) => void
  onSelectTag: (tag: string) => void
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSelectTag,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <article className="bookmark-card">
      <div className="card-topline">
        <span className="category-pill">{bookmark.category || 'Uncategorized'}</span>
        <div className="card-actions">
          <button
            className={`icon-button favorite-button ${bookmark.is_favorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(bookmark)}
            aria-label={bookmark.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} fill={bookmark.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <div className="menu-wrap" ref={menuRef}>
            <button
              className="icon-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Bookmark actions"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={20} />
            </button>
            {menuOpen && (
              <div className="action-menu">
                <button onClick={() => onEdit(bookmark)}><Pencil size={15} /> Edit</button>
                <button className="danger" onClick={() => onDelete(bookmark)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2>{bookmark.title}</h2>
        <a className="domain" href={bookmark.url} target="_blank" rel="noreferrer">
          {hostname(bookmark.url)} <ExternalLink size={13} />
        </a>
      </div>

      <p className="description">
        {bookmark.description || 'No description added yet.'}
      </p>

      <div className="tag-list">
        {bookmark.tags.map((tag) => (
          <button key={tag} onClick={() => onSelectTag(tag)}>#{tag}</button>
        ))}
      </div>

      <div className="card-footer">
        <span>Saved {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(bookmark.created_at))}</span>
        <a href={bookmark.url} target="_blank" rel="noreferrer" aria-label={`Open ${bookmark.title}`}>
          Visit <ExternalLink size={14} />
        </a>
      </div>
    </article>
  )
}
