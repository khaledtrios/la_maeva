import { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    Package,
    AlertTriangle,
    AlertCircle,
    Calendar,
    TrendingUp,
    DollarSign,
    Plus,
    Minus,
    X,
    Edit3,
    RefreshCw,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import type {
    StockByProduct,
    DetailedLot,
    DlcAlert,
    StockSummary,
    BoutiqueData,
} from '@/types';

interface Props {
    stock_by_product: StockByProduct[];
    detailed_lots: DetailedLot[];
    expiring_lots: DlcAlert[];
    expired_lots: DlcAlert[];
    total_value: number;
    total_quantity: number;
    valid_quantity: number;
    products: Array<{
        id: number;
        nom: string;
        code: string | null;
        category: { nom: string };
    }>;
    entity: { id: number; nom: string; type: string };
}

export default function StockIndex() {
    const props = usePage().props as any;
    const {
        stock_by_product,
        detailed_lots,
        expiring_lots,
        expired_lots,
        total_value,
        total_quantity,
        valid_quantity,
        products,
        entity,
    } = props;

    const { user, hasRole } = useAuth();
    const canAdjust = hasRole('RESP_BOUTIQUE', 'ADMIN');

    // États UI
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustProductId, setAdjustProductId] = useState<number | null>(null);
    const [adjustLotId, setAdjustLotId] = useState<number | null>(null);
    const [adjustForm, setAdjustForm] = useState({
        product_id: '',
        quantite_delta: '',
        raison: '',
        lot_number: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filtrer les lots détaillés par produit sélectionné
    const filteredLots = selectedProduct
        ? (detailed_lots as DetailedLot[]).filter(
              (lot) => lot.product_id === selectedProduct,
          )
        : (detailed_lots as DetailedLot[]);

    // Fonctions
    const openAdjustModal = (
        productId?: number,
        lotId?: number | null | undefined,
        lotNumber?: string | null | undefined,
    ) => {
        if (!canAdjust) return;
        setAdjustProductId(productId ?? null);
        setAdjustLotId(lotId ?? null);
        setAdjustForm({
            product_id: productId?.toString() ?? '',
            quantite_delta: '',
            raison: '',
            lot_number: lotNumber ?? '',
        });
        setShowAdjustModal(true);
    };

    const closeAdjustModal = () => {
        setShowAdjustModal(false);
        setAdjustProductId(null);
        setAdjustLotId(null);
        setAdjustForm({
            product_id: '',
            quantite_delta: '',
            raison: '',
            lot_number: '',
        });
    };

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const delta = parseInt(adjustForm.quantite_delta);
        if (isNaN(delta)) {
            setSubmitting(false);
            return;
        }

        router.post(
            '/stock/adjust',
            {
                product_id: parseInt(adjustForm.product_id),
                quantite_delta: delta,
                raison: adjustForm.raison,
                lot_number: adjustForm.lot_number || null,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    closeAdjustModal();
                },
                onError: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    const handleRefresh = () => {
        setIsLoading(true);
        router.reload({
            onFinish: () => setIsLoading(false),
        });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isExpired = (dlc: string | null) => {
        if (!dlc) return false;
        return new Date(dlc) < new Date();
    };

    const isExpiringSoon = (dlc: string | null, days = 3) => {
        if (!dlc) return false;
        const limit = new Date();
        limit.setDate(limit.getDate() + days);
        return new Date(dlc) <= limit && new Date(dlc) > new Date();
    };

    const expiringLots = (expiring_lots as DlcAlert[]) || [];
    const expiredLotsData = (expired_lots as DlcAlert[]) || [];

    const productCount = (stock_by_product as StockByProduct[])?.length || 0;
    const healthyCount =
        (stock_by_product as StockByProduct[])?.filter(
            (item) => !item.earliest_dlc || !isExpired(item.earliest_dlc),
        ).length || 0;

    return (
        <div className="stock-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des stocks</h1>
                    <p className="page-subtitle">
                        {entity?.nom || 'Entité'} • {productCount} produit
                        {productCount > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            size={16}
                            strokeWidth={1.5}
                            className={isLoading ? 'spin' : ''}
                        />
                        Rafraîchir
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Package size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Quantité totale</div>
                        <div className="stat-value">
                            {total_quantity?.toLocaleString() || 0}
                        </div>
                        <div className="stat-subvalue">
                            <span className="text-success">
                                Valide: {valid_quantity?.toLocaleString() || 0}
                            </span>
                            {' • '}
                            <span className="text-danger">
                                Expiré:{' '}
                                {(
                                    total_quantity - valid_quantity
                                )?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <DollarSign size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Valeur totale</div>
                        <div className="stat-value stat-value--success">
                            {Number(total_value || 0).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            €
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
                            {expiredLotsData.length}
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
                            {expiringLots.length}
                        </div>
                        <div className="stat-subvalue">dans les 3 jours</div>
                    </div>
                </div>
            </div>

            {/* Alertes DLC */}
            {(expiredLotsData.length > 0 || expiringLots.length > 0) && (
                <div className="alerts-section">
                    {expiredLotsData.length > 0 && (
                        <div className="alert alert-danger">
                            <AlertCircle size={18} strokeWidth={2} />
                            <div className="alert-content">
                                <strong>
                                    {expiredLotsData.length} lot(s) expiré(s)
                                </strong>
                                <p className="alert-description">
                                    Ces lots ne doivent pas être vendus :
                                </p>
                                <div className="alert-list">
                                    {expiredLotsData
                                        .slice(0, 5)
                                        .map((lot, idx) => (
                                            <span
                                                key={idx}
                                                className="alert-tag danger"
                                            >
                                                {lot.product_nom} (
                                                {lot.quantite} u) — DLC:{' '}
                                                {formatDate(lot.dlc)}
                                            </span>
                                        ))}
                                    {expiredLotsData.length > 5 && (
                                        <span className="alert-tag more">
                                            +{expiredLotsData.length - 5}{' '}
                                            autre(s)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {expiringLots.length > 0 && (
                        <div className="alert alert-warning">
                            <AlertTriangle size={18} strokeWidth={2} />
                            <div className="alert-content">
                                <strong>
                                    {expiringLots.length} lot(s) expirent
                                    bientôt (≤3j)
                                </strong>
                                <p className="alert-description">
                                    Prioriser la vente de ces lots :
                                </p>
                                <div className="alert-list">
                                    {expiringLots
                                        .slice(0, 5)
                                        .map((lot, idx) => (
                                            <span
                                                key={idx}
                                                className="alert-tag warning"
                                            >
                                                {lot.product_nom} (
                                                {lot.quantite} u) — DLC:{' '}
                                                {formatDate(lot.dlc)}
                                            </span>
                                        ))}
                                    {expiringLots.length > 5 && (
                                        <span className="alert-tag more">
                                            +{expiringLots.length - 5} autre(s)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filtres */}
            <div className="filters-card">
                <div className="filters-header">
                    <div className="filters-title">
                        <div className="filters-dot" />
                        <span>Filtres</span>
                    </div>
                    <Link href="/stock/movements" className="btn-ghost-sm">
                        <Clock size={14} strokeWidth={1.5} />
                        Historique des mouvements
                    </Link>
                </div>
                <div className="filters-body">
                    <div className="filter-group">
                        <label className="filter-label">
                            Filtrer par produit
                        </label>
                        <select
                            value={selectedProduct ?? ''}
                            onChange={(e) =>
                                setSelectedProduct(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            className="filter-select"
                        >
                            <option value="">Tous les produits</option>
                            {products?.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.nom} {p.code ? `(${p.code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tableau stock par produit */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Stock par produit</span>
                    </div>
                    <div className="table-count">
                        {(stock_by_product as StockByProduct[])?.length || 0}{' '}
                        produit(s)
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Catégorie</th>
                                <th className="text-right">Valide</th>
                                <th className="text-right">Expiré</th>
                                <th className="text-right">Total</th>
                                <th>DLC min</th>
                                <th>DLC max</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stock_by_product as StockByProduct[])?.map(
                                (item) => {
                                    const expired =
                                        item.earliest_dlc &&
                                        isExpired(item.earliest_dlc);
                                    const expiring =
                                        item.earliest_dlc &&
                                        !expired &&
                                        isExpiringSoon(item.earliest_dlc);
                                    return (
                                        <tr
                                            key={item.product_id}
                                            className={
                                                selectedProduct ===
                                                item.product_id
                                                    ? 'highlighted'
                                                    : ''
                                            }
                                        >
                                            <td>
                                                <div className="product-cell">
                                                    <span className="product-name">
                                                        {item.product_nom}
                                                    </span>
                                                    {item.product_code && (
                                                        <span className="product-code">
                                                            {item.product_code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="category-badge">
                                                    {item.category_nom}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span
                                                    className={`quantity-value ${item.valid_quantity <= 0 ? 'zero' : ''}`}
                                                >
                                                    {item.valid_quantity}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span
                                                    className={`quantity-value ${item.expired_quantity <= 0 ? 'zero' : ''} text-danger`}
                                                >
                                                    {item.expired_quantity}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span
                                                    className={`quantity-value ${item.total_quantity <= 0 ? 'zero' : ''}`}
                                                >
                                                    {item.total_quantity}
                                                </span>
                                            </td>
                                            <td>
                                                {item.earliest_dlc ? (
                                                    <span
                                                        className={`dlc-badge ${expired ? 'expired' : expiring ? 'expiring' : ''}`}
                                                    >
                                                        <Calendar
                                                            size={12}
                                                            strokeWidth={1.5}
                                                        />
                                                        {formatDate(
                                                            item.earliest_dlc,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {item.latest_dlc ? (
                                                    <span className="dlc-badge">
                                                        <Calendar
                                                            size={12}
                                                            strokeWidth={1.5}
                                                        />
                                                        {formatDate(
                                                            item.latest_dlc,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <div className="table-actions">
                                                    {canAdjust && (
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() =>
                                                                openAdjustModal(
                                                                    item.product_id,
                                                                )
                                                            }
                                                            title="Ajuster le stock"
                                                        >
                                                            <Edit3
                                                                size={16}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() =>
                                                            setSelectedProduct(
                                                                item.product_id,
                                                            )
                                                        }
                                                        title="Voir les lots"
                                                    >
                                                        <Eye
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                },
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="mobile-list">
                    {(stock_by_product as StockByProduct[])?.map((item) => {
                        const expired =
                            item.earliest_dlc && isExpired(item.earliest_dlc);
                        const expiring =
                            item.earliest_dlc &&
                            !expired &&
                            isExpiringSoon(item.earliest_dlc);
                        return (
                            <div key={item.product_id} className="mobile-row">
                                <div className="mobile-row-top">
                                    <span className="mobile-name">
                                        {item.product_nom}
                                    </span>
                                    <span className="category-badge-sm">
                                        {item.category_nom}
                                    </span>
                                </div>
                                <div className="mobile-stats">
                                    <div className="mobile-stat">
                                        <span className="mobile-stat-label">
                                            Valide
                                        </span>
                                        <span
                                            className={`mobile-stat-value ${item.valid_quantity <= 0 ? 'zero' : ''}`}
                                        >
                                            {item.valid_quantity}
                                        </span>
                                    </div>
                                    <div className="mobile-stat-divider" />
                                    <div className="mobile-stat">
                                        <span className="mobile-stat-label">
                                            Expiré
                                        </span>
                                        <span
                                            className={`mobile-stat-value text-danger`}
                                        >
                                            {item.expired_quantity}
                                        </span>
                                    </div>
                                    <div className="mobile-stat-divider" />
                                    <div className="mobile-stat">
                                        <span className="mobile-stat-label">
                                            Total
                                        </span>
                                        <span
                                            className={`mobile-stat-value ${item.total_quantity <= 0 ? 'zero' : ''}`}
                                        >
                                            {item.total_quantity}
                                        </span>
                                    </div>
                                    <div className="mobile-stat-divider" />
                                    <div className="mobile-stat">
                                        <span className="mobile-stat-label">
                                            DLC min
                                        </span>
                                        <span
                                            className={`dlc-badge-mobile ${expired ? 'expired' : expiring ? 'expiring' : ''}`}
                                        >
                                            {item.earliest_dlc
                                                ? formatDate(item.earliest_dlc)
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mobile-actions">
                                    {canAdjust && (
                                        <button
                                            className="btn-icon"
                                            onClick={() =>
                                                openAdjustModal(item.product_id)
                                            }
                                        >
                                            <Edit3
                                                size={14}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    )}
                                    <button
                                        className="btn-icon"
                                        onClick={() =>
                                            setSelectedProduct(item.product_id)
                                        }
                                    >
                                        <Eye size={14} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lots détaillés */}
            {selectedProduct && filteredLots.length > 0 && (
                <div className="lots-card">
                    <div className="lots-header">
                        <div className="lots-title">
                            <Package size={18} strokeWidth={1.5} />
                            <span>
                                Lots détaillés —{' '}
                                {
                                    products?.find(
                                        (p: any) => p.id === selectedProduct,
                                    )?.nom
                                }
                            </span>
                        </div>
                        <button
                            className="btn-ghost-sm"
                            onClick={() => setSelectedProduct(null)}
                        >
                            <X size={14} strokeWidth={1.5} />
                            Fermer
                        </button>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Lot</th>
                                    <th className="text-right">Quantité</th>
                                    <th>DLC</th>
                                    <th>Statut</th>
                                    {canAdjust && (
                                        <th className="text-center">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLots.map((lot, idx) => {
                                    const expired = isExpired(lot.dlc);
                                    const expiring =
                                        !expired && isExpiringSoon(lot.dlc);
                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <span className="lot-number">
                                                    {lot.lot_number ||
                                                        'Lot sans N°'}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span
                                                    className={`quantity-value ${lot.quantite <= 0 ? 'zero' : ''}`}
                                                >
                                                    {lot.quantite}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`dlc-badge ${expired ? 'expired' : expiring ? 'expiring' : ''}`}
                                                >
                                                    <Calendar
                                                        size={12}
                                                        strokeWidth={1.5}
                                                    />
                                                    {formatDate(lot.dlc)}
                                                </span>
                                            </td>
                                            <td>
                                                {expired ? (
                                                    <span className="status-badge status-badge--danger">
                                                        <XCircle
                                                            size={12}
                                                            strokeWidth={1.5}
                                                        />
                                                        Expiré
                                                    </span>
                                                ) : expiring ? (
                                                    <span className="status-badge status-badge--warning">
                                                        <AlertTriangle
                                                            size={12}
                                                            strokeWidth={1.5}
                                                        />
                                                        Expire bientôt
                                                    </span>
                                                ) : (
                                                    <span className="status-badge status-badge--success">
                                                        <CheckCircle
                                                            size={12}
                                                            strokeWidth={1.5}
                                                        />
                                                        OK
                                                    </span>
                                                )}
                                            </td>
                                            {canAdjust && (
                                                <td className="text-center">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() =>
                                                            openAdjustModal(
                                                                lot.product_id ??
                                                                    undefined,
                                                                lot.id,
                                                                lot.lot_number,
                                                            )
                                                        }
                                                        title="Ajuster le lot"
                                                    >
                                                        <Edit3
                                                            size={14}
                                                            strokeWidth={1.5}
                                                        />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Ajustement */}
            {showAdjustModal && (
                <div className="modal-overlay" onClick={closeAdjustModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Ajustement de stock
                                </h3>
                                <p className="modal-subtitle">
                                    Modifier la quantité en stock
                                </p>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeAdjustModal}
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={handleAdjustSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">
                                        Produit
                                    </label>
                                    <select
                                        value={adjustForm.product_id}
                                        onChange={(e) =>
                                            setAdjustForm({
                                                ...adjustForm,
                                                product_id: e.target.value,
                                            })
                                        }
                                        className="form-select"
                                        required
                                        disabled={!!adjustLotId}
                                    >
                                        <option value="">
                                            Sélectionner un produit
                                        </option>
                                        {products?.map((p: any) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nom}{' '}
                                                {p.code ? `(${p.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Type d'ajustement
                                    </label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="delta_type"
                                                value="in"
                                                checked={
                                                    !adjustForm.quantite_delta ||
                                                    parseInt(
                                                        adjustForm.quantite_delta,
                                                    ) >= 0
                                                }
                                                onChange={() => {
                                                    const current = parseInt(
                                                        adjustForm.quantite_delta,
                                                    );
                                                    if (
                                                        !isNaN(current) &&
                                                        current < 0
                                                    ) {
                                                        setAdjustForm({
                                                            ...adjustForm,
                                                            quantite_delta:
                                                                Math.abs(
                                                                    current,
                                                                ).toString(),
                                                        });
                                                    }
                                                }}
                                            />
                                            <Plus
                                                size={16}
                                                strokeWidth={1.5}
                                                className="text-success"
                                            />
                                            Entrée (stock supplémentaire)
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="delta_type"
                                                value="out"
                                                checked={
                                                    !!adjustForm.quantite_delta &&
                                                    parseInt(
                                                        adjustForm.quantite_delta,
                                                    ) < 0
                                                }
                                                onChange={() => {
                                                    const current = parseInt(
                                                        adjustForm.quantite_delta,
                                                    );
                                                    if (
                                                        !isNaN(current) &&
                                                        current >= 0
                                                    ) {
                                                        setAdjustForm({
                                                            ...adjustForm,
                                                            quantite_delta: `-${current || 1}`,
                                                        });
                                                    } else if (
                                                        !adjustForm.quantite_delta
                                                    ) {
                                                        setAdjustForm({
                                                            ...adjustForm,
                                                            quantite_delta:
                                                                '-1',
                                                        });
                                                    }
                                                }}
                                            />
                                            <Minus
                                                size={16}
                                                strokeWidth={1.5}
                                                className="text-danger"
                                            />
                                            Sortie (casse, perte, erreur)
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Quantité
                                    </label>
                                    <input
                                        type="number"
                                        value={adjustForm.quantite_delta}
                                        onChange={(e) =>
                                            setAdjustForm({
                                                ...adjustForm,
                                                quantite_delta: e.target.value,
                                            })
                                        }
                                        className="form-input"
                                        required
                                        placeholder="ex: 5"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Lot{' '}
                                        <span className="form-optional">
                                            optionnel
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={adjustForm.lot_number}
                                        onChange={(e) =>
                                            setAdjustForm({
                                                ...adjustForm,
                                                lot_number: e.target.value,
                                            })
                                        }
                                        className="form-input"
                                        placeholder="ex: LOT-2024-001"
                                    />
                                    <p className="form-hint">
                                        Laissez vide pour ajuster le lot FIFO
                                        (le plus ancien)
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Raison{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <textarea
                                        value={adjustForm.raison}
                                        onChange={(e) =>
                                            setAdjustForm({
                                                ...adjustForm,
                                                raison: e.target.value,
                                            })
                                        }
                                        className="form-textarea"
                                        rows={3}
                                        required
                                        placeholder="Ex: casse lors du transport, erreur de saisie..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-neutral"
                                    onClick={closeAdjustModal}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="spinner" />
                                    ) : (
                                        <CheckCircle
                                            size={16}
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {submitting
                                        ? 'En cours...'
                                        : "Confirmer l'ajustement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .stock-page {
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
                .header-actions {
                    display: flex;
                    gap: 0.5rem;
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
                .stat-subvalue {
                    font-size: 0.65rem;
                    color: var(--text-3);
                    margin-top: 2px;
                }

                /* Alerts */
                .alerts-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .alert {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-radius: 12px;
                    border-left: 4px solid;
                }
                .alert-danger {
                    background: var(--danger-bg);
                    border-left-color: var(--danger);
                }
                .alert-warning {
                    background: var(--warning-bg);
                    border-left-color: var(--warning);
                }
                .alert-content {
                    flex: 1;
                }
                .alert-content strong {
                    display: block;
                    margin-bottom: 0.25rem;
                    color: var(--text-1);
                }
                .alert-description {
                    font-size: 0.75rem;
                    color: var(--text-2);
                    margin-bottom: 0.5rem;
                }
                .alert-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .alert-tag {
                    font-size: 0.7rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    background: rgba(0,0,0,0.05);
                }
                .alert-tag.danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .alert-tag.warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .alert-tag.more {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
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
                    max-width: 300px;
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
                .data-table tbody tr.highlighted {
                    background: rgba(232, 116, 42, 0.05);
                }
                .data-table td {
                    padding: 0.85rem 1rem;
                }
                .data-table td.text-right {
                    text-align: right;
                }
                .data-table td.text-center {
                    text-align: center;
                }

                /* Product Cell */
                .product-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .product-code {
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .category-badge {
                    display: inline-block;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .quantity-value {
                    font-weight: 700;
                    color: var(--text-1);
                }
                .quantity-value.zero {
                    color: var(--danger);
                }
                .dlc-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.2rem 0.6rem;
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
                .dlc-badge.expiring {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .table-actions {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                }

                /* Mobile List */
                .mobile-list {
                    display: none;
                }
                @media (max-width: 768px) {
                    .table-wrapper {
                        display: none;
                    }
                    .mobile-list {
                        display: flex;
                        flex-direction: column;
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
                .category-badge-sm {
                    font-size: 0.65rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .mobile-stats {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 0.75rem;
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
                .mobile-stat-value.zero {
                    color: var(--danger);
                }
                .mobile-stat-divider {
                    width: 1px;
                    height: 30px;
                    background: var(--border);
                }
                .dlc-badge-mobile {
                    font-size: 0.7rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .dlc-badge-mobile.expired {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .dlc-badge-mobile.expiring {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .mobile-actions {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                }

                /* Lots Card */
                .lots-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .lots-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .lots-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-2);
                }
                .lot-number {
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: var(--text-2);
                }

                /* Status Badges */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.2rem 0.6rem;
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

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
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
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                    border: 1.5px solid var(--orange);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-secondary:hover {
                    background: var(--orange);
                    color: white;
                    transform: translateY(-2px);
                }
                .btn-neutral {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
                }
                .btn-ghost-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.8rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    text-decoration: none;
                }
                .btn-ghost-sm:hover {
                    background: rgba(232, 116, 42, 0.1);
                }
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
                    animation: overlayIn 0.2s ease;
                }
                @keyframes overlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 520px;
                    width: 100%;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .modal-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .modal-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-3);
                    margin-top: 4px;
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
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }

                /* Form Elements */
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    margin-bottom: 1rem;
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
                    color: var(--text-3);
                }
                .form-input, .form-select, .form-textarea {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    transition: all 0.2s;
                    width: 100%;
                }
                .form-input:focus, .form-select:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .form-hint {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    margin-top: 0.25rem;
                }
                .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .radio-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.8rem;
                }
                .text-success {
                    color: var(--success);
                }
                .text-danger {
                    color: var(--danger);
                }
                .text-orange {
                    color: var(--orange);
                }
                .text-muted {
                    color: var(--text-3);
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
                .spin {
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
