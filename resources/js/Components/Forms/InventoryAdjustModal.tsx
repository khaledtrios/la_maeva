import { useEffect } from 'react'
import { useForm, router } from '@inertiajs/react'
import { X } from 'lucide-react'
import type { InventoryItem } from '@/types'

interface InventoryAdjustModalProps {
  open: boolean
  onClose: () => void
  item?: InventoryItem | null
}

export default function InventoryAdjustModal({
  open,
  onClose,
  item,
}: InventoryAdjustModalProps) {
  const isEdit = item !== null && item !== undefined

  const form = useForm({
    quantite: item?.quantite?.toString() || '',
    seuil_minimum: item?.seuil_minimum?.toString() || '',
    stock_max: item?.stock_max?.toString() || '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      quantite: Number(form.data.quantite),
      seuil_minimum: form.data.seuil_minimum ? Number(form.data.seuil_minimum) : null,
      stock_max: form.data.stock_max ? Number(form.data.stock_max) : null,
    }
    if (isEdit && item) {
      router.put(`/inventory/${item.ingredient_id}`, data, {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  useEffect(() => {
    if (open) {
      if (isEdit && item) {
        form.setData({
          quantite: Number(item.quantite).toString(),
          seuil_minimum: item.seuil_minimum !== null ? String(item.seuil_minimum) : '',
          stock_max: item.stock_max !== null ? String(item.stock_max) : '',
        })
      } else {
        form.reset()
        form.setData({ quantite: '', seuil_minimum: '', stock_max: '' })
      }
    }
  }, [open, item])

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

  const isLowStock = form.data.quantite && form.data.seuil_minimum && Number(form.data.quantite) < Number(form.data.seuil_minimum)
  const isHighStock = form.data.quantite && form.data.stock_max && Number(form.data.quantite) > Number(form.data.stock_max)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-form"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? 'Ajuster le stock' : 'Ajouter au stock'}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {/* Nom ingrédient (readonly) */}
            <div className="form-group">
              <label className="form-label">Ingrédient</label>
              <input
                type="text"
                className="form-input"
                value={item?.ingredient?.nom || ''}
                disabled
              />
            </div>

            {/* Unité (readonly) */}
            {item?.ingredient?.unite && (
              <div className="form-group">
                <label className="form-label">Unité</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.ingredient.unite}
                  disabled
                />
              </div>
            )}

            {/* Quantité */}
            <div className="form-group">
              <label className="form-label">Quantité *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="form-input"
                placeholder="Ex: 45.5"
                value={form.data.quantite}
                onChange={(e) => form.setData('quantite', e.target.value)}
                required
                autoFocus
              />
              {form.errors.quantite && (
                <div className="form-error">{form.errors.quantite}</div>
              )}
            </div>

            {/* Seuil minimum */}
            <div className="form-group">
              <label className="form-label">
                Seuil minimum d'alerte <span className="optional">(optionnel)</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="form-input"
                placeholder="Ex: 20.0"
                value={form.data.seuil_minimum}
                onChange={(e) => form.setData('seuil_minimum', e.target.value)}
              />
              {form.errors.seuil_minimum && (
                <div className="form-error">{form.errors.seuil_minimum}</div>
              )}
              <small className="form-hint">
                Déclenchera une alerte si la quantité est inférieure
              </small>
            </div>

            {/* Stock maximum */}
            <div className="form-group">
              <label className="form-label">
                Stock maximum <span className="optional">(optionnel)</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="form-input"
                placeholder="Ex: 50.0"
                value={form.data.stock_max}
                onChange={(e) => form.setData('stock_max', e.target.value)}
              />
              {form.errors.stock_max && (
                <div className="form-error">{form.errors.stock_max}</div>
              )}
              <small className="form-hint">
                Déclenchera une alerte si la quantité dépasse cette valeur
              </small>
            </div>

            {/* Preview du statut stock */}
            {form.data.quantite && (form.data.seuil_minimum || form.data.stock_max) && (
              <div className="stock-preview-container">
                {form.data.seuil_minimum && Number(form.data.seuil_minimum) > 0 && (
                  <div className={`stock-preview ${isLowStock ? 'stock-preview--danger' : 'stock-preview--success'}`}>
                    {isLowStock
                      ? `⚠️ Stock bas (${Number(form.data.quantite).toFixed(2)} < ${Number(form.data.seuil_minimum).toFixed(2)})`
                      : `✅ Stock OK min (${Number(form.data.quantite).toFixed(2)} ≥ ${Number(form.data.seuil_minimum).toFixed(2)})`
                    }
                  </div>
                )}
                {form.data.stock_max && Number(form.data.stock_max) > 0 && (
                  <div className={`stock-preview ${isHighStock ? 'stock-preview--warning' : 'stock-preview--success'}`}>
                    {isHighStock
                      ? `⚠️ Sur-stock (${Number(form.data.quantite).toFixed(2)} > ${Number(form.data.stock_max).toFixed(2)})`
                      : `✅ Stock OK max (${Number(form.data.quantite).toFixed(2)} ≤ ${Number(form.data.stock_max).toFixed(2)})`
                    }
                  </div>
                )}
              </div>
            )}
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
                  : 'Ajouter au stock'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-form { max-width: 480px; }
        .form-group { margin-bottom: 1rem; }
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-2);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
        }
        .form-label .optional {
          font-weight: 400;
          color: var(--text-3);
          text-transform: none;
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
        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .form-error {
          font-size: 0.75rem;
          color: var(--danger);
          margin-top: 0.35rem;
        }
        .form-hint {
          display: block;
          font-size: 0.7rem;
          color: var(--text-3);
          margin-top: 0.25rem;
        }
        .stock-preview {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
          margin-top: 0.5rem;
        }
        .stock-preview--success {
          background: rgba(30, 158, 106, 0.1);
          color: var(--success);
          border: 1px solid rgba(30, 158, 106, 0.2);
        }
        .stock-preview--danger {
          background: rgba(214, 59, 59, 0.1);
          color: var(--danger);
          border: 1px solid rgba(214, 59, 59, 0.2);
        }
        .stock-preview--warning {
          background: rgba(232, 116, 42, 0.1);
          color: var(--orange);
          border: 1px solid rgba(232, 116, 42, 0.2);
        }
        .stock-preview-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  )
}
