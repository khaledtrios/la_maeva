import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    ArrowLeft,
    ArrowDownToDot,
    ArrowUpFromDot,
    Scale,
    FileText,
    Calendar,
    User,
} from 'lucide-react';
import type {
    StockMovement,
    Ingredient,
    Entity,
    Product,
    StockMovementType,
} from '@/types';
import { Badge } from '@/Components/UI/Badge';
import inventory from '@/routes/inventory';

interface MovementsIndexProps {
    movements: {
        data: (StockMovement & {
            ingredient?: { nom: string };
            product?: { nom: string; code?: string | null };
            entity: { nom: string };
            creator: { nom: string } | null;
        })[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total_entree: number;
        total_sortie: number;
        expired_count: number;
        expiring_soon_count: number;
    };
    ingredients: Ingredient[];
    products: Array<{ id: number; nom: string; code: string | null }>;
    entity: Entity;
    filters: {
        ingredient_id?: string;
        product_id?: string;
        type?: StockMovementType;
        date_from?: string;
        date_to?: string;
        dlc_status?: 'expired' | 'expiring_soon' | 'ok';
    };
}

export default function MovementsIndex({
    movements,
    stats,
    ingredients,
    products,
    entity,
    filters,
}: MovementsIndexProps) {
    const { user } = useAuth();
    const localFilters = useState(() => ({
        ingredient_id: filters.ingredient_id || '',
        product_id: filters.product_id || '',
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        dlc_status: filters.dlc_status || '',
    }))[0];
    const [searchTerm, setSearchTerm] = useState('');

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (localFilters.ingredient_id)
            params.ingredient_id = localFilters.ingredient_id;
        if (localFilters.product_id)
            params.product_id = localFilters.product_id;
        if (localFilters.type) params.type = localFilters.type;
        if (localFilters.date_from) params.date_from = localFilters.date_from;
        if (localFilters.date_to) params.date_to = localFilters.date_to;
        if (localFilters.dlc_status)
            params.dlc_status = localFilters.dlc_status;
        router.get(inventory.movements.index(), params, {
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        router.get(inventory.movements.index(), {}, { preserveScroll: true });
        setSearchTerm('');
    };

    const formatQuantity = (qty: number) => {
        const abs = Math.abs(qty);
        return qty >= 0 ? `+${abs}` : `-${abs}`;
    };

    const filteredMovements = movements.data.filter((m) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            m.ingredient?.nom.toLowerCase().includes(term) ||
            (m.lot_number && m.lot_number.toLowerCase().includes(term)) ||
            (m.reference && m.reference.toLowerCase().includes(term)) ||
            (m.provenance && m.provenance.toLowerCase().includes(term)) ||
            (m.creator?.nom?.toLowerCase().includes(term) ?? false)
        );
    });

    return (
        <div className="movements-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <Link href="/inventory">Stocks</Link>
                        <span>/</span>
                        <span>Mouvements</span>
                    </div>
                    <h1 className="page-title">Historique des Mouvements</h1>
                    <p className="page-subtitle">
                        {stats.total_sortie} sorties, {stats.total_entree}{' '}
                        entrées enregistrées
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => router.visit(inventory.index())}
                    >
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>Retour aux stocks</span>
                    </button>
                </div>
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <ArrowDownToDot size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total entrées</div>
                        <div className="stat-value stat-value--success">
                            {stats.total_entree}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--danger">
                        <ArrowUpFromDot size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total sorties</div>
                        <div className="stat-value stat-value--danger">
                            {stats.total_sortie}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--warning">
                        <Calendar size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Lots expirés</div>
                        <div className="stat-value stat-value--warning">
                            {stats.expired_count}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Calendar size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Expire sous 3j</div>
                        <div className="stat-value">
                            {stats.expiring_soon_count}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FILTRES ── */}
            <div className="filters-card">
                <div className="filters-row">
                    <div className="search-box">
                        <FileText size={16} strokeWidth={1.5} />
                        <input
                            type="text"
                            placeholder="Rechercher ingrédient, lot, référence..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filters-group">
                        <select
                            value={localFilters.ingredient_id}
                            onChange={(e) =>
                                (localFilters.ingredient_id = e.target.value)
                            }
                            className="filter-select"
                        >
                            <option value="">Tous les ingrédients</option>
                            {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                    {ing.nom}
                                </option>
                            ))}
                        </select>
                        <select
                            value={localFilters.type}
                            onChange={(e) =>
                                (localFilters.type = e.target.value)
                            }
                            className="filter-select"
                        >
                            <option value="">Tous les types</option>
                            <option value="ENTREE">Entrées</option>
                            <option value="SORTIE">Sorties</option>
                            <option value="AJUSTEMENT">Ajustements</option>
                        </select>
                        <button className="btn-primary" onClick={applyFilters}>
                            Filtrer
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={clearFilters}
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            {/* ── LISTE DES MOUVEMENTS ── */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Mouvements de stock</span>
                    </div>
                    <div className="table-count">
                        {filteredMovements.length} sur {movements.total}{' '}
                        mouvement
                        {movements.total > 1 ? 's' : ''}
                    </div>
                </div>

                {filteredMovements.length === 0 ? (
                    <div className="empty-state-card">
                        <Scale size={48} strokeWidth={1} />
                        <div className="empty-state-text">
                            Aucun mouvement trouvé pour ces critères
                        </div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Ingrédient</th>
                                    <th className="text-right">Quantité</th>
                                    <th>Lot / DLC</th>
                                    <th>Référence</th>
                                    <th>Provenance</th>
                                    <th>Utilisateur</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovements.map((movement, i) => (
                                    <tr
                                        key={movement.id}
                                        className={
                                            movement.type === 'SORTIE'
                                                ? 'row-warning row-warning--low'
                                                : movement.type === 'ENTREE'
                                                  ? 'row-success'
                                                  : ''
                                        }
                                        style={{
                                            animationDelay: `${i * 0.03}s`,
                                        }}
                                    >
                                        <td className="text-muted">
                                            {new Date(
                                                movement.created_at,
                                            ).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td>
                                            <Badge
                                                variant={
                                                    movement.type === 'ENTREE'
                                                        ? 'success'
                                                        : movement.type ===
                                                            'SORTIE'
                                                          ? 'danger'
                                                          : 'warning'
                                                }
                                            >
                                                {movement.type === 'ENTREE' && (
                                                    <ArrowDownToDot size={10} />
                                                )}
                                                {movement.type === 'SORTIE' && (
                                                    <ArrowUpFromDot size={10} />
                                                )}
                                                {movement.type ===
                                                    'AJUSTEMENT' && (
                                                    <Scale size={10} />
                                                )}
                                                <span>
                                                    {movement.type === 'ENTREE'
                                                        ? 'Entrée'
                                                        : movement.type ===
                                                            'SORTIE'
                                                          ? 'Sortie'
                                                          : 'Ajustement'}
                                                </span>
                                            </Badge>
                                        </td>
                                        <td>
                                            <span className="product-name">
                                                {movement.ingredient?.nom}{' '}
                                                {'(' +
                                                    movement.ingredient?.unite +
                                                    ')'}
                                            </span>
                                        </td>
                                        <td
                                            className={`text-right font-semibold ${
                                                movement.type === 'ENTREE'
                                                    ? 'text-success'
                                                    : movement.type === 'SORTIE'
                                                      ? 'text-danger'
                                                      : 'text-warning'
                                            }`}
                                        >
                                            {formatQuantity(
                                                Number(movement.quantite),
                                            )}
                                        </td>
                                        <td className="text-muted">
                                            {movement.lot_number && (
                                                <div className="lot-info">
                                                    <span className="lot-number">
                                                        {movement.lot_number}
                                                    </span>
                                                </div>
                                            )}
                                            {movement.dlc && (
                                                <div className="dlc-info">
                                                    DLC: {movement.dlc}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-muted">
                                            {movement.reference || '-'}
                                        </td>
                                        <td className="text-muted">
                                            {movement.provenance || '-'}
                                        </td>
                                        <td className="text-muted">
                                            <span className="user-info">
                                                <User size={12} />
                                                {movement.creator?.nom ||
                                                    'Système'}
                                            </span>
                                        </td>
                                        <td
                                            className="text-muted"
                                            style={{ maxWidth: '200px' }}
                                        >
                                            <span
                                                title={movement.notes || ''}
                                                className="notes-text"
                                            >
                                                {(movement.notes || '').slice(
                                                    0,
                                                    50,
                                                )}
                                                {movement.notes &&
                                                movement.notes.length > 50
                                                    ? '...'
                                                    : ''}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── PAGINATION ── */}
                {movements.last_page > 1 && (
                    <div className="pagination">
                        {Array.from(
                            { length: movements.last_page },
                            (_, i) => i + 1,
                        ).map((page) => (
                            <button
                                key={page}
                                className={`pagination-btn ${page === movements.current_page ? 'active' : ''}`}
                                onClick={() =>
                                    router.get(
                                        inventory.movements.index(),
                                        { page },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .movements-page { display: flex; flex-direction: column; gap: 1.5rem; }
                .breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: var(--text-3);
                    margin-bottom: 0.5rem;
                }
                .breadcrumb a { color: var(--orange); text-decoration: none; }
                .breadcrumb a:hover { text-decoration: underline; }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
                .stat-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    border: 1px solid var(--border);
                }
                .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-icon--success { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .stat-icon--danger { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
                .stat-icon--warning { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .stat-icon--orange { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .stat-content { flex: 1; }
                .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--orange); line-height: 1.2; }
                .stat-value--success { color: var(--success); }
                .stat-value--danger { color: var(--danger); }

                /* Filters */
                .filters-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    padding: 1rem 1.25rem;
                }
                .filters-row {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                @media (min-width: 768px) {
                    .filters-row { flex-direction: row; align-items: center; justify-content: space-between; }
                }
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    padding: 0.5rem 1rem;
                    flex: 1;
                    max-width: 400px;
                }
                .search-box svg { color: var(--text-3); }
                .search-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 0.875rem;
                    color: var(--text-1);
                }
                .filters-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
                .filter-select {
                    padding: 0.5rem 0.85rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    color: var(--text-1);
                    outline: none;
                    min-width: 160px;
                }
                .filter-select:focus { border-color: var(--orange); }

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
                .table-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-2); }
                .table-dot { width: 8px; height: 8px; background: var(--orange); border-radius: 50%; }
                .table-count { font-size: 0.7rem; color: var(--text-3); background: var(--bg-card-2); padding: 0.25rem 0.7rem; border-radius: 20px; }

                /* Table */
                .table-wrapper { overflow-x: auto; }
                .data-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
                .data-table thead tr { border-bottom: 2px solid var(--border); }
                .data-table th {
                    padding: 0.75rem 1rem;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                    white-space: nowrap;
                }
                .data-table th.text-right { text-align: right; }
                .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .data-table tbody tr:hover { background: var(--bg-card-2); }
                .data-table tbody tr.row-warning { background: rgba(214, 59, 59, 0.06); }
                .data-table tbody tr.row-success { background: rgba(30, 158, 106, 0.06); }
                .data-table td { padding: 0.75rem 1rem; vertical-align: middle; }
                .data-table td.text-right { text-align: right; }
                .product-name { font-weight: 600; color: var(--text-1); }
                .text-success { color: var(--success); font-weight: 600; }
                .text-danger { color: var(--danger); font-weight: 600; }
                .text-warning { color: var(--orange); font-weight: 600; }
                .text-muted { color: var(--text-3); }
                .lot-info, .dlc-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                    font-size: 0.75rem;
                }
                .lot-number { font-weight: 600; color: var(--text-2); }
                .dlc-info { color: var(--text-3); }
                .user-info { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; }
                .notes-text { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

                /* Pagination */
                .pagination {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1rem;
                }
                .pagination-btn {
                    padding: 0.5rem 0.85rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: var(--text-2);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pagination-btn:hover { border-color: var(--orange); color: var(--orange); }
                .pagination-btn.active {
                    background: var(--orange);
                    color: white;
                    border-color: var(--orange);
                }

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: var(--bg-card-2);
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-secondary:hover { border-color: var(--orange); color: var(--orange); }
            `}</style>
        </div>
    );
}
