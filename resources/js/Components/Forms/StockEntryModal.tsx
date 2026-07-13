import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { X, Plus } from 'lucide-react';
import type { Ingredient } from '@/types';

interface StockEntryModalProps {
    open: boolean;
    onClose: () => void;
    ingredients: Ingredient[];
}

export default function StockEntryModal({
    open,
    onClose,
    ingredients,
}: StockEntryModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        ingredient_id: '',
        quantite: '',
        dlc: '',
        lot_number: '',
        provenance: '',
        reference: '',
        notes: '',
    });

    useEffect(() => {
        if (open) {
            reset();
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/inventory/movements/entree', data, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Ajouter une entrée de stock</h3>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Ingrédient */}
                        <div className="form-group">
                            <label className="form-label">Ingrédient *</label>
                            <select
                                className={`form-select ${errors.ingredient_id ? 'error' : ''}`}
                                value={data.ingredient_id}
                                onChange={(e) =>
                                    setData('ingredient_id', e.target.value)
                                }
                                required
                            >
                                <option value="">Sélectionner...</option>
                                {ingredients.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                        {ing.nom}{' '}
                                        {ing.unite ? `(${ing.unite})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.ingredient_id && (
                                <span className="form-error">
                                    {errors.ingredient_id}
                                </span>
                            )}
                        </div>

                        {/* Quantité */}
                        <div className="form-group">
                            <label className="form-label">Quantité *</label>
                            <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                className={`form-input ${errors.quantite ? 'error' : ''}`}
                                value={data.quantite}
                                onChange={(e) =>
                                    setData('quantite', e.target.value)
                                }
                                required
                            />
                            {errors.quantite && (
                                <span className="form-error">
                                    {errors.quantite}
                                </span>
                            )}
                        </div>

                        {/* DLC */}
                        <div className="form-group">
                            <label className="form-label">
                                Date Limite de Consommation (DLC)
                            </label>
                            <input
                                type="date"
                                className={`form-input ${errors.dlc ? 'error' : ''}`}
                                value={data.dlc}
                                onChange={(e) => setData('dlc', e.target.value)}
                            />
                            {errors.dlc && (
                                <span className="form-error">{errors.dlc}</span>
                            )}
                        </div>

                        {/* N° de lot */}
                        <div className="form-group">
                            <label className="form-label">
                                N° de lot / Fournisseur
                            </label>
                            <input
                                type="text"
                                className={`form-input ${errors.lot_number ? 'error' : ''}`}
                                value={data.lot_number}
                                onChange={(e) =>
                                    setData('lot_number', e.target.value)
                                }
                                placeholder="Ex: BL-2025-001"
                            />
                            {errors.lot_number && (
                                <span className="form-error">
                                    {errors.lot_number}
                                </span>
                            )}
                        </div>

                        {/* Provenance */}
                        <div className="form-group">
                            <label className="form-label">
                                Fournisseur / Origine
                            </label>
                            <input
                                type="text"
                                className={`form-input ${errors.provenance ? 'error' : ''}`}
                                value={data.provenance}
                                onChange={(e) =>
                                    setData('provenance', e.target.value)
                                }
                                placeholder="Ex: Fournisseur XYZ"
                            />
                        </div>

                        {/* Référence */}
                        <div className="form-group">
                            <label className="form-label">
                                Référence (BL, commande)
                            </label>
                            <input
                                type="text"
                                className={`form-input ${errors.reference ? 'error' : ''}`}
                                value={data.reference}
                                onChange={(e) =>
                                    setData('reference', e.target.value)
                                }
                                placeholder="Ex: COMMANDE-12345"
                            />
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className={`form-textarea ${errors.notes ? 'error' : ''}`}
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={processing}
                        >
                            <Plus size={16} />
                            Ajouter l'entrée
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
