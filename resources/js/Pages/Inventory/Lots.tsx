import { useState, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import inventory from '@/routes/inventory';
import {
    AlertCircle,
    Package,
    Calendar,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Search,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Clock,
    ArrowLeft,
    StarsIcon,
} from 'lucide-react';
import type { StockBalance as IStockBalance, Ingredient } from '@/types';

interface InventoryLotsProps {
    balances: {
        data: (IStockBalance & {
            ingredient: { id: number; nom: string; unite: string | null };
        })[];
        links: any;
        total: number;
    };
    stats: {
        total_lots: number;
        total_quantity: number;
        expired_count: number;
        expiring_soon_count: number;
    };
    ingredients: Ingredient[];
    entity: { id: number; type: string; nom: string };
    filters: {
        ingredient_id?: string;
        dlc_status?: string;
    };
}

export default function InventoryLots({
    balances,
    stats,
    ingredients,
    entity,
    filters,
}: InventoryLotsProps) {
    const { hasRole } = useAuth();
    const [localFilters, setLocalFilters] = useState({
        ingredient_id: filters.ingredient_id || '',
        dlc_status: filters.dlc_status || '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
    })();

    const filteredBalances = useMemo(() => {
        let filtered = [...balances.data];

        if (localFilters.ingredient_id) {
            filtered = filtered.filter(
                (balance) =>
                    balance.ingredient_id ===
                    parseInt(localFilters.ingredient_id),
            );
        }

        if (localFilters.dlc_status === 'expired') {
            filtered = filtered.filter(
                (balance) => balance.dlc && balance.dlc <= today,
            );
        } else if (localFilters.dlc_status === 'expiring_soon') {
            filtered = filtered.filter(
                (balance) =>
                    balance.dlc &&
                    balance.dlc > today &&
                    balance.dlc <= threeDaysFromNow,
            );
        } else if (localFilters.dlc_status === 'ok') {
            filtered = filtered.filter(
                (balance) => !balance.dlc || balance.dlc > threeDaysFromNow,
            );
        }

        // Trier par DLC croissante (FIFO)
        return filtered.sort((a, b) => {
            if (!a.dlc && !b.dlc) return 0;
            if (!a.dlc) return 1;
            if (!b.dlc) return -1;
            return a.dlc.localeCompare(b.dlc);
        });
    }, [balances.data, localFilters, today, threeDaysFromNow]);

    const getDlcStatus = (balance: IStockBalance) => {
        if (!balance.dlc) {
            return {
                label: 'Sans DLC',
                class: 'status-badge status-badge--muted',
                icon: null,
            };
        }
        if (balance.dlc <= today) {
            return {
                label: 'Expiré',
                class: 'status-badge status-badge--danger',
                icon: XCircle,
            };
        }
        const threeDaysFromNowDate = new Date();
        threeDaysFromNowDate.setDate(threeDaysFromNowDate.getDate() + 3);
        if (balance.dlc <= threeDaysFromNowDate.toISOString().split('T')[0]) {
            return {
                label: 'Bientôt expiré',
                class: 'status-badge status-badge--warning',
                icon: AlertTriangle,
            };
        }
        return {
            label: 'OK',
            class: 'status-badge status-badge--success',
            icon: CheckCircle,
        };
    };

    const applyFilters = () => {
        setIsLoading(true);
        router.get(
            inventory.lots.index(),
            {
                ingredient_id: localFilters.ingredient_id || undefined,
                dlc_status: localFilters.dlc_status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const resetFilters = () => {
        setIsLoading(true);
        setLocalFilters({ ingredient_id: '', dlc_status: '' });
        router.get(
            inventory.lots.index(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const healthyCount =
        stats.total_lots - stats.expired_count - stats.expiring_soon_count;
    const tauxExpiration =
        stats.total_lots > 0
            ? Math.round(
                  ((stats.expired_count + stats.expiring_soon_count) /
                      stats.total_lots) *
                      100,
              )
            : 0;

    return (
        <div className="lots-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des lots</h1>
                    <p className="page-subtitle">
                        Suivi FIFO des lots de stock
                    </p>
                </div>
                <Link href="/inventory" className="btn-secondary">
                    <ArrowLeft size={16} strokeWidth={1.5} />
                    Retour aux stocks
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Package size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total lots</div>
                        <div className="stat-value">{stats.total_lots}</div>
                        <div className="stat-subvalue">
                            {stats.total_quantity.toFixed(1)} unités
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--danger">
                        <XCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Lots expirés</div>
                        <div className="stat-value stat-value--danger">
                            {stats.expired_count}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--warning">
                        <AlertTriangle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Bientôt expirés</div>
                        <div className="stat-value stat-value--warning">
                            {stats.expiring_soon_count}
                        </div>
                        <div className="stat-subvalue">dans les 3 jours</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <CheckCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Lots sains</div>
                        <div className="stat-value stat-value--success">
                            {healthyCount}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerte si taux d'expiration élevé */}
            {tauxExpiration > 30 && (
                <div className="alert alert-danger">
                    <AlertCircle size={18} strokeWidth={2} />
                    <span className="alert-text">
                        <strong>Attention :</strong> {tauxExpiration}% de vos
                        lots sont expirés ou bientôt expirés. Pensez à vérifier
                        votre stock.
                    </span>
                </div>
            )}

            {/* Filters */}
            <div className="filters-card">
                <div className="filters-header">
                    <div className="filters-title">
                        <div className="filters-dot" />
                        <span>Filtres</span>
                    </div>
                </div>
                <div className="filters-body">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Ingrédient</label>
                            <select
                                className="filter-select"
                                value={localFilters.ingredient_id}
                                onChange={(e) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        ingredient_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">Tous les ingrédients</option>
                                {ingredients.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                        {ing.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Statut DLC</label>
                            <select
                                className="filter-select"
                                value={localFilters.dlc_status}
                                onChange={(e) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        dlc_status: e.target.value,
                                    })
                                }
                            >
                                <option value="">Tous les statuts</option>
                                <option value="expired">Expirés</option>
                                <option value="expiring_soon">
                                    Bientôt expirés (≤3j)
                                </option>
                                <option value="ok">OK</option>
                            </select>
                        </div>
                        <div className="filter-actions">
                            <button
                                className="btn-primary"
                                onClick={applyFilters}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="spinner" />
                                ) : (
                                    <Search size={16} strokeWidth={1.5} />
                                )}
                                Appliquer
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={resetFilters}
                                disabled={isLoading}
                            >
                                <RefreshCw size={16} strokeWidth={1.5} />
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Liste des lots (ordre FIFO)</span>
                    </div>
                    <div className="table-count">
                        {filteredBalances.length} lot
                        {filteredBalances.length > 1 ? 's' : ''}
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <span>Chargement...</span>
                    </div>
                ) : filteredBalances.length === 0 ? (
                    <div className="empty-state-card">
                        <Package size={48} strokeWidth={1} />
                        <div className="empty-state-text">
                            Aucun lot trouvé avec ces filtres
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="mobile-list">
                            {filteredBalances.map((balance) => {
                                const status = getDlcStatus(balance);
                                const StatusIcon = status.icon;
                                return (
                                    <div
                                        key={`${balance.entity_id}-${balance.ingredient_id}-${balance.dlc}-${balance.lot_number}`}
                                        className="mobile-row"
                                    >
                                        <div className="mobile-row-top">
                                            <span className="mobile-name">
                                                {balance.ingredient.nom}
                                            </span>
                                            {status.icon && (
                                                <span
                                                    className={`mobile-status-badge ${status.class}`}
                                                >
                                                    <StarsIcon
                                                        size={12}
                                                        strokeWidth={1.5}
                                                    />
                                                    {status.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mobile-row-meta">
                                            <span className="meta-text">
                                                Lot: {balance.lot_number || '—'}
                                            </span>
                                            <span className="meta-text">
                                                Unité:{' '}
                                                {balance.ingredient.unite ||
                                                    'unité'}
                                            </span>
                                        </div>
                                        <div className="mobile-stats">
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    DLC
                                                </span>
                                                <span className="mobile-stat-value">
                                                    {balance.dlc ? (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar
                                                                size={12}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            {new Date(
                                                                balance.dlc,
                                                            ).toLocaleDateString(
                                                                'fr-FR',
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">
                                                            —
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mobile-stat-divider" />
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Quantité
                                                </span>
                                                <span className="mobile-stat-value mobile-stat-value--orange">
                                                    {Number(
                                                        balance.quantite,
                                                    ).toFixed(3)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Ingrédient</th>
                                        <th>Lot N°</th>
                                        <th>Date limite (DLC)</th>
                                        <th>Statut</th>
                                        <th className="text-right">Quantité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBalances.map((balance) => {
                                        const status = getDlcStatus(balance);
                                        const StatusIcon = status.icon;
                                        return (
                                            <tr
                                                key={`${balance.entity_id}-${balance.ingredient_id}-${balance.dlc}-${balance.lot_number}`}
                                            >
                                                <td>
                                                    <div className="product-name">
                                                        {balance.ingredient.nom}
                                                    </div>
                                                    <div className="product-sub">
                                                        {balance.ingredient
                                                            .unite || 'unité'}
                                                    </div>
                                                </td>
                                                <td className="lot-number">
                                                    {balance.lot_number || '—'}
                                                </td>
                                                <td>
                                                    {balance.dlc ? (
                                                        <div className="dlc-cell">
                                                            {balance.dlc !=
                                                                '2099-12-31T00:00:00.000000Z' && (
                                                                <Calendar
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                            )}

                                                            {new Date(
                                                                balance.dlc,
                                                            ).toLocaleDateString(
                                                                'fr-FR',
                                                                {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                },
                                                            ) == '31 déc. 2099'
                                                                ? '-'
                                                                : new Date(
                                                                      balance.dlc,
                                                                  ).toLocaleDateString(
                                                                      'fr-FR',
                                                                      {
                                                                          day: 'numeric',
                                                                          month: 'short',
                                                                          year: 'numeric',
                                                                      },
                                                                  )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div
                                                        className={`status-badge ${status.class}`}
                                                    >
                                                        {StatusIcon && (
                                                            <StatusIcon
                                                                size={12}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        )}
                                                        {status.label}
                                                    </div>
                                                </td>
                                                <td className="quantity-value text-right">
                                                    {Number(
                                                        balance.quantite,
                                                    ).toFixed(3)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* FIFO Info */}
            <div className="info-card">
                <div className="info-header">
                    <Clock size={18} strokeWidth={1.5} />
                    <span>Principe FIFO (First-In, First-Out)</span>
                </div>
                <p className="info-text">
                    Les lots sont affichés par ordre de DLC croissante (les plus
                    proches de la date d'expiration en premier). Les ingrédients
                    sont consommés en priorité depuis les lots les plus anciens
                    pour minimiser les pertes.
                </p>
            </div>

            <style>{`
        .lots-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Header */
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
        .stat-icon--orange {
          background: rgba(232, 116, 42, 0.1);
          color: var(--orange);
        }
        .stat-icon--success {
          background: rgba(30, 158, 106, 0.1);
          color: var(--success);
        }
        .stat-icon--danger {
          background: rgba(214, 59, 59, 0.1);
          color: var(--danger);
        }
        .stat-icon--warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .stat-icon--blue {
          background: rgba(59, 91, 219, 0.1);
          color: var(--blue);
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
        .stat-value--danger {
          color: var(--danger);
        }
        .stat-value--warning {
          color: #f59e0b;
        }
        .stat-value--success {
          color: var(--success);
        }
        .stat-subvalue {
          font-size: 0.65rem;
          color: var(--text-3);
          margin-top: 2px;
        }

        /* Alert */
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 12px;
        }
        .alert-danger {
          background: var(--danger-bg);
          border-left: 4px solid var(--danger);
        }
        .alert-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-2);
        }

        /* Filters Card */
        .filters-card {
          background: var(--bg-card);
          border-radius: 14px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .filters-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
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
        .filters-dot {
          width: 8px;
          height: 8px;
          background: var(--orange);
          border-radius: 50%;
        }
        .filters-body {
          padding: 1.25rem;
        }
        .filters-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          align-items: flex-end;
        }
        @media (min-width: 768px) {
          .filters-grid {
            grid-template-columns: repeat(3, 1fr);
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
          transition: all 0.2s;
          width: 100%;
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
        }
        .filter-actions {
          display: flex;
          gap: 0.5rem;
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

        /* Loading State */
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3rem;
          color: var(--text-3);
        }

        /* Empty State */
        .empty-state-card {
          background: var(--bg-card-2);
          text-align: center;
          padding: 3rem;
          color: var(--text-3);
        }
        .empty-state-text {
          margin-top: 1rem;
          font-size: 0.9rem;
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
        .mobile-row {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }
        .mobile-row:hover {
          background: var(--bg-card-2);
        }
        .mobile-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .mobile-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-1);
        }
        .mobile-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .mobile-row-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          font-size: 0.7rem;
          color: var(--text-3);
        }
        .mobile-stats {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }
        .mobile-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mobile-stat-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-3);
        }
        .mobile-stat-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-1);
        }
        .mobile-stat-value--orange {
          color: var(--orange);
        }
        .mobile-stat-divider {
          width: 1px;
          height: 30px;
          background: var(--border);
        }

        /* Desktop Table */
        .table-wrapper {
          display: none;
          overflow-x: auto;
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
        .product-name {
          font-weight: 600;
          color: var(--text-1);
        }
        .product-sub {
          font-size: 0.7rem;
          color: var(--text-3);
          margin-top: 2px;
        }
        .lot-number {
          font-family: monospace;
          font-size: 0.85rem;
          color: var(--text-2);
        }
        .dlc-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-2);
        }
        .quantity-value {
          font-weight: 700;
          color: var(--orange);
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
        .status-badge--muted {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }
        .text-muted {
          color: var(--text-3);
        }

        /* Info Card */
        .info-card {
          background: rgba(59, 91, 219, 0.05);
          border: 1px solid rgba(59, 91, 219, 0.15);
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }
        .info-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--blue);
          margin-bottom: 0.5rem;
        }
        .info-text {
          font-size: 0.75rem;
          color: var(--text-2);
          line-height: 1.5;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.2rem;
          background: rgba(232, 116, 42, 0.1);
          color: var(--orange);
          border: 1.5px solid var(--orange);
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background: var(--orange);
          color: white;
          transform: translateY(-2px);
        }
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Spinner */
        .spinner {
          width: 16px;
          height: 16px;
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
