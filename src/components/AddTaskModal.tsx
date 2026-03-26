import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { X, Plus } from 'lucide-react'
import { useModalStore }  from '../store/modalStore'
import { useTaskStore }   from '../store/taskStore'
import { SOURCE_COLORS }  from '../store/taskStore'
import type { Priority, Source } from '../types'

/* ── Constants ─────────────────────────────────────────────────────────────── */

const SOURCES: Source[] = ['DayDo', 'Google Tasks', 'Slack', 'Notion', 'Jira']

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'med',  label: 'Med'  },
  { value: 'low',  label: 'Low'  },
]

const todayISO = new Date().toISOString().slice(0, 10)

/* ── Tag pill input ────────────────────────────────────────────────────────── */

function TagInput({
  tags,
  onChange,
}: {
  tags:     string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const commit = () => {
    const val = input.trim().toLowerCase().replace(/\s+/g, '-')
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <span key={tag} className="tag-pill">
          {tag}
          <button
            type="button"
            className="tag-pill__remove"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        className="tag-input__field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? 'Type and press Enter…' : ''}
        aria-label="Add tag"
      />
    </div>
  )
}

/* ── Form state ────────────────────────────────────────────────────────────── */

interface FormState {
  name:     string
  source:   Source
  priority: Priority
  dueDate:  string
  time:     string
  tags:     string[]
}

const DEFAULT_FORM: FormState = {
  name:     '',
  source:   'DayDo',
  priority: 'med',
  dueDate:  todayISO,
  time:     '09:00',
  tags:     [],
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */

function AddTaskModalInner() {
  const closeAddTask = useModalStore((s) => s.closeAddTask)
  const addTask      = useTaskStore((s)  => s.addTask)

  const [form,      setForm]      = useState<FormState>(DEFAULT_FORM)
  const [nameError, setNameError] = useState('')
  const [closing,   setClosing]   = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setClosing(true)
    window.setTimeout(closeAddTask, 220)
  }

  /* Focus name on open */
  useEffect(() => { nameRef.current?.focus() }, [])

  /* Escape to close */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setClosing(true)
      window.setTimeout(closeAddTask, 220)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeAddTask])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Task name is required.')
      nameRef.current?.focus()
      return
    }

    /* Format time for display, e.g. "09:00" → "09:00 AM" */
    const [hRaw, min] = form.time.split(':').map(Number)
    const ampm  = hRaw >= 12 ? 'PM' : 'AM'
    const h12   = hRaw % 12 === 0 ? 12 : hRaw % 12
    const displayTime = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`

    addTask({
      name:        form.name.trim(),
      source:      form.source,
      sourceColor: SOURCE_COLORS[form.source],
      priority:    form.priority,
      dueDate:     form.dueDate,
      time:        displayTime,
      tags:        form.tags,
      done:        false,
    })

    handleClose()
  }

  return (
    <div
      className={`modal-overlay ${closing ? 'modal-overlay--out' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`modal ${closing ? 'modal--out' : ''}`}>

        {/* Header */}
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">New Task</h2>
          <button className="modal__close" onClick={handleClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>

          {/* Task name */}
          <div className="form-field">
            <label className="form-label" htmlFor="task-name">
              Task name <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              ref={nameRef}
              id="task-name"
              className={`form-input ${nameError ? 'form-input--error' : ''}`}
              type="text"
              placeholder="What needs to get done?"
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value)
                if (nameError) setNameError('')
              }}
              autoComplete="off"
            />
            {nameError && (
              <span className="form-error" role="alert">{nameError}</span>
            )}
          </div>

          {/* Source + Priority row */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="task-source">Source</label>
              <div className="form-select-wrap">
                <select
                  id="task-source"
                  className="form-select"
                  value={form.source}
                  onChange={(e) => set('source', e.target.value as Source)}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {/* Colour dot preview */}
                <span
                  className="form-select-dot"
                  style={{ background: SOURCE_COLORS[form.source] }}
                />
              </div>
            </div>

            <div className="form-field">
              <span className="form-label" id="priority-group-label">Priority</span>
              <div
                className="priority-group"
                role="group"
                aria-labelledby="priority-group-label"
              >
                {PRIORITIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`priority-btn priority-btn--${value} ${form.priority === value ? 'priority-btn--active' : ''}`}
                    onClick={() => set('priority', value)}
                    aria-pressed={form.priority === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due date + Time row */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="task-due">Due date</label>
              <input
                id="task-due"
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="task-time">Time</label>
              <input
                id="task-time"
                className="form-input"
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-field">
            <span className="form-label">Tags</span>
            <TagInput
              tags={form.tags}
              onChange={(tags) => set('tags', tags)}
            />
          </div>

          {/* Actions */}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              <Plus size={15} strokeWidth={2} />
              Add Task
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

/* ── Portal wrapper ────────────────────────────────────────────────────────── */

export default function AddTaskModal() {
  const isOpen = useModalStore((s) => s.addTaskOpen)
  if (!isOpen) return null
  return createPortal(<AddTaskModalInner />, document.body)
}
