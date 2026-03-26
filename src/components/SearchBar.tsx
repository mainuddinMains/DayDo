import { useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import { Highlight }    from '../lib/highlight'

const MAX_RESULTS = 8

export default function SearchBar() {
  const inputRef     = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const searchQuery    = useTaskStore((s) => s.searchQuery)
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery)
  const tasks          = useTaskStore((s) => s.tasks)

  const q       = searchQuery.trim().toLowerCase()
  const isOpen  = q.length > 0

  const results = isOpen
    ? tasks
        .filter((t) =>
          t.name.toLowerCase().includes(q) ||
          t.source.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        )
        .slice(0, MAX_RESULTS)
    : []

  const clear = useCallback(() => {
    setSearchQuery('')
    inputRef.current?.focus()
  }, [setSearchQuery])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setSearchQuery('')
        inputRef.current?.blur()
      }
    },
    [setSearchQuery],
  )

  /* Close dropdown on outside click (without clearing query) */
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div className="search-bar" ref={containerRef}>
      <div className="search-bar__input-wrap">
        <Search size={14} className="search-bar__icon" aria-hidden="true" />

        <input
          ref={inputRef}
          type="search"
          className="search-bar__input"
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search tasks"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          autoComplete="off"
          spellCheck={false}
        />

        {searchQuery && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={clear}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {results.length === 0 ? (
            <p className="search-dropdown__empty">No tasks match "{searchQuery}"</p>
          ) : (
            <ul className="search-dropdown__list">
              {results.map((task) => (
                <li key={task.id} className="search-result" role="option">
                  <span className="search-result__name">
                    <Highlight text={task.name} query={searchQuery} />
                  </span>

                  <div className="search-result__meta">
                    <span className="search-result__source">
                      <span
                        className="search-result__dot"
                        style={{ background: task.sourceColor }}
                      />
                      <Highlight text={task.source} query={searchQuery} />
                    </span>

                    {task.tags.length > 0 && (
                      <div className="search-result__tags">
                        {task.tags.map((tag) => (
                          <span key={tag} className="search-result__tag">
                            <Highlight text={tag} query={searchQuery} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="search-dropdown__footer">
            {results.length} result{results.length !== 1 ? 's' : ''}
            <span aria-hidden="true">·</span>
            <kbd>Esc</kbd> to clear
          </div>
        </div>
      )}
    </div>
  )
}
