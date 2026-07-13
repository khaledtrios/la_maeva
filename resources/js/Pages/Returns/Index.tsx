import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import returnsRoutes from '@/routes/returns';
import {
    Plus,
    Filter,
    Search,
    X,
    Eye,
    Calendar,
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    Truck,
    Building2,
    ArrowLeft,
    RefreshCw,
    XCircle,
} from 'lucide-react';

interface ReturnsIndexProps {
    returns: {
        data: any[];
        total: number;
        current_page: number;
        last_page: number;
        links?: any[];
    };
    filters: {
        status?: string;
        cause?: string;
        date_from?: string;
        date_to?: string;
    };
    statuses: Record<string, string>;
    causes: Record<string, string>;
    canCreate: boolean;
    canConfirm: boolean;
    canProcess: boolean;
}

export default function ReturnsIndex() {
    const {
        returns,
        filters,
        statuses,
        causes,
        canCreate,
        canConfirm,
        canProcess,
    } = usePage<PageProps & ReturnsIndexProps>().props;
    const { user } = useAuth();
    const [showFilters, setShowFilters] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFilterChange = (key: string, value: string) => {
        setIsSubmitting(true);
        router.get(
            returnsRoutes.index(),
            { ...filters, [key]: value || null },
            {
                preserveState: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const clearFilters = () => {
        setIsSubmitting(true);
        router.get(
            returnsRoutes.index(),
            {},
            {
                preserveState: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const getStatusInfo = (status: string) => {
        const classes: Record<
            string,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            BROUILLON: {
                label: 'Brouillon',
                class: 'status-badge status-badge--warning',
                icon: <Clock size={12} strokeWidth={1.5} />,
            },
            ENVOYEE: {
                label: 'Envoyée',
                class: 'status-badge status-badge--info',
                icon: <Truck size={12} strokeWidth={1.5} />,
            },
            RECEUE_PAR_LABO: {
                label: 'Reçue au labo',
                class: 'status-badge status-badge--orange',
                icon: <Building2 size={12} strokeWidth={1.5} />,
            },
            TRAITEE: {
                label: 'Traitée',
                class: 'status-badge status-badge--info',
                icon: <RefreshCw size={12} strokeWidth={1.5} />,
            },
            CLOTUREE: {
                label: 'Clôturée',
                class: 'status-badge status-badge--success',
                icon: <CheckCircle size={12} strokeWidth={1.5} />,
            },
            REJETEE: {
                label: 'Rejetée',
                class: 'status-badge status-badge--danger',
                icon: <XCircle size={12} strokeWidth={1.5} />,
            },
        };
        return (
            classes[status] || {
                label: status,
                class: 'status-badge status-badge--default',
                icon: null,
            }
        );
    };

    const getCauseInfo = (cause: string) => {
        return cause === 'DEFECTUEUX'
            ? {
                  label: 'Défectueux',
                  class: 'cause-badge cause-badge--danger',
                  icon: <AlertTriangle size={12} strokeWidth={1.5} />,
              }
            : {
                  label: 'DLC expirée',
                  class: 'cause-badge cause-badge--warning',
                  icon: <Clock size={12} strokeWidth={1.5} />,
              };
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const stats = {
        total: returns.data.length,
        brouillon: returns.data.filter((r: any) => r.status === 'BROUILLON')
            .length,
        envoye: returns.data.filter((r: any) => r.status === 'ENVOYEE').length,
        recu: returns.data.filter((r: any) => r.status === 'RECEUE_PAR_LABO')
            .length,
        cloture: returns.data.filter((r: any) => r.status === 'CLOTUREE')
            .length,
    };

    const hasActiveFilters =
        filters.status || filters.cause || filters.date_from || filters.date_to;

    return (
        <>
            <Head title="Retours produits" />

            <div className="returns-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Retours produits</h1>
                        <p className="page-subtitle">
                            {stats.total} retour{stats.total > 1 ? 's' : ''} •{' '}
                            {stats.brouillon} en attente
                        </p>
                        {user?.role === 'RESP_BOUTIQUE' ||
                        user?.role === 'EMPLOYE_VENTE' ? (
                            <p className="page-guidance">
                                <span className="guidance-icon">💡</span>
                                Les retours ne peuvent plus être modifiés une
                                fois envoyés. N'oubliez pas de vérifier avant
                                envoi.
                            </p>
                        ) : user?.role === 'RESP_LABO' ? (
                            <p className="page-guidance">
                                <span className="guidance-icon">ℹ️</span>
                                Pour confirmer, rejeter ou traiter un retour,
                                cliquez sur l'icône œil à droite du tableau.
                            </p>
                        ) : null}
                    </div>
                    {canCreate && (
                        <Link
                            href={returnsRoutes.create()}
                            className="btn-primary"
                        >
                            <Plus size={16} strokeWidth={1.5} />
                            Nouveau retour
                        </Link>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--warning">
                            <Clock size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Brouillons</div>
                            <div className="stat-value stat-value--warning">
                                {stats.brouillon}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--info">
                            <Truck size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Envoyés</div>
                            <div className="stat-value stat-value--info">
                                {stats.envoye}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--orange">
                            <Building2 size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Reçus au labo</div>
                            <div className="stat-value">{stats.recu}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--success">
                            <CheckCircle size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Clôturés</div>
                            <div className="stat-value stat-value--success">
                                {stats.cloture}
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
                                    onClick={clearFilters}
                                >
                                    <X size={14} strokeWidth={1.5} />
                                    Réinitialiser
                                </button>
                            )}
                            <button
                                className="btn-primary-sm"
                                onClick={() => {}}
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
                                        Statut
                                    </label>
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'status',
                                                e.target.value,
                                            )
                                        }
                                        className="filter-select"
                                    >
                                        <option value="">
                                            Tous les statuts
                                        </option>
                                        {Object.entries(statuses).map(
                                            ([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label">
                                        Cause
                                    </label>
                                    <select
                                        value={filters.cause || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'cause',
                                                e.target.value,
                                            )
                                        }
                                        className="filter-select"
                                    >
                                        <option value="">
                                            Toutes les causes
                                        </option>
                                        {Object.entries(causes).map(
                                            ([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label">
                                        Date de début
                                    </label>
                                    <div className="date-input-wrapper">
                                        <Calendar size={14} strokeWidth={1.5} />
                                        <input
                                            type="date"
                                            value={filters.date_from || ''}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'date_from',
                                                    e.target.value,
                                                )
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
                                            value={filters.date_to || ''}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'date_to',
                                                    e.target.value,
                                                )
                                            }
                                            className="filter-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                {returns.data.length === 0 ? (
                    <div className="empty-state-card">
                        <Package size={48} strokeWidth={1} />
                        <div className="empty-state-text">
                            Aucun retour trouvé
                        </div>
                        <div className="empty-state-subtext">
                            Modifiez vos filtres ou créez un nouveau retour
                        </div>
                    </div>
                ) : (
                    <div className="table-card">
                        <div className="table-header">
                            <div className="table-title">
                                <div className="table-dot" />
                                <span>Liste des retours</span>
                            </div>
                            <div className="table-count">
                                {returns.total} retour
                                {returns.total > 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Référence</th>
                                        <th>Date</th>
                                        <th>Boutique</th>
                                        <th>Produit</th>
                                        <th className="text-center">Qté</th>
                                        <th>Cause</th>
                                        <th>Statut</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.data.map((ret: any) => {
                                        const statusInfo = getStatusInfo(
                                            ret.status,
                                        );
                                        const causeInfo = getCauseInfo(
                                            ret.cause,
                                        );
                                        return (
                                            <tr key={ret.id}>
                                                <td>
                                                    <Link
                                                        href={returnsRoutes.show.url(
                                                            ret.id,
                                                        )}
                                                        className="invoice-link"
                                                    >
                                                        {ret.reference}
                                                    </Link>
                                                </td>
                                                <td className="text-muted">
                                                    {formatDate(ret.created_at)}
                                                </td>
                                                <td className="text-muted">
                                                    {ret.entity?.nom}
                                                </td>
                                                <td className="product-name">
                                                    {ret.product?.nom}
                                                </td>
                                                <td className="quantity-value text-center">
                                                    {ret.quantite_retournee}{' '}
                                                    <div
                                                        style={{
                                                            color: 'var(--orange)',
                                                        }}
                                                    >
                                                        {'unité(s)'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            causeInfo.class
                                                        }
                                                    >
                                                        {causeInfo.icon}
                                                        {causeInfo.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            statusInfo.class
                                                        }
                                                    >
                                                        {statusInfo.icon}
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Link
                                                        href={returnsRoutes.show.url(
                                                            ret.id,
                                                        )}
                                                        className="btn-icon"
                                                        title="Voir le détail"
                                                    >
                                                        <Eye
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="mobile-list">
                            {returns.data.map((ret: any) => {
                                const statusInfo = getStatusInfo(ret.status);
                                const causeInfo = getCauseInfo(ret.cause);
                                return (
                                    <div key={ret.id} className="mobile-card">
                                        <div className="mobile-card-header">
                                            <Link
                                                href={returnsRoutes.show.url(
                                                    ret.id,
                                                )}
                                                className="mobile-reference"
                                            >
                                                {ret.reference}
                                            </Link>
                                            <span className={statusInfo.class}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div className="mobile-card-body">
                                            <div className="mobile-field">
                                                <span className="mobile-field-label">
                                                    Boutique
                                                </span>
                                                <span className="mobile-field-value">
                                                    {ret.entity?.nom}
                                                </span>
                                            </div>
                                            <div className="mobile-field">
                                                <span className="mobile-field-label">
                                                    Produit
                                                </span>
                                                <span className="mobile-field-value">
                                                    {ret.product?.nom}
                                                </span>
                                            </div>
                                            <div className="mobile-field">
                                                <span className="mobile-field-label">
                                                    Quantité
                                                </span>
                                                <span className="mobile-field-value amount">
                                                    {ret.quantite_retournee}{' '}
                                                    {'unité(s)'}
                                                </span>
                                            </div>
                                            <div className="mobile-field">
                                                <span className="mobile-field-label">
                                                    Cause
                                                </span>
                                                <span
                                                    className={causeInfo.class}
                                                >
                                                    {causeInfo.icon}
                                                    {causeInfo.label}
                                                </span>
                                            </div>
                                            <div className="mobile-field">
                                                <span className="mobile-field-label">
                                                    Date
                                                </span>
                                                <span>
                                                    {formatDate(ret.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mobile-card-actions">
                                            <Link
                                                href={returnsRoutes.show.url(
                                                    ret.id,
                                                )}
                                                className="btn-icon"
                                                title="Voir le détail"
                                            >
                                                <Eye
                                                    size={16}
                                                    strokeWidth={1.5}
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {returns.links && returns.links.length > 3 && (
                            <div className="pagination">
                                <div className="pagination-info">
                                    Page {returns.current_page} sur{' '}
                                    {returns.last_page}
                                </div>
                                <div className="pagination-controls">
                                    {returns.links.map(
                                        (link: any, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    link.url &&
                                                    router.visit(link.url)
                                                }
                                                className={`pagination-btn ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                disabled={!link.url}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .returns-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
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
                .page-guidance {
                    margin-top: 0.5rem;
                    font-size: 0.78rem;
                    color: var(--text-2);
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: rgba(232, 116, 42, 0.06);
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    border-left: 3px solid var(--orange);
                }
                .guidance-icon {
                    font-size: 0.9rem;
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (min-width: 640px) {
                    .stats-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                .stat-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    border: 1px solid var(--border);
                    transition: all 0.25s ease;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                }
                .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-icon--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .stat-icon--info {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .stat-icon--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .stat-icon--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .stat-content {
                    flex: 1;
                }
                .stat-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 0.25rem;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--orange);
                    line-height: 1.2;
                }
                .stat-value--warning {
                    color: #f59e0b;
                }
                .stat-value--info {
                    color: var(--blue);
                }
                .stat-value--success {
                    color: var(--success);
                }

                /* Filters */
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
                .filter-select {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.85rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    width: 100%;
                }
                .date-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0 0.75rem;
                    background: var(--bg-card);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                }
                .filter-input {
                    border: none;
                    background: transparent;
                    padding: 0.65rem 0;
                    font-size: 0.85rem;
                    width: 100%;
                    outline: none;
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

                /* Data Table */
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
                .data-table th.text-center {
                    text-align: center;
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
                .invoice-link {
                    font-weight: 600;
                    color: var(--orange);
                    text-decoration: none;
                }
                .invoice-link:hover {
                    text-decoration: underline;
                }
                .product-name {
                    font-weight: 500;
                    color: var(--text-1);
                }
                .quantity-value {
                    font-weight: 700;
                    color: var(--orange);
                }
                .text-muted {
                    color: var(--text-3);
                }
                .text-center {
                    text-align: center;
                }

                /* Badges */
                .status-badge, .cause-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .status-badge--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .status-badge--info {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .status-badge--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .status-badge--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .status-badge--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .cause-badge--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .cause-badge--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }

                /* Actions */
                .btn-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.4rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon:hover {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                    border-color: var(--orange);
                }

                /* Mobile Cards */
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
                }
                .mobile-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                }
                .mobile-reference {
                    font-weight: 700;
                    color: var(--orange);
                    text-decoration: none;
                }
                .mobile-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .mobile-field {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                }
                .mobile-field-label {
                    color: var(--text-3);
                }
                .mobile-field-value {
                    font-weight: 500;
                    color: var(--text-1);
                }
                .mobile-field-value.amount {
                    font-weight: 700;
                    color: var(--orange);
                }
                .mobile-card-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    justify-content: flex-end;
                }

                /* Empty State */
                .empty-state-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    text-align: center;
                    padding: 3rem;
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

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
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

                .spinner {
                    width: 14px;
                    height: 14px;
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
