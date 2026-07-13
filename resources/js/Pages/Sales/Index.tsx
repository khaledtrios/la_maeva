import { useEffect, useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    TrendingUp,
    TrendingDown,
    Package,
    AlertCircle,
    Calendar as CalendarIcon,
    Save,
    Percent,
    Warehouse,
    Search,
} from 'lucide-react';
import { store, index } from '@/routes/sales';
import type { VenteJour, Reception } from '@/types';

interface SalesIndexProps {
    salesData: Array<{
        product_id: number;
        product: { id: number; nom: string; category: { nom: string } };
        qte_recue: number; // réceptions du jour (pour affichage info)
        qte_reste: number;
        qte_vendue: number;
        stock_disponible: number; // stock réel total disponible (FIFO)
    }>;
    date: string;
    receptions_confirmees: Reception[];
}

export default function SalesIndex({
    salesData,
    date: initialDate,
    receptions_confirmees,
}: SalesIndexProps) {
    const { user, hasRole } = useAuth();
    const [date, setDate] = useState(initialDate);

    // État local : transforme chaque item pour avoir qte_vendue_input (saisie utilisateur)
    const [localData, setLocalData] = useState(
        salesData.map((d) => ({
            product_id: d.product_id,
            product: d.product,
            qte_recue_jour: d.qte_recue, // affichage seulement
            stock_disponible: d.stock_disponible,
            qte_vendue_input: d.qte_vendue, // quantité vendue saisie
        })),
    );

    const [isLoading, setIsLoading] = useState(false);

    // Calcul dérivé de qte_reste (invendus fin de journée)
    const localDataWithReste = useMemo(
        () =>
            localData.map((item) => ({
                ...item,
                qte_reste: Math.max(
                    0,
                    item.stock_disponible +
                        item.qte_vendue_input -
                        item.qte_vendue_input,
                ),
            })),
        [localData],
    );

    // ── Search ──
    const [search, setSearch] = useState('');
    const filteredData = useMemo(
        () =>
            !search
                ? localDataWithReste
                : localDataWithReste.filter((d) =>
                      d.product.nom
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                  ),
        [localDataWithReste, search],
    );

    const form = useForm({
        date,
        lines: filteredData.map((d) => ({
            product_id: d.product_id,
            // On envoie qte_recue = stock_disponible (stock en début de journée)
            // pour que qte_vendue calculé = qte_recue - qte_reste = qte_vendue_input
            qte_vendue: d.qte_vendue_input,
            qte_recue: d.stock_disponible,
            qte_reste: Math.max(0, d.stock_disponible - d.qte_vendue_input),
        })),
    });

    // Synchroniser localData et form quand salesData change (ex: changement de date)
    useEffect(() => {
        setLocalData(
            salesData.map((d) => ({
                product_id: d.product_id,
                product: d.product,
                qte_recue_jour: d.qte_recue,
                stock_disponible: d.stock_disponible,
                qte_vendue_input: d.qte_vendue,
            })),
        );

        form.setData(
            'lines',
            salesData.map((d) => ({
                product_id: d.product_id,
                qte_vendue: d.qte_vendue,
                qte_recue: d.stock_disponible,
                qte_reste: Math.max(0, d.stock_disponible - d.qte_vendue),
            })),
        );
    }, [salesData]); // ✅ FIX

    // Recharger les données quand la date change
    useEffect(() => {
        setIsLoading(true);
        router.visit(window.location.pathname, {
            only: ['salesData', 'receptions_confirmees'],
            data: { date },
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    }, [date]);

    // Mise à jour de la quantité vendue saisie
    const updateVendue = (productId: number, value: number) => {
        const newValue = Math.max(0, value);
        const updated = localData.map((item) => {
            if (item.product_id === productId) {
                return { ...item, qte_vendue_input: newValue };
            }
            return item;
        });
        setLocalData(updated);

        form.setData(
            'lines',
            updated.map((d) => ({
                product_id: d.product_id,
                qte_vendue: d.qte_vendue_input,
                qte_recue: d.stock_disponible,
                qte_reste: Math.max(0, d.stock_disponible - d.qte_vendue_input),
            })),
        );
    };

    const totalVendu = localDataWithReste.reduce(
        (sum, d) => sum + d.qte_vendue_input,
        0,
    );
    const totalInvendus = localDataWithReste.reduce(
        (sum, d) => sum + d.qte_reste,
        0,
    );
    const totalRecuJour = localDataWithReste.reduce(
        (sum, d) => sum + d.qte_recue_jour,
        0,
    );
    const totalStockDisponible = localDataWithReste.reduce(
        (sum, d) => sum + d.stock_disponible,
        0,
    );
    const tauxInvendus =
        totalStockDisponible > 0
            ? ((totalInvendus / totalStockDisponible) * 100).toFixed(1)
            : '0';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation côté client (basée sur le stock connu au chargement)
        for (const line of form.data.lines) {
            const item = localData.find(
                (d) => d.product_id === line.product_id,
            );
            if (item) {
                const qteVendue = item.qte_vendue_input;
                if (qteVendue > item.stock_disponible) {
                    // Le serveur renverra une erreur précise, on peut juste logger ici
                    console.warn(
                        `Attention : vente de ${qteVendue} dépasse le stock disponible (${item.stock_disponible}) pour ${item.product.nom}`,
                    );
                }
            }
        }
        form.post(store.url(), {
            onSuccess: () => {
                router.get(
                    index.url(),
                    { date },
                    {
                        only: ['salesData'],
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            },
        });
    };

    const getTauxColor = (taux: number) => {
        if (taux > 15) return 'danger';
        if (taux > 8) return 'warning';
        return 'success';
    };

    return (
        <div className="sales-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ventes & Invendus</h1>
                    <p className="page-subtitle">
                        Suivi des ventes et des invendus par produit
                    </p>
                </div>
                <div className="date-picker">
                    <CalendarIcon size={16} strokeWidth={1.5} />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="date-input"
                    />
                </div>
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <TrendingUp size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Vendus</div>
                        <div className="stat-value stat-value--success">
                            {totalVendu}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <TrendingDown size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Invendus</div>
                        <div className="stat-value">{totalInvendus}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Package size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Réceptions (ce jour)</div>
                        <div className="stat-value">{totalRecuJour}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--blue">
                        <Warehouse size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Stock disponible</div>
                        <div className="stat-value">{totalStockDisponible}</div>
                    </div>
                </div>
            </div>

            {/* ── ALERTE SI TAUX ÉLEVÉ ── */}
            {Number(tauxInvendus) > 15 && (
                <div className="alert alert-danger">
                    <AlertCircle size={18} strokeWidth={2} />
                    <span className="alert-text">
                        <strong>Taux d'invendus élevé :</strong> {tauxInvendus}%
                        des produits n'ont pas été vendus. Vérifiez les
                        quantités commandées.
                    </span>
                </div>
            )}

            {Number(tauxInvendus) > 8 && Number(tauxInvendus) <= 15 && (
                <div className="alert alert-warning">
                    <AlertCircle size={18} strokeWidth={2} />
                    <span className="alert-text">
                        <strong>Taux d'invendus modéré :</strong> {tauxInvendus}
                        % des produits n'ont pas été vendus.
                    </span>
                </div>
            )}

            {/* ── MESSAGE SI AUCUN PRODUIT EN STOCK ── */}
            {localData.length === 0 && (
                <div className="empty-state-card">
                    <Package size={48} strokeWidth={1} />
                    <div className="empty-state-text">
                        Aucun produit en stock pour cette date
                    </div>
                    <div className="empty-state-subtext">
                        Les réceptions confirmées alimentent le stock des
                        boutiques.
                    </div>
                </div>
            )}

            {/* ── TABLEAU DES VENTES ── */}
            {localData.length > 0 && (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Saisie des ventes</span>
                        </div>
                        {!isLoading && (
                            <div
                                style={{
                                    padding: '0 1rem',
                                    marginTop: '0.5rem',
                                }}
                            >
                                <div className="search-wrap">
                                    <Search size={14} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un produit..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="finput finput--search"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="table-count">
                            {filteredData.length} produit
                            {filteredData.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner" />
                            <span>Chargement...</span>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="mobile-list">
                                {filteredData.map((d) => (
                                    <div
                                        key={d.product_id}
                                        className="mobile-row"
                                    >
                                        <div className="mobile-row-top">
                                            <span className="mobile-name">
                                                {d.product.nom}
                                            </span>
                                            <span className="mobile-category">
                                                {d.product.category.nom}
                                            </span>
                                        </div>

                                        {/* Stock disponible (info) */}
                                        <div className="mobile-stock-info">
                                            <span className="mobile-stock-label">
                                                Stock dispo.
                                            </span>
                                            <span className="mobile-stock-value">
                                                {d.stock_disponible}
                                            </span>
                                        </div>

                                        <div className="mobile-stats">
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Réceptions du jour
                                                </span>
                                                <span className="mobile-stat-value-static">
                                                    {d.qte_recue_jour}
                                                </span>
                                            </div>
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Quantité vendue
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={Math.abs(
                                                        d.stock_disponible -
                                                            d.qte_recue_jour,
                                                    )}
                                                    value={d.qte_vendue_input}
                                                    onChange={(e) =>
                                                        updateVendue(
                                                            d.product_id,
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="mobile-input mobile-input--vendue"
                                                />
                                            </div>
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Invendus fin de jour
                                                </span>
                                                <span className="mobile-stat-value mobile-stat-value--warn">
                                                    {d.qte_reste}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="table-wrapper">
                                <form onSubmit={handleSubmit}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Produit</th>
                                                <th className="text-right">
                                                    Stock dispo.
                                                </th>
                                                <th className="text-right">
                                                    Récep. jour
                                                </th>
                                                <th className="text-right">
                                                    Quantité vendue
                                                </th>
                                                <th className="text-right">
                                                    Invendus (fin)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.map((d) => (
                                                <tr key={d.product_id}>
                                                    <td className="product-name">
                                                        {d.product.nom}
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="badge badge--info">
                                                            {d.stock_disponible}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="static-value">
                                                            {d.qte_recue_jour}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={Math.abs(
                                                                d.qte_vendue_input +
                                                                    d.stock_disponible,
                                                            )}
                                                            value={
                                                                d.qte_vendue_input
                                                            }
                                                            onChange={(e) =>
                                                                updateVendue(
                                                                    d.product_id,
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            className="table-input table-input--vendue"
                                                        />
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="static-value static-value--warn">
                                                            {d.qte_reste}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="form-footer">
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="btn-primary"
                                        >
                                            {form.processing ? (
                                                <span className="spinner" />
                                            ) : (
                                                <Save
                                                    size={16}
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                            {form.processing
                                                ? 'Enregistrement...'
                                                : 'Enregistrer les ventes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
                .sales-page {
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

                /* Date Picker */
                .date-picker {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-card);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    padding: 0.4rem 0.85rem;
                    transition: all 0.2s ease;
                }
                .date-picker:focus-within {
                    border-color: var(--orange);
                    box-shadow: 0 0 0 2px rgba(232, 116, 42, 0.1);
                }
                .date-input {
                    border: none;
                    background: transparent;
                    padding: 0;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-1);
                    cursor: pointer;
                    outline: none;
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
                .stat-icon--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .stat-icon--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
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
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
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
                .stat-value--success {
                    color: var(--success);
                }
                .stat-value--danger {
                    color: var(--danger);
                }
                .stat-value--warning {
                    color: #f59e0b;
                }

                /* Alerts */
                .alert {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    border-radius: 12px;
                }
                .alert-danger {
                    background: rgba(214, 59, 59, 0.1);
                    border-left: 4px solid var(--danger);
                }
                .alert-warning {
                    background: rgba(245, 158, 11, 0.1);
                    border-left: 4px solid #f59e0b;
                }
                .alert-text {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-2);
                }

                /* Empty State */
                .empty-state-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
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
                    font-weight: 600;
                }
                .empty-state-subtext {
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
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
                    margin-bottom: 0.75rem;
                }
                .mobile-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-1);
                }
                .mobile-category {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }
                .mobile-stock-info {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.25rem 0.5rem;
                    background: rgba(59, 130, 246, 0.08);
                    border-radius: 6px;
                    margin-bottom: 0.5rem;
                    font-size: 0.75rem;
                }
                .mobile-stock-label {
                    color: var(--text-3);
                }
                .mobile-stock-value {
                    font-weight: 600;
                    color: #3b82f6;
                }
                .mobile-stats {
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                }
                .mobile-stat {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .mobile-stat-label {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .mobile-stat-value {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .mobile-stat-value-static {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-2);
                }
                .mobile-stat-value--warn {
                    color: #f59e0b;
                    font-weight: 700;
                }
                .mobile-input {
                    width: 100%;
                    padding: 0.4rem 0.5rem;
                    font-size: 0.85rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    text-align: center;
                }
                .mobile-input:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .mobile-input--vendue {
                    border-color: var(--success);
                }
                .mobile-input--vendue:focus {
                    border-color: var(--success);
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
                .category-name {
                    font-size: 0.8rem;
                    color: var(--text-3);
                }
                .table-input {
                    width: 90px;
                    padding: 0.4rem 0.5rem;
                    font-size: 0.85rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    text-align: right;
                }
                .table-input:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .table-input--vendue {
                    border-color: var(--success);
                }
                .table-input--vendue:focus {
                    border-color: var(--success);
                }
                .static-value {
                    font-weight: 600;
                    color: var(--text-2);
                }
                .static-value--warn {
                    color: #f59e0b;
                    font-weight: 700;
                }
                .badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .badge--info {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                /* Search input */
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 260px; }

                /* Form Footer */
                .form-footer {
                    display: flex;
                    justify-content: flex-end;
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
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
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
