import { usePage } from '@inertiajs/react'
import { useEffect, useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function FlashMessage() {
  const { flash, errors } = usePage().props as any
  const [visible, setVisible] = useState(true)

  // Construction du message d'erreur global depuis les erreurs de validation
  const validationError = useMemo(() => {
    if (!errors || typeof errors !== 'object') return null
    // Prendre la première erreur trouvée (array ou string)
    const firstError = Object.values(errors)[0]
    if (!firstError) return null
    return Array.isArray(firstError) ? firstError[0] : firstError
  }, [errors])

  const message = flash.error || validationError
  const success = flash.success

  useEffect(() => {
    setVisible(true)
    if (success || message) {
      const timer = setTimeout(() => setVisible(false), 4500)
      return () => clearTimeout(timer)
    }
  }, [success, message])

  useEffect(() => {
    // Injecter les styles CSS une seule fois
    if (typeof document === 'undefined') return
    if (document.getElementById('flash-message-styles')) return

    const styleEl = document.createElement('style')
    styleEl.id = 'flash-message-styles'
    styleEl.textContent = `
      .flash-bar {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 90%;
        max-width: 500px;
      }
      @media (min-width: 640px) {
        .flash-bar {
          top: 90px;
        }
      }
      .flash-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1.25rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.25s ease;
        animation: flashSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(10px);
      }
      .flash-item:hover {
        transform: scale(1.02);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
      }
      @keyframes flashSlideIn {
        from {
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .flash-success {
        background: linear-gradient(135deg, rgba(30, 158, 106, 0.95) 0%, rgba(26, 148, 102, 0.95) 100%);
        color: white;
        border: 1px solid rgba(30, 158, 106, 0.3);
      }
      .flash-error {
        background: linear-gradient(135deg, rgba(220, 60, 60, 0.95) 0%, rgba(200, 50, 50, 0.95) 100%);
        color: white;
        border: 1px solid rgba(220, 60, 60, 0.3);
      }
      .flash-item span {
        font-size: 0.85rem;
        font-weight: 600;
        line-height: 1.4;
      }
      .flash-item svg {
        flex-shrink: 0;
      }
    `
    document.head.appendChild(styleEl)
    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl)
      }
    }
  }, [])

  if (!visible || (!success && !message)) return null

  return (
    <div className="flash-bar">
      {success && (
        <div
          className="flash-item flash-success"
          onClick={() => setVisible(false)}
        >
          <CheckCircle size={16} strokeWidth={1.5} />
          <span>{success}</span>
        </div>
      )}
      {message && !success && (
        <div
          className="flash-item flash-error"
          onClick={() => setVisible(false)}
        >
          <AlertCircle size={16} strokeWidth={1.5} />
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
