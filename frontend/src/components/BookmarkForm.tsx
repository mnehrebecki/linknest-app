import { Heart, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import type { Bookmark, BookmarkInput } from '../types'

interface Props {
  bookmark: Bookmark | null
  onClose: () => void
  onSave: (input: BookmarkInput) => Promise<void>
}

const emptyForm: BookmarkInput = {
  title: '',
  url: '',
  description: '',
  category: '',
  tags: [],
  is_favorite: false,
}

export function BookmarkForm({ bookmark, onClose, onSave }: Props) {
  const [form, setForm] = useState<BookmarkInput>(() => bookmark ? {
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description ?? '',
    category: bookmark.category ?? '',
    tags: bookmark.tags,
    is_favorite: bookmark.is_favorite,
  } : emptyForm)
  const [tagsText, setTagsText] = useState(() => bookmark?.tags.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const tags = tagsText.split(',').map((tag) => tag.trim()).filter(Boolean)
      await onSave({ ...form, tags })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the bookmark')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{bookmark ? 'Update your collection' : 'Grow your collection'}</p>
            <h2 id="form-title">{bookmark ? 'Edit bookmark' : 'Add a bookmark'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X /></button>
        </div>

        <form onSubmit={submit}>
          <label>
            Title
            <input
              autoFocus
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Kubernetes documentation"
            />
          </label>
          <label>
            URL
            <input
              required
              type="url"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://example.com"
            />
          </label>
          <div className="form-row">
            <label>
              Category
              <input
                maxLength={80}
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="DevOps"
              />
            </label>
            <label>
              Tags
              <input
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="kubernetes, learning"
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What makes this link useful?"
            />
          </label>

          <label className="favorite-check">
            <input
              type="checkbox"
              checked={form.is_favorite}
              onChange={(event) => setForm({ ...form, is_favorite: event.target.checked })}
            />
            <Heart size={17} /> Mark as favorite
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'Saving…' : bookmark ? 'Save changes' : 'Add bookmark'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
