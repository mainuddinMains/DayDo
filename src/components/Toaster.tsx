import { createPortal } from 'react-dom'
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { useToastStore, type ToastType } from '../store/toastStore'

const ICONS: Record<ToastType, React.ReactNode> = {
  info:    <Info          size={15} strokeWidth={1.75} />,
  success: <CheckCircle2  size={15} strokeWidth={1.75} />,
  warning: <AlertTriangle size={15} strokeWidth={1.75} />,
  error:   <AlertCircle   size={15} strokeWidth={1.75} />,
}

export default function Toaster() {
  const toasts  = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return createPortal(
    <div className="toaster" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">{ICONS[t.type]}</span>
          <span className="toast__message">{t.message}</span>
          <button
            className="toast__close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
