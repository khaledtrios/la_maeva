import { useState, useEffect } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import commandesUrgentes from '@/routes/commandes-urgentes';
import {
    ArrowLeft,
    Plus,
    Trash2,
    AlertTriangle,
    Package,
    Calendar,
    Save,
    Truck,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

// Composant Modal de confirmation
const ConfirmModal = ({
    title,
    message,
    type,
    onConfirm,
    onCancel,
}: {
    title: string;
    message: string;
    type: 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    const getIcon = () => {
        if (type === 'danger')
            return <AlertCircle size={28} strokeWidth={1.5} />;
        return <AlertTriangle size={28} strokeWidth={1.5} />;
    };

    const getIconClass = () => {
        if (type === 'danger') return 'modal-icon-danger';
        return 'modal-icon-warning';
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className={getIconClass()}>{getIcon()}</div>
                    <button onClick={onCancel} className="modal-close">
                        <span className="modal-close-icon">×</span>
                    </button>
                </div>
                <div className="modal-body text-center">
                    <h3 className="modal-title">{title}</h3>
                    <p className="modal-message">{message}</p>
                </div>
                <div className="modal-footer-center">
                    <button onClick={onCancel} className="btn-neutral">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className={`btn-${type}`}>
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function CommandeUrgenteCreate() {
    const page = usePage();
    const { products } = page.props as any;
    const { user } = useAuth();

    // Lignes de commande
    const [lines, setLines] = useState<any[]>([]);

    // Formulaire d'ajout de ligne
    const [newProductId, setNewProductId] = useState<number | ''>('');
    const [newQuantite, setNewQuantite] = useState<number>(1);

    // Informations commande
    const [commandeDate, setCommandeDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [priorite, setPriorite] = useState<number>(3);
    const [notes, setNotes] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Ajouter une ligne
    const addLine = () => {
        if (!newProductId) {
            setErrors({ product: 'Veuillez sélectionner un produit' });
            return;
        }

        const product = products.find((p: any) => p.id === newProductId);
        if (!product) return;

        // Vérifier si produit déjà dans les lignes
        const existingIndex = lines.findIndex(
            (l) => l.product_id === newProductId,
        );
        if (existingIndex >= 0) {
            setErrors({
                product:
                    'Ce produit est déjà dans la liste. Modifiez la quantité dans la liste.',
            });
            return;
        }

        setLines([
            ...lines,
            {
                product_id: newProductId,
                product: product,
                quantite: newQuantite,
            },
        ]);

        setNewProductId('');
        setNewQuantite(1);
        setErrors({});
    };

    // Supprimer une ligne
    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    // Modifier quantité d'une ligne
    const updateLineQuantity = (index: number, qty: number) => {
        const updated = [...lines];
        updated[index].quantite = qty > 0 ? qty : 1;
        setLines(updated);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (lines.length === 0) {
            newErrors.lines = 'Ajoutez au moins un produit';
        }

        if (!commandeDate) {
            newErrors.date = 'La date est requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Ouvrir modal de confirmation
        setShowConfirmModal(true);
    };

    const submit = () => {
        setIsSubmitting(true);
        setShowConfirmModal(false);

        router.post(
            commandesUrgentes.store.url(),
            {
                date: commandeDate,
                priorite: priorite,
                notes: notes,
                lines: lines.map((l) => ({
                    product_id: l.product_id,
                    quantite: l.quantite,
                })),
            },
            {
                onFinish: () => setIsSubmitting(false),
                onSuccess: () => {
                    // Optionnel: afficher une notification de succès
                },
                onError: (err: any) => {
                    console.error(err);
                    setErrors({
                        submit: 'Erreur lors de la création de la commande',
                    });
                },
            },
        );
    };

    const totalItems = lines.reduce((sum, l) => sum + l.quantite, 0);
    const getPriorityLabel = (priority: number) => {
        const labels: Record<number, string> = {
            1: 'Basse',
            2: 'Normale',
            3: 'Haute',
            4: 'Urgente',
            5: 'Critique',
        };
        return labels[priority] || 'Normale';
    };

    const getPriorityClass = (priority: number) => {
        if (priority >= 4) return 'priority-high';
        if (priority >= 3) return 'priority-medium';
        return 'priority-low';
    };

    return (
        <>
            <Head title="Nouvelle commande urgente" />

            <div className="commande-create-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <Link
                            href={commandesUrgentes.index()}
                            className="back-link"
                        >
                            <ArrowLeft size={18} strokeWidth={1.5} />
                            Retour aux commandes
                        </Link>
                        <h1 className="page-title">Commande urgente</h1>
                        <p className="page-subtitle">
                            Réassort jour même — Créer une demande urgente
                        </p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-chip">
                            <Package size={14} strokeWidth={1.5} />
                            <span>
                                {totalItems} produit{totalItems > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="create-form">
                    {/* 1. Informations commande */}
                    <div className="form-card">
                        <div className="form-card-header">
                            <div className="form-card-title">
                                <div className="form-card-dot" />
                                <span>1. Informations générales</span>
                            </div>
                        </div>
                        <div className="form-card-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label required">
                                        Date de commande
                                    </label>
                                    <div className="date-input-wrapper">
                                        <Calendar size={16} strokeWidth={1.5} />
                                        <input
                                            type="date"
                                            value={commandeDate}
                                            onChange={(e) =>
                                                setCommandeDate(e.target.value)
                                            }
                                            className={`form-input ${errors.date ? 'error' : ''}`}
                                        />
                                    </div>
                                    {errors.date && (
                                        <span className="form-error">
                                            {errors.date}
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">
                                        Priorité
                                    </label>
                                    <select
                                        value={priorite}
                                        onChange={(e) =>
                                            setPriorite(
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className="form-select"
                                    >
                                        <option value={1}>1 — Basse</option>
                                        <option value={2}>2 — Normale</option>
                                        <option value={3}>3 — Haute</option>
                                        <option value={4}>4 — Urgente</option>
                                        <option value={5}>5 — Critique</option>
                                    </select>
                                    <div
                                        className={`priority-indicator ${getPriorityClass(priorite)}`}
                                    >
                                        Priorité {getPriorityLabel(priorite)}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Informations complémentaires (motif de l'urgence, livraison spécifique, etc.)..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Ajout de produits */}
                    <div className="form-card">
                        <div className="form-card-header">
                            <div className="form-card-title">
                                <Package size={16} strokeWidth={1.5} />
                                <span>2. Sélection des produits</span>
                            </div>
                            <span className="form-badge">
                                {totalItems} unité{totalItems > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="form-card-body">
                            <div className="add-line-form">
                                <div className="form-row">
                                    <div
                                        className="form-group"
                                        style={{ gridColumn: 'span 2' }}
                                    >
                                        <label className="form-label required">
                                            Produit
                                        </label>
                                        <select
                                            value={newProductId}
                                            onChange={(e) =>
                                                setNewProductId(
                                                    e.target.value
                                                        ? parseInt(
                                                              e.target.value,
                                                          )
                                                        : '',
                                                )
                                            }
                                            className={`form-select ${errors.product ? 'error' : ''}`}
                                        >
                                            <option value="">
                                                Choisir un produit...
                                            </option>
                                            {products.map((p: any) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nom} — {p.category?.nom}{' '}
                                                    {p.code
                                                        ? `(${p.code})`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.product && (
                                            <span className="form-error">
                                                {errors.product}
                                            </span>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">
                                            Quantité
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newQuantite}
                                            onChange={(e) =>
                                                setNewQuantite(
                                                    Math.max(
                                                        1,
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1,
                                                    ),
                                                )
                                            }
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group flex-self-end">
                                        <button
                                            type="button"
                                            onClick={addLine}
                                            className="btn-add-line"
                                        >
                                            <Plus size={16} strokeWidth={1.5} />
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                                {errors.lines && (
                                    <div className="form-error-message">
                                        <AlertCircle
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        {errors.lines}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Liste des lignes */}
                    {lines.length > 0 && (
                        <div className="form-card">
                            <div className="form-card-header">
                                <div className="form-card-title">
                                    <div className="form-card-dot" />
                                    <span>3. Récapitulatif de la commande</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Vider toute la liste des produits ?',
                                            )
                                        ) {
                                            setLines([]);
                                        }
                                    }}
                                    className="btn-clear"
                                >
                                    <Trash2 size={14} strokeWidth={1.5} />
                                    Vider
                                </button>
                            </div>
                            <div className="form-card-body p-0">
                                {/* Desktop Table */}
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Produit</th>
                                                <th className="text-center">
                                                    Quantité
                                                </th>
                                                <th className="text-center">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lines.map((line, idx) => (
                                                <tr key={idx}>
                                                    <td className="product-name">
                                                        {line.product?.nom}
                                                        {line.product?.code && (
                                                            <span className="product-code">
                                                                {
                                                                    line.product
                                                                        .code
                                                                }
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={
                                                                line.quantite
                                                            }
                                                            onChange={(e) =>
                                                                updateLineQuantity(
                                                                    idx,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                )
                                                            }
                                                            className="quantity-input"
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeLine(idx)
                                                            }
                                                            className="btn-remove"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="table-footer">
                                                <td colSpan={3}>
                                                    <div className="footer-summary">
                                                        <span>
                                                            Total produits :
                                                        </span>
                                                        <strong>
                                                            {lines.length}
                                                        </strong>
                                                        <span>
                                                            Unités totales :
                                                        </span>
                                                        <strong>
                                                            {totalItems}
                                                        </strong>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="mobile-list">
                                    {lines.map((line, idx) => (
                                        <div
                                            key={idx}
                                            className="mobile-line-item"
                                        >
                                            <div className="mobile-line-header">
                                                <span className="mobile-product-name">
                                                    {line.product?.nom}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeLine(idx)
                                                    }
                                                    className="btn-remove-mobile"
                                                >
                                                    <Trash2
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            </div>
                                            <div className="mobile-line-quantity">
                                                <label>Quantité :</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={line.quantite}
                                                    onChange={(e) =>
                                                        updateLineQuantity(
                                                            idx,
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 1,
                                                        )
                                                    }
                                                    className="quantity-input-mobile"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() =>
                                router.visit(commandesUrgentes.index())
                            }
                            className="btn-neutral"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || lines.length === 0}
                            className="btn-primary"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Truck size={16} strokeWidth={1.5} />
                                    Envoyer la commande
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Modal de confirmation */}
                {showConfirmModal && (
                    <ConfirmModal
                        title="Confirmer la commande"
                        message={`Vous allez commander ${totalItems} article${totalItems > 1 ? 's' : ''}. Cette action est irréversible. Confirmez-vous ?`}
                        type="warning"
                        onConfirm={submit}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}

                {/* Message d'erreur général */}
                {errors.submit && (
                    <div className="error-toast">
                        <AlertCircle size={16} strokeWidth={1.5} />
                        {errors.submit}
                    </div>
                )}
            </div>

            <style>{`
                .commande-create-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                /* Header */
                .page-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--orange);
                    font-size: 0.8rem;
                    text-decoration: none;
                    margin-bottom: 0.5rem;
                    transition: all 0.2s;
                }
                .back-link:hover {
                    text-decoration: underline;
                    gap: 0.6rem;
                }
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.25rem;
                }
                .page-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-3);
                }
                .header-stats {
                    display: flex;
                    gap: 0.5rem;
                }
                .stat-chip {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.9rem;
                    background: var(--bg-card-2);
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-2);
                }

                /* Form Card */
                .form-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .form-card:hover {
                    box-shadow: var(--shadow-sm);
                }
                .form-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    background: var(--bg-card-2);
                }
                .form-card-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-2);
                }
                .form-card-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--orange);
                    border-radius: 50%;
                }
                .form-badge {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card);
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                    border: 1px solid var(--border);
                }
                .form-card-body {
                    padding: 1.25rem;
                }
                .form-card-body.p-0 {
                    padding: 0;
                }

                /* Form Elements */
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .form-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .form-label.required::after {
                    content: '*';
                    color: var(--danger);
                    margin-left: 0.25rem;
                }
                .form-hint {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    margin-top: 0.25rem;
                }
                .form-select, .form-input, .form-textarea {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.85rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    width: 100%;
                    transition: all 0.2s;
                }
                .form-select:focus, .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .form-select.error, .form-input.error {
                    border-color: var(--danger);
                }
                .form-error {
                    font-size: 0.7rem;
                    color: var(--danger);
                    margin-top: 0.25rem;
                }
                .form-error-message {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: rgba(214, 59, 59, 0.1);
                    border-radius: 10px;
                    color: var(--danger);
                    font-size: 0.8rem;
                    margin-top: 1rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .flex-self-end {
                    display: flex;
                    align-items: flex-end;
                }

                /* Date Input */
                .date-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0 0.75rem;
                    background: var(--bg-card);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    transition: all 0.2s;
                }
                .date-input-wrapper:focus-within {
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .date-input-wrapper .form-input {
                    border: none;
                    padding: 0.65rem 0;
                    background: transparent;
                }

                /* Priority */
                .priority-indicator {
                    font-size: 0.7rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    margin-top: 0.25rem;
                }
                .priority-low {
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                }
                .priority-medium {
                    color: #f59e0b;
                    background: rgba(245, 158, 11, 0.1);
                }
                .priority-high {
                    color: var(--danger);
                    background: rgba(214, 59, 59, 0.1);
                }

                /* Add Line Form */
                .add-line-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .btn-add-line {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.65rem 1.2rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    height: fit-content;
                }
                .btn-add-line:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                }
                .btn-clear {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.3rem 0.7rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 8px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-clear:hover {
                    background: rgba(214, 59, 59, 0.1);
                }

                /* Table */
                .table-wrapper {
                    overflow-x: auto;
                    display: none;
                }
                @media (min-width: 768px) {
                    .table-wrapper {
                        display: block;
                    }
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .data-table thead tr {
                    border-bottom: 2px solid var(--border);
                    background: var(--bg-card-2);
                }
                .data-table th {
                    padding: 0.85rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                }
                .data-table th.text-center {
                    text-align: center;
                }
                .data-table td {
                    padding: 0.85rem 1rem;
                    border-bottom: 1px solid var(--border);
                    vertical-align: middle;
                }
                .data-table tbody tr:hover {
                    background: var(--bg-card-2);
                }
                .product-name {
                    font-weight: 600;
                    color: var(--text-1);
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }
                .product-code {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    font-weight: normal;
                }
                .quantity-input {
                    width: 100px;
                    padding: 0.5rem;
                    text-align: center;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    background: var(--bg-card);
                }
                .quantity-input:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .text-center {
                    text-align: center;
                }
                .table-footer td {
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .footer-summary {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    font-size: 0.8rem;
                }
                .footer-summary strong {
                    color: var(--orange);
                    font-size: 1rem;
                }

                /* Mobile List */
                .mobile-list {
                    display: flex;
                    flex-direction: column;
                }
                @media (min-width: 768px) {
                    .mobile-list {
                        display: none;
                    }
                }
                .mobile-line-item {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .mobile-line-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }
                .mobile-product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .mobile-line-quantity {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .mobile-line-quantity label {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    text-transform: uppercase;
                }
                .quantity-input-mobile {
                    width: 80px;
                    padding: 0.4rem;
                    text-align: center;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.8rem;
                }
                .btn-remove-mobile {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.3rem;
                    background: transparent;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                    border-radius: 6px;
                }

                .btn-remove {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.4rem;
                    background: transparent;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .btn-remove:hover {
                    background: rgba(214, 59, 59, 0.1);
                    transform: scale(1.1);
                }

                /* Form Actions */
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding: 0.5rem 0 1rem;
                }

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.65rem 1.3rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                }
                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .btn-neutral {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.65rem 1.3rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
                    transform: translateY(-1px);
                }
                .btn-danger {
                    background: linear-gradient(135deg, var(--danger), #e05a5a);
                    color: white;
                }
                .btn-warning {
                    background: linear-gradient(135deg, #f59e0b, #fbbf24);
                    color: white;
                }

                /* Spinner */
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 420px;
                    width: 100%;
                    overflow: hidden;
                    animation: modalSlideIn 0.2s ease;
                }
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 0.5rem;
                }
                .modal-icon-danger {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(214, 59, 59, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--danger);
                }
                .modal-icon-warning {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(245, 158, 11, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #f59e0b;
                }
                .modal-close {
                    width: 32px;
                    height: 32px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .modal-close:hover {
                    background: var(--border);
                }
                .modal-close-icon {
                    font-size: 1.2rem;
                    font-weight: 300;
                }
                .modal-body {
                    padding: 0 1.5rem 1rem;
                }
                .modal-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-1);
                    margin-bottom: 0.5rem;
                }
                .modal-message {
                    font-size: 0.9rem;
                    color: var(--text-2);
                }
                .modal-footer-center {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .text-center {
                    text-align: center;
                }

                /* Error Toast */
                .error-toast {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: var(--danger);
                    color: white;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    animation: slideInRight 0.3s ease;
                    z-index: 99;
                }
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
}
