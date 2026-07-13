import { useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Product, Category, Ingredient } from '@/types';

interface ProductFormModalProps {
    open: boolean;
    onClose: () => void;
    product?: Product | null;
    categories: Category[];
    ingredients: Ingredient[];
}

export default function ProductFormModal({
    open,
    onClose,
    product,
    categories,
    ingredients,
}: ProductFormModalProps) {
    const isEdit = product !== null && product !== undefined;

    const form = useForm({
        nom: product?.nom || '',
        category_id: product?.category_id || '',
        code: product?.code || '',
        prix_vente: product?.prix_vente?.toString() || '',
        cout_revient: product?.cout_revient?.toString() || '',
        dlc: product?.dlc?.toString() || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...form.data,
            prix_vente: form.data.prix_vente
                ? Number(form.data.prix_vente)
                : null,
            cout_revient: form.data.cout_revient
                ? Number(form.data.cout_revient)
                : null,
            dlc: form.data.dlc ? Number(form.data.dlc) : null,
        };
        if (isEdit) {
            router.put(`/products/${product!.id}`, data, {
                onSuccess: () => onClose(),
                preserveScroll: true,
            });
        } else {
            router.post('/products', data, {
                onSuccess: () => onClose(),
                preserveScroll: true,
            });
        }
    };

    useEffect(() => {
        if (open) {
            if (isEdit && product) {
                form.setData({
                    nom: product.nom,
                    category_id: product.category_id.toString(),
                    code: product.code || '',
                    prix_vente: product.prix_vente?.toString() || '',
                    cout_revient: product.cout_revient?.toString() || '',
                    dlc: product.dlc?.toString() || '',
                });
            } else {
                form.reset();
                form.setData({
                    nom: '',
                    category_id: categories[0]?.id.toString() || '',
                    code: '',
                    prix_vente: '',
                    cout_revient: '',
                    dlc: '',
                });
            }
        }
    }, [open, product, categories]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal modal-form"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">
                        {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
                    </h3>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={16} strokeWidth={1.5} />
                    </button>
                </div>

                <form onSubmit={submit}>
                    <div className="modal-body">
                        {/* Nom */}
                        <div className="form-group">
                            <label className="form-label">
                                Nom du produit *
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ex: Croissant"
                                value={form.data.nom}
                                onChange={(e) =>
                                    form.setData('nom', e.target.value)
                                }
                                required
                            />
                            {form.errors.nom && (
                                <div className="form-error">
                                    {form.errors.nom}
                                </div>
                            )}
                        </div>

                        {/* Catégorie */}
                        <div className="form-group">
                            <label className="form-label">Catégorie *</label>
                            <select
                                className="form-select"
                                value={form.data.category_id}
                                onChange={(e) =>
                                    form.setData('category_id', e.target.value)
                                }
                                required
                            >
                                <option value="">Sélectionner...</option>
                                {categories.map((cat) => (
                                    <option
                                        key={cat.id}
                                        value={cat.id.toString()}
                                    >
                                        {cat.nom}
                                    </option>
                                ))}
                            </select>
                            {form.errors.category_id && (
                                <div className="form-error">
                                    {form.errors.category_id}
                                </div>
                            )}
                        </div>

                        {/* Code */}
                        <div className="form-group">
                            <label className="form-label">
                                Code (optionnel)
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ex: VIE-001"
                                value={form.data.code}
                                onChange={(e) =>
                                    form.setData('code', e.target.value)
                                }
                            />
                            {form.errors.code && (
                                <div className="form-error">
                                    {form.errors.code}
                                </div>
                            )}
                        </div>

                        {/* Prix vente */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Prix de vente (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={form.data.prix_vente}
                                    onChange={(e) =>
                                        form.setData(
                                            'prix_vente',
                                            e.target.value,
                                        )
                                    }
                                />
                                {form.errors.prix_vente && (
                                    <div className="form-error">
                                        {form.errors.prix_vente}
                                    </div>
                                )}
                            </div>

                            {/* Coût revient */}
                            <div className="form-group">
                                <label className="form-label">
                                    Coût de revient (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    readOnly
                                    placeholder="(Auto) Selon recette"
                                    value={form.data.cout_revient}
                                    onChange={(e) =>
                                        form.setData('cout_revient', '0')
                                    }
                                />
                                {form.errors.cout_revient && (
                                    <div className="form-error">
                                        {form.errors.cout_revient}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DLC — Durée de Limite de Consommation */}
                        <div className="form-group">
                            <label className="form-label">
                                Durée de conservation (DLC) <span className="optional">(optionnel)</span>
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="0"
                                className="form-input"
                                placeholder="Ex: 2 (jours)"
                                value={form.data.dlc}
                                onChange={(e) =>
                                    form.setData('dlc', e.target.value)
                                }
                            />
                            {form.errors.dlc && (
                                <div className="form-error">{form.errors.dlc}</div>
                            )}
                            <small className="form-hint">
                                Nombre de jours après production où le produit est consommable. Sera ajouté à la date de production pour calculer la DLC affichée.
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
                            {form.processing
                                ? 'Enregistrement...'
                                : isEdit
                                  ? 'Mettre à jour'
                                  : 'Créer le produit'}
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
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-error {
          font-size: 0.75rem;
          color: var(--danger);
          margin-top: 0.35rem;
        }
      `}</style>
        </div>
    );
}
