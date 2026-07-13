import { useState, useMemo } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import expeditions from '@/routes/expeditions';
import {
    ArrowLeft,
    Plus,
    Trash2,
    AlertTriangle,
    Package,
    MapPin,
    Calendar,
    Save,
    Truck,
    ClipboardList,
    ShoppingBag,
    Factory,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import commandesUrgentes from '@/routes/commandes-urgentes';

export default function CreateFromCommande() {
    const page = usePage();
    const { commande, products, boulangeries } = page.props as any;
    const { user } = useAuth();

    const [lines, setLines] = useState<any[]>(
        commande?.lines?.map((l: any) => ({
            product_id: l.product_id,
            product: l.product,
            quantite: l.quantite,
        })) || [],
    );

    const [boulangerieId, setBoulangerieId] = useState<number | ''>(
        commande?.entity?.id || '',
    );
    const [date, setDate] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [notes, setNotes] = useState<string>('');

    const [newProductId, setNewProductId] = useState<number | ''>('');
    const [newQuantite, setNewQuantite] = useState<number>(1);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addLine = () => {
        if (!newProductId) {
            setErrors({ product: 'Veuillez sélectionner un produit' });
            return;
        }

        const product = products.find((p: any) => p.id === newProductId);
        if (!product) return;

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

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLineQuantity = (index: number, qty: number) => {
        const updated = [...lines];
        updated[index].quantite = qty > 0 ? qty : 1;
        setLines(updated);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!boulangerieId) {
            newErrors.boulangerie = 'Veuillez sélectionner une boulangerie';
        }
        if (lines.length === 0) {
            newErrors.lines = 'Ajoutez au moins un produit';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        router.post(
            expeditions.store.url(),
            {
                boulangerie_id: boulangerieId,
                date: date,
                notes: notes,
                lines: lines.map((l) => ({
                    product_id: l.product_id,
                    quantite: l.quantite,
                    lot_reference: null,
                })),
                from_commande_urgente: true,
                commande_urgente_id: commande?.id,
            },
            {
                onFinish: () => setIsSubmitting(false),
                onSuccess: () => {},
                onError: (err: any) => {
                    console.error(err);
                    setErrors({ submit: 'Erreur lors de la création' });
                },
            },
        );
    };

    const totalItems = lines.reduce((sum, l) => sum + l.quantite, 0);
    const hasValidLines = lines.length > 0;

    const boulangerieNom =
        boulangeries?.find((b: any) => b.id === boulangerieId)?.nom || '';

    return (
        <>
            <Head title="Créer BL depuis commande urgente" />

            <div className="bl-create-page">
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
                        <h1 className="page-title">
                            Créer un bon de livraison
                        </h1>
                        <p className="page-subtitle">
                            Depuis la commande urgente n°{commande?.id} —{' '}
                            {commande?.entity?.nom}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--orange">
                            <ShoppingBag size={20} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Commande n°</div>
                            <div className="stat-value">#{commande?.id}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--info">
                            <Package size={20} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Produits</div>
                            <div className="stat-value">{lines.length}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--success">
                            <Truck size={20} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Unités totales</div>
                            <div className="stat-value">{totalItems}</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="create-form">
                    {/* 1. Destination */}
                    <div className="form-card">
                        <div className="form-card-header">
                            <div className="form-card-title">
                                <div className="form-card-dot" />
                                <span>1. Destination</span>
                            </div>
                        </div>
                        <div className="form-card-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Boulangerie destinataire{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <div className="select-with-icon">
                                        <MapPin
                                            size={16}
                                            strokeWidth={1.5}
                                            className="select-icon"
                                        />
                                        <select
                                            value={boulangerieId}
                                            onChange={(e) =>
                                                setBoulangerieId(
                                                    e.target.value
                                                        ? parseInt(
                                                              e.target.value,
                                                          )
                                                        : '',
                                                )
                                            }
                                            className={`form-select ${errors.boulangerie ? 'error' : ''}`}
                                        >
                                            <option value="">
                                                Sélectionner une boulangerie...
                                            </option>
                                            {boulangeries?.map((b: any) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.boulangerie && (
                                        <span className="form-error">
                                            {errors.boulangerie}
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Date d'expédition{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <div className="date-with-icon">
                                        <Calendar
                                            size={16}
                                            strokeWidth={1.5}
                                            className="date-icon"
                                        />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) =>
                                                setDate(e.target.value)
                                            }
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Notes{' '}
                                    <span className="form-optional">
                                        optionnel
                                    </span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Informations complémentaires..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Produits */}
                    <div className="form-card">
                        <div className="form-card-header">
                            <div className="form-card-title">
                                <Package size={16} strokeWidth={1.5} />
                                <span>2. Produits à expédier</span>
                            </div>
                            <div className="form-card-badge">
                                {totalItems} unité{totalItems > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="form-card-body">
                            {/* Ajout manuel */}
                            <div className="add-line-section">
                                <div className="add-line-title">
                                    Ajouter un produit
                                </div>
                                <div className="add-line-grid">
                                    <div className="form-group">
                                        <label className="form-label">
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
                                            className={`form-select-sm ${errors.product ? 'error' : ''}`}
                                        >
                                            <option value="">
                                                Choisir un produit...
                                            </option>
                                            {products.map((p: any) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nom} — {p.category?.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Quantité
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newQuantite}
                                            onChange={(e) =>
                                                setNewQuantite(
                                                    parseInt(e.target.value) ||
                                                        1,
                                                )
                                            }
                                            className="form-input-sm"
                                        />
                                    </div>
                                    <div className="form-group add-btn-container">
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
                                {errors.product && (
                                    <div className="form-error mt-2">
                                        {errors.product}
                                    </div>
                                )}
                            </div>

                            {/* Tableau lignes */}
                            {lines.length > 0 ? (
                                <div className="products-table-wrapper">
                                    <div className="products-table-header">
                                        <span>Produits sélectionnés</span>
                                    </div>
                                    <div className="table-wrapper">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Produit</th>
                                                    <th className="text-center">
                                                        Quantité
                                                    </th>
                                                    <th className="text-right">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lines.map((line, idx) => (
                                                    <tr key={idx}>
                                                        <td className="product-name">
                                                            {line.product?.nom}
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
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 1,
                                                                    )
                                                                }
                                                                className="quantity-input"
                                                            />
                                                        </td>
                                                        <td className="text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeLine(
                                                                        idx,
                                                                    )
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
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-products">
                                    <Package size={40} strokeWidth={1} />
                                    <div className="empty-products-text">
                                        Aucun produit sélectionné
                                    </div>
                                    <div className="empty-products-subtext">
                                        Utilisez le formulaire ci-dessus pour
                                        ajouter des produits
                                    </div>
                                </div>
                            )}
                            {errors.lines && (
                                <div className="form-error mt-4 text-center">
                                    {errors.lines}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Résumé */}
                    {hasValidLines && boulangerieId && (
                        <div className="summary-card">
                            <div className="summary-header">
                                <ClipboardList size={16} strokeWidth={1.5} />
                                <span>Récapitulatif</span>
                            </div>
                            <div className="summary-content">
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Boulangerie
                                    </span>
                                    <span className="summary-value">
                                        {boulangerieNom}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Date d'expédition
                                    </span>
                                    <span className="summary-value">
                                        {new Date(date).toLocaleDateString(
                                            'fr-FR',
                                        )}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Produits
                                    </span>
                                    <span className="summary-value">
                                        {lines.length} référence(s)
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Unités totales
                                    </span>
                                    <span className="summary-value summary-value--orange">
                                        {totalItems}
                                    </span>
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
                            disabled={isSubmitting || !hasValidLines}
                            className="btn-primary"
                        >
                            {isSubmitting ? (
                                <span className="spinner" />
                            ) : (
                                <Truck size={16} strokeWidth={1.5} />
                            )}
                            {isSubmitting
                                ? 'Création en cours...'
                                : 'Créer le bon de livraison'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .bl-create-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                .page-header {
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
                }
                .back-link:hover {
                    text-decoration: underline;
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

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }
                .stat-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    padding: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border: 1px solid var(--border);
                    transition: all 0.25s ease;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                }
                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-icon--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .stat-icon--info {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .stat-icon--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .stat-content {
                    flex: 1;
                }
                .stat-label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 0.15rem;
                }
                .stat-value {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--orange);
                    line-height: 1.2;
                }

                /* Form Card */
                .form-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .form-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
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
                .form-card-badge {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                }
                .form-card-body {
                    padding: 1.25rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                @media (min-width: 640px) {
                    .form-row {
                        grid-template-columns: 1fr 1fr;
                    }
                }
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
                .form-optional {
                    font-weight: 400;
                    text-transform: none;
                    font-size: 0.65rem;
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
                .form-select-sm, .form-input-sm {
                    padding: 0.5rem 0.7rem;
                    font-size: 0.8rem;
                    border-radius: 8px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    width: 100%;
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
                .text-orange {
                    color: var(--orange);
                }

                .select-with-icon, .date-with-icon {
                    position: relative;
                }
                .select-icon, .date-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-3);
                    pointer-events: none;
                }
                .select-with-icon .form-select,
                .date-with-icon .form-input {
                    padding-left: 38px;
                }

                /* Add Line Section */
                .add-line-section {
                    background: var(--bg-card-2);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }
                .add-line-title {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-2);
                    margin-bottom: 0.75rem;
                }
                .add-line-grid {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    gap: 0.75rem;
                    align-items: flex-end;
                }
                .add-line-grid .form-group:first-child {
                    flex: 2;
                }
                .add-btn-container {
                    margin-bottom: 0;
                }
                .btn-add-line {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .btn-add-line:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(232, 116, 42, 0.3);
                }

                /* Products Table */
                .products-table-wrapper {
                    margin-top: 0.5rem;
                }
                .products-table-header {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-2);
                    margin-bottom: 0.5rem;
                }
                .table-wrapper {
                    overflow-x: auto;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .data-table thead tr {
                    border-bottom: 2px solid var(--border);
                }
                .data-table th {
                    padding: 0.75rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                }
                .data-table th.text-center {
                    text-align: center;
                }
                .data-table th.text-right {
                    text-align: right;
                }
                .data-table td {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--border);
                    vertical-align: middle;
                }
                .product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .quantity-input {
                    width: 80px;
                    padding: 0.45rem;
                    text-align: center;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.8rem;
                }
                .quantity-input:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .btn-remove {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem;
                    background: transparent;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .btn-remove:hover {
                    background: rgba(214, 59, 59, 0.1);
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }

                /* Empty Products */
                .empty-products {
                    text-align: center;
                    padding: 2rem;
                    color: var(--text-3);
                }
                .empty-products-text {
                    margin-top: 0.75rem;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .empty-products-subtext {
                    font-size: 0.7rem;
                    margin-top: 0.25rem;
                }

                /* Summary Card */
                .summary-card {
                    background: linear-gradient(135deg, rgba(232, 116, 42, 0.05), rgba(232, 116, 42, 0.02));
                    border: 1px solid rgba(232, 116, 42, 0.15);
                    border-radius: 14px;
                    overflow: hidden;
                }
                .summary-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid rgba(232, 116, 42, 0.15);
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--orange);
                }
                .summary-content {
                    padding: 1rem 1.25rem;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }
                @media (min-width: 640px) {
                    .summary-content {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                .summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .summary-label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .summary-value {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-1);
                }
                .summary-value--orange {
                    color: var(--orange);
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
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
