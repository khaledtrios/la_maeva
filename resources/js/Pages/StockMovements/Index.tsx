import { useState, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Filter,
    Download,
    Package,
    TrendingUp,
    TrendingDown,
    Calendar,
    RefreshCw,
    X,
    Search,
    Clock,
    User,
    FileText,
    AlertCircle,
} from 'lucide-react';
import type { StockMovement, Product } from '@/types';

interface Props {
    movements: {
        data: Array<{
            id: number;
            entity_id: number;
            product_id: number;
            product: {
                id: number;
                nom: string;
                code: string | null;
                category: { nom: string };
            } | null;
            type:
                | 'ENTREE'
                | 'SORTIE'
                | 'ADJUSTMENT_IN'
                | 'WASTE'
                | 'ADJUSTMENT'
                | 'AJUSTEMENT';
            quantite: number;
            dlc: string | null;
            lot_number: string | null;
            provenance: string | null;
            reference: string | null;
            notes: string | null;
            created_by: number;
            movement_date: string;
            created_at: string;
            creator?: { id: number; nom: string } | null;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        date_from: string;
        date_to: string;
        product_id: string | null;
        type: string | null;
    };
    products: Array<{
        id: number;
        nom: string;
        code: string | null;
    }>;
    stats: {
        total_entree: number;
        total_sortie: number;
    };
}

export default function StockMovementsIndex() {
    const { movements, filters, products, stats } = usePage()
        .props as unknown as Props;

    const [localFilters, setLocalFilters] = useState({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        product_id: filters.product_id?.toString() || '',
        type: filters.type || '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    const applyFilters = () => {
        setIsSubmitting(true);
        router.get(
            '/stock/movements',
            {
                date_from: localFilters.date_from || undefined,
                date_to: localFilters.date_to || undefined,
                product_id: localFilters.product_id || undefined,
                type: localFilters.type || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const resetFilters = () => {
        setLocalFilters({
            date_from: '',
            date_to: '',
            product_id: '',
            type: '',
        });
        router.get('/stock/movements', {}, { preserveState: true });
    };

    const getTypeBadge = (type: string) => {
        const badges: Record<
            string,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            ENTREE: {
                label: 'Entrée',
                class: 'status-badge status-badge--success',
                icon: <TrendingUp size={12} strokeWidth={1.5} />,
            },
            SORTIE: {
                label: 'Sortie',
                class: 'status-badge status-badge--danger',
                icon: <TrendingDown size={12} strokeWidth={1.5} />,
            },
            ADJUSTMENT_IN: {
                label: 'Ajustement (+)',
                class: 'status-badge status-badge--info',
                icon: <RefreshCw size={12} strokeWidth={1.5} />,
            },
            ADJUSTMENT: {
                label: 'Ajustement (-)',
                class: 'status-badge status-badge--warning',
                icon: <RefreshCw size={12} strokeWidth={1.5} />,
            },
            AJUSTEMENT: {
                label: 'Ajustement',
                class: 'status-badge status-badge--warning',
                icon: <RefreshCw size={12} strokeWidth={1.5} />,
            },
            WASTE: {
                label: 'Perte/Casse',
                class: 'status-badge status-badge--danger',
                icon: <AlertCircle size={12} strokeWidth={1.5} />,
            },
        };
        const badge = badges[type] || {
            label: type,
            class: 'status-badge status-badge--default',
            icon: null,
        };
        return (
            <span className={badge.class}>
                {badge.icon}
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getQuantityDisplay = (qty: number, type: string) => {
        const isPositive = type === 'ENTREE' || type === 'ADJUSTMENT_IN';
        const absQty = Math.abs(qty);
        return (
            <span
                className={`quantity-value ${isPositive ? 'positive' : 'negative'}`}
            >
                {isPositive ? '+' : '-'}
                {absQty}
            </span>
        );
    };

    const isDlcExpired = (dlc: string | null) => {
        if (!dlc) return false;
        return new Date(dlc) < new Date();
    };

    const netChange = stats.total_entree - stats.total_sortie;
    const hasActiveFilters =
        localFilters.date_from ||
        localFilters.date_to ||
        localFilters.product_id ||
        localFilters.type;

    return (
        <div className="movements-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href="/stock" className="back-link">
                        <ArrowLeft size={18} strokeWidth={1.5} />
                        Retour au stock
                    </Link>
                    <h1 className="page-title">Historique des mouvements</h1>
                    <p className="page-subtitle">
                        Traçabilité complète des entrées et sorties de stock
                    </p>
                </div>
                <div className="header-stats">
                    <div className="stat-card-mini">
                        <div className="stat-icon-mini stat-icon-mini--success">
                            <TrendingUp size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="stat-label-mini">Entrées</div>
                            <div className="stat-value-mini stat-value-mini--success">
                                {stats.total_entree}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-icon-mini stat-icon-mini--danger">
                            <TrendingDown size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="stat-label-mini">Sorties</div>
                            <div className="stat-value-mini stat-value-mini--danger">
                                {stats.total_sortie}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card-mini">
                        <div
                            className={`stat-icon-mini ${netChange >= 0 ? 'stat-icon-mini--success' : 'stat-icon-mini--danger'}`}
                        >
                            <Package size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="stat-label-mini">Solde net</div>
                            <div
                                className={`stat-value-mini ${netChange >= 0 ? 'stat-value-mini--success' : 'stat-value-mini--danger'}`}
                            >
                                {netChange >= 0 ? '+' : ''}
                                {netChange}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-card">
                <div
                    className="filters-header"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <div className="filters-title">
                        <Filter size={16} strokeWidth={1.5} />
                        <span>Filtres</span>
                        {hasActiveFilters && (
                            <span className="filter-badge">Actifs</span>
                        )}
                    </div>
                    <div className="filters-actions">
                        {hasActiveFilters && (
                            <button
                                className="btn-ghost-sm"
                                onClick={resetFilters}
                            >
                                <X size={14} strokeWidth={1.5} />
                                Réinitialiser
                            </button>
                        )}
                        <button
                            className="btn-primary-sm"
                            onClick={applyFilters}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="spinner" />
                            ) : (
                                <Search size={14} strokeWidth={1.5} />
                            )}
                            Filtrer
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-body">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label className="filter-label">
                                    Date de début
                                </label>
                                <div className="date-input-wrapper">
                                    <Calendar size={14} strokeWidth={1.5} />
                                    <input
                                        type="date"
                                        value={localFilters.date_from}
                                        onChange={(e) =>
                                            setLocalFilters({
                                                ...localFilters,
                                                date_from: e.target.value,
                                            })
                                        }
                                        className="filter-input"
                                    />
                                </div>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">
                                    Date de fin
                                </label>
                                <div className="date-input-wrapper">
                                    <Calendar size={14} strokeWidth={1.5} />
                                    <input
                                        type="date"
                                        value={localFilters.date_to}
                                        onChange={(e) =>
                                            setLocalFilters({
                                                ...localFilters,
                                                date_to: e.target.value,
                                            })
                                        }
                                        className="filter-input"
                                    />
                                </div>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">Produit</label>
                                <select
                                    value={localFilters.product_id}
                                    onChange={(e) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            product_id: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">Tous les produits</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nom}{' '}
                                            {p.code ? `(${p.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">
                                    Type de mouvement
                                </label>
                                <select
                                    value={localFilters.type}
                                    onChange={(e) =>
                                        setLocalFilters({
                                            ...localFilters,
                                            type: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">Tous les types</option>
                                    <option value="ENTREE">Entrée</option>
                                    <option value="SORTIE">
                                        Sortie (vente)
                                    </option>
                                    <option value="WASTE">Perte / Casse</option>
                                    <option value="ADJUSTMENT_IN">
                                        Ajustement (+)
                                    </option>
                                    <option value="ADJUSTMENT">
                                        Ajustement (-)
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Movements Table */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Mouvements de stock</span>
                    </div>
                    <div className="table-count">
                        {movements.total} mouvement
                        {movements.total > 1 ? 's' : ''}
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date & heure</th>
                                <th>Type</th>
                                <th>Produit</th>
                                <th className="text-right">Quantité</th>
                                <th>Lot</th>
                                <th>DLC</th>
                                <th>Référence</th>
                                <th>Utilisateur</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-state">
                                        <Package size={48} strokeWidth={1} />
                                        <div className="empty-state-text">
                                            Aucun mouvement trouvé
                                        </div>
                                        <div className="empty-state-subtext">
                                            Modifiez vos filtres ou créez un
                                            nouveau mouvement
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movements.data.map((movement) => (
                                    <tr key={movement.id}>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar
                                                    size={12}
                                                    strokeWidth={1.5}
                                                />
                                                <span>
                                                    {formatDate(
                                                        movement.movement_date,
                                                    )}
                                                </span>
                                                <span className="time">
                                                    {
                                                        formatDateTime(
                                                            movement.created_at,
                                                        ).split('à')[1]
                                                    }
                                                </span>
                                            </div>
                                        </td>
                                        <td>{getTypeBadge(movement.type)}</td>
                                        <td>
                                            {movement.product ? (
                                                <div className="product-cell">
                                                    <span className="product-name">
                                                        {movement.product.nom}
                                                    </span>
                                                    <span className="product-category">
                                                        {
                                                            movement.product
                                                                .category?.nom
                                                        }
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">
                                                    Produit supprimé
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            {getQuantityDisplay(
                                                movement.quantite,
                                                movement.type,
                                            )}
                                        </td>
                                        <td>
                                            <code className="lot-code">
                                                {movement.lot_number || '—'}
                                            </code>
                                        </td>
                                        <td>
                                            {movement.dlc ? (
                                                <span
                                                    className={`dlc-badge ${isDlcExpired(movement.dlc) ? 'expired' : ''}`}
                                                >
                                                    {formatDate(movement.dlc)}
                                                </span>
                                            ) : (
                                                <span className="text-muted">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className="reference-text"
                                                title={movement.reference || ''}
                                            >
                                                {movement.reference || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="user-cell">
                                                <User
                                                    size={12}
                                                    strokeWidth={1.5}
                                                />
                                                <span>
                                                    {movement.creator?.nom ||
                                                        '—'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="mobile-list">
                    {movements.data.length === 0 ? (
                        <div className="empty-state-card">
                            <Package size={48} strokeWidth={1} />
                            <div className="empty-state-text">
                                Aucun mouvement trouvé
                            </div>
                        </div>
                    ) : (
                        movements.data.map((movement) => (
                            <div key={movement.id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <div className="mobile-type">
                                        {getTypeBadge(movement.type)}
                                    </div>
                                    <div className="mobile-date">
                                        <Clock size={12} strokeWidth={1.5} />
                                        {formatDateTime(movement.movement_date)}
                                    </div>
                                </div>
                                <div className="mobile-card-body">
                                    <div className="mobile-product">
                                        <span className="mobile-product-name">
                                            {movement.product?.nom ||
                                                'Produit supprimé'}
                                        </span>
                                        <span
                                            className={`mobile-quantity ${movement.type === 'ENTREE' || movement.type === 'ADJUSTMENT_IN' ? 'positive' : 'negative'}`}
                                        >
                                            {movement.type === 'ENTREE' ||
                                            movement.type === 'ADJUSTMENT_IN'
                                                ? '+'
                                                : '-'}
                                            {Math.abs(movement.quantite)}
                                        </span>
                                    </div>
                                    <div className="mobile-details">
                                        <div className="mobile-detail">
                                            <span className="mobile-detail-label">
                                                Lot
                                            </span>
                                            <code className="lot-code">
                                                {movement.lot_number || '—'}
                                            </code>
                                        </div>
                                        <div className="mobile-detail">
                                            <span className="mobile-detail-label">
                                                DLC
                                            </span>
                                            <span
                                                className={`dlc-badge ${isDlcExpired(movement.dlc) ? 'expired' : ''}`}
                                            >
                                                {formatDate(movement.dlc)}
                                            </span>
                                        </div>
                                        <div className="mobile-detail">
                                            <span className="mobile-detail-label">
                                                Réf.
                                            </span>
                                            <span>
                                                {movement.reference || '—'}
                                            </span>
                                        </div>
                                        <div className="mobile-detail">
                                            <span className="mobile-detail-label">
                                                Par
                                            </span>
                                            <span>
                                                {movement.creator?.nom || '—'}
                                            </span>
                                        </div>
                                    </div>
                                    {movement.notes && (
                                        <div className="mobile-notes">
                                            <FileText
                                                size={12}
                                                strokeWidth={1.5}
                                            />
                                            <span>{movement.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {movements.last_page > 1 && (
                    <div className="pagination">
                        <div className="pagination-info">
                            Page {movements.current_page} sur{' '}
                            {movements.last_page}
                        </div>
                        <div className="pagination-controls">
                            {movements.links
                                .filter(
                                    (link) =>
                                        link.label !== 'Next' &&
                                        link.label !== 'Previous',
                                )
                                .map((link, idx) => (
                                    <button
                                        key={idx}
                                        className={`pagination-btn ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url!)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .movements-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1400px;
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
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--orange);
                    font-size: 0.8rem;
                    font-weight: 500;
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

                /* Header Stats */
                .header-stats {
                    display: flex;
                    gap: 0.75rem;
                }
                .stat-card-mini {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                }
                .stat-icon-mini {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-icon-mini--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .stat-icon-mini--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .stat-label-mini {
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .stat-value-mini {
                    font-size: 1.1rem;
                    font-weight: 700;
                }
                .stat-value-mini--success {
                    color: var(--success);
                }
                .stat-value-mini--danger {
                    color: var(--danger);
                }

                /* Filters Card */
                .filters-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .filters-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                }
                .filters-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-2);
                }
                .filter-badge {
                    font-size: 0.65rem;
                    padding: 0.2rem 0.5rem;
                    background: var(--orange);
                    color: white;
                    border-radius: 20px;
                }
                .filters-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .filters-body {
                    padding: 1.25rem;
                }
                .filters-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                @media (min-width: 768px) {
                    .filters-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .filter-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
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
                .filter-input {
                    border: none;
                    background: transparent;
                    padding: 0.65rem 0;
                    font-size: 0.85rem;
                    width: 100%;
                    outline: none;
                }
                .filter-select {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.85rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    transition: all 0.2s;
                }
                .filter-select:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }

                /* Table Card */
                .table-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .table-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .table-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-2);
                }
                .table-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--orange);
                    border-radius: 50%;
                }
                .table-count {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                }

                /* Desktop Table */
                .table-wrapper {
                    overflow-x: auto;
                    display: none;
                }
                @media (min-width: 1024px) {
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
                }
                .data-table th {
                    padding: 0.85rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                }
                .data-table th.text-right {
                    text-align: right;
                }
                .data-table tbody tr {
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                }
                .data-table tbody tr:hover {
                    background: var(--bg-card-2);
                }
                .data-table td {
                    padding: 0.85rem 1rem;
                }
                .data-table td.text-right {
                    text-align: right;
                }
                .date-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: var(--text-2);
                }
                .date-cell .time {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    margin-left: auto;
                }
                .product-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .product-category {
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .quantity-value {
                    font-weight: 700;
                    font-size: 0.9rem;
                }
                .quantity-value.positive {
                    color: var(--success);
                }
                .quantity-value.negative {
                    color: var(--danger);
                }
                .lot-code {
                    font-family: monospace;
                    font-size: 0.75rem;
                    background: var(--bg-card-2);
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                }
                .dlc-badge {
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .dlc-badge.expired {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .reference-text {
                    font-size: 0.75rem;
                    color: var(--text-2);
                }
                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.75rem;
                    color: var(--text-2);
                }
                .text-muted {
                    color: var(--text-3);
                }

                /* Status Badges */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .status-badge--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .status-badge--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .status-badge--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .status-badge--info {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .status-badge--default {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                }

                /* Mobile List */
                .mobile-list {
                    display: flex;
                    flex-direction: column;
                }
                @media (min-width: 1024px) {
                    .mobile-list {
                        display: none;
                    }
                }
                .mobile-card {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                }
                .mobile-card:hover {
                    background: var(--bg-card-2);
                }
                .mobile-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                }
                .mobile-date {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .mobile-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .mobile-product {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .mobile-product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .mobile-quantity {
                    font-weight: 700;
                    font-size: 1rem;
                }
                .mobile-quantity.positive {
                    color: var(--success);
                }
                .mobile-quantity.negative {
                    color: var(--danger);
                }
                .mobile-details {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                    padding: 0.5rem 0;
                }
                .mobile-detail {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }
                .mobile-detail-label {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .mobile-notes {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.5rem;
                    background: var(--bg-card-2);
                    border-radius: 8px;
                    font-size: 0.7rem;
                    color: var(--text-2);
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 3rem !important;
                    color: var(--text-3);
                }
                .empty-state-text {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .empty-state-subtext {
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }
                .empty-state-card {
                    text-align: center;
                    padding: 2rem;
                    color: var(--text-3);
                }

                /* Pagination */
                .pagination {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--border);
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .pagination-info {
                    font-size: 0.75rem;
                    color: var(--text-3);
                }
                .pagination-controls {
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }
                .pagination-btn {
                    min-width: 34px;
                    padding: 0.4rem 0.6rem;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    color: var(--text-2);
                    transition: all 0.2s;
                }
                .pagination-btn.active {
                    background: var(--orange);
                    color: white;
                    border-color: var(--orange);
                }
                .pagination-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .pagination-btn:not(.disabled):not(.active):hover {
                    background: var(--bg-card-2);
                }

                /* Buttons */
                .btn-primary-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.45rem 0.9rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary-sm:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(232, 116, 42, 0.3);
                }
                .btn-ghost-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.4rem 0.8rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-ghost-sm:hover {
                    background: rgba(232, 116, 42, 0.1);
                }

                /* Spinner */
                .spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
