import { useEffect } from 'react'
import { useForm, router } from '@inertiajs/react'
import { X } from 'lucide-react'
import type { Ingredient } from '@/types'

interface IngredientFormModalProps {
  open: boolean
  onClose: () => void
  ingredient?: Ingredient | null
}

export default function IngredientFormModal({
  open,
  onClose,
  ingredient,
}: IngredientFormModalProps) {
  const isEdit = ingredient !== null && ingredient !== undefined

  const form = useForm({
    nom: ingredient?.nom || '',
    unite: ingredient?.unite || '',
    prix_unitaire: ingredient?.prix_unitaire?.toString() || '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...form.data,
      prix_unitaire: form.data.prix_unitaire ? Number(form.data.prix_unitaire) : null,
    }
    if (isEdit) {
      router.put(`/ingredients/${ingredient!.id}`, data, {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    } else {
      router.post('/ingredients', data, {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  useEffect(() => {
    if (open) {
      if (isEdit && ingredient) {
        form.setData({
          nom: ingredient.nom,
          unite: ingredient.unite || '',
          prix_unitaire: ingredient.prix_unitaire?.toString() || '',
        })
      } else {
        form.reset()
        form.setData({
          nom: '',
          unite: '',
          prix_unitaire: '',
        })
      }
    }
  }, [open, ingredient])

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
            {isEdit ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {/* Nom */}
            <div className="form-group">
              <label className="form-label">Nom de l'ingrédient *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Farine T55"
                value={form.data.nom}
                onChange={(e) => form.setData('nom', e.target.value)}
                required
              />
              {form.errors.nom && (
                <div className="form-error">{form.errors.nom}</div>
              )}
            </div>

            {/* Unité */}
            <div className="form-group">
              <label className="form-label">Unité (optionnel)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: kg, L, unité"
                value={form.data.unite}
                onChange={(e) => form.setData('unite', e.target.value)}
              />
              {form.errors.unite && (
                <div className="form-error">{form.errors.unite}</div>
              )}
            </div>

            {/* Prix unitaire */}
            <div className="form-group">
              <label className="form-label">Prix unitaire (€)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="form-input"
                placeholder="0.0000"
                value={form.data.prix_unitaire}
                onChange={(e) => form.setData('prix_unitaire', e.target.value)}
              />
              {form.errors.prix_unitaire && (
                <div className="form-error">{form.errors.prix_unitaire}</div>
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
                  : 'Créer l\'ingrédient'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-form { max-width: 420px; }
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
