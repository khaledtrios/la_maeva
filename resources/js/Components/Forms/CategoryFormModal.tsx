import { useEffect } from 'react'
import { useForm, router } from '@inertiajs/react'
import { X } from 'lucide-react'
import type { Category } from '@/types'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  category?: Category | null
}

export default function CategoryFormModal({
  open,
  onClose,
  category,
}: CategoryFormModalProps) {
  const isEdit = category !== null && category !== undefined

  const form = useForm({
    nom: category?.nom || '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      router.put(`/categories/${category!.id}`, form.data, {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    } else {
      router.post('/categories', form.data, {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  useEffect(() => {
    if (open) {
      if (isEdit && category) {
        form.setData({ nom: category.nom })
      } else {
        form.reset()
        form.setData({ nom: '' })
      }
    }
  }, [open, category])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-form"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {/* Nom */}
            <div className="form-group">
              <label className="form-label">Nom de la catégorie *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Viennoiseries"
                value={form.data.nom}
                onChange={(e) => form.setData('nom', e.target.value)}
                required
              />
              {form.errors.nom && (
                <div className="form-error">{form.errors.nom}</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-neutral"
              onClick={onClose}
              disabled={form.processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={form.processing}
            >
              {form.processing
                ? 'Enregistrement...'
                : isEdit
                  ? 'Mettre à jour'
                  : 'Créer la catégorie'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-form { max-width: 400px; }
        .form-group { margin-bottom: 1rem; }
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-2);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
        }
        .form-input,
        .form-select {
          width: 100%;
          padding: 0.6rem 0.85rem;
          font-size: 0.9rem;
          background: var(--bg-card-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-1);
          transition: all 0.2s;
        }
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
        }
        .form-input::placeholder { color: var(--text-3); }
        .form-error {
          font-size: 0.75rem;
          color: var(--danger);
          margin-top: 0.35rem;
        }
      `}</style>
    </div>
  )
}
