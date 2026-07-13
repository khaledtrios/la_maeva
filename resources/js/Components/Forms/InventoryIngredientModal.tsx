import { useEffect } from 'react'
import { useForm, router } from '@inertiajs/react'
import { X } from 'lucide-react'

interface InventoryIngredientModalProps {
  open: boolean
  onClose: () => void
}

export default function InventoryIngredientModal({
  open,
  onClose,
}: InventoryIngredientModalProps) {
  const form = useForm({
    nom: '',
    unite: '',
    prix_unitaire: '',
    quantite: '',
    seuil_minimum: '',
    stock_max: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...form.data,
      prix_unitaire: form.data.prix_unitaire ? Number(form.data.prix_unitaire) : null,
      quantite: form.data.quantite ? Number(form.data.quantite) : 0,
      seuil_minimum: form.data.seuil_minimum ? Number(form.data.seuil_minimum) : null,
      stock_max: form.data.stock_max ? Number(form.data.stock_max) : null,
    }
    router.post('/inventory/create-ingredient', data, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
      preserveScroll: true,
    })
  }

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open])

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
          <h3 className="modal-title">Nouvel ingrédient</h3>
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
                autoFocus
              />
              {form.errors.nom && (
                <div className="form-error">{form.errors.nom}</div>
              )}
            </div>

            {/* Unité */}
            <div className="form-group">
              <label className="form-label">
                Unité <span className="optional">(optionnel)</span>
              </label>
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
              <label className="form-label">
                Prix unitaire (€) <span className="optional">(optionnel)</span>
              </label>
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

            {/* Quantité initiale */}
            <div className="form-group">
              <label className="form-label">Quantité initiale *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="form-input"
                placeholder="Ex: 45.5"
                value={form.data.quantite}
                onChange={(e) => form.setData('quantite', e.target.value)}
                required
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
              {form.processing ? 'Enregistrement...' : 'Créer et ajouter'}
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
      `}</style>
    </div>
  )
}
