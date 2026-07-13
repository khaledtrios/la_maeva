import { Head, Link, router, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import expeditions from '@/routes/expeditions';
import {
    Truck,
    Package,
    MapPin,
    Calendar,
    User,
    CheckCircle,
    Clock,
    ArrowLeft,
    FileText,
} from 'lucide-react';

interface ShowProps {
    expedition: {
        id: number;
        date: string;
        statut: string;
        created_by: number;
        created_at: string;
        entity: {
            id: number;
            nom: string;
            adresse: string | null;
        } | null;
        boulangerie: {
            id: number;
            nom: string;
            adresse: string | null;
        } | null;
        creator: {
            id: number;
            nom: string;
        } | null;
        lines: Array<{
            id: number;
            product_id: number;
            quantite: number;
            dlc: string | null;
            lot_reference: string | null;
            product: {
                id: number;
                nom: string;
                code: string | null;
                category: {
                    id: number;
                    nom: string;
                } | null;
            } | null;
        }>;
        reception: {
            id: number;
            statut: string;
            date: string;
            lines: Array<{
                id: number;
                product_id: number;
                qte_attendue: number;
                qte_recue: number | null;
                ecart: number | null;
                product: {
                    id: number;
                    nom: string;
                } | null;
            }>;
        } | null;
    };
}

export default function ExpeditionsShow() {
    const { user } = useAuth();
    const page = usePage<PageProps>().props;
    const { expedition } = page as unknown as ShowProps;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
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

    const getStatusInfo = (statut: string) => {
        switch (statut) {
            case 'BROUILLON':
                return {
                    label: 'Brouillon',
                    class: 'status-badge status-badge--warning',
                    icon: <Clock size={12} strokeWidth={1.5} />,
                };
            case 'ENVOYEE':
                return {
                    label: 'Envoyée',
                    class: 'status-badge status-badge--info',
                    icon: <Truck size={12} strokeWidth={1.5} />,
                };
            case 'RECUE':
                return {
                    label: 'Reçue',
                    class: 'status-badge status-badge--success',
                    icon: <CheckCircle size={12} strokeWidth={1.5} />,
                };
            default:
                return {
                    label: statut,
                    class: 'status-badge status-badge--default',
                    icon: null,
                };
        }
    };

    const totalQuantity = expedition.lines.reduce(
        (sum, line) => sum + (line.quantite || 0),
        0,
    );

    const statusInfo = getStatusInfo(expedition.statut);

    const handleSend = () => {
        router.put(
            expeditions.status.url(expedition.id),
            { statut: 'ENVOYEE' },
            {},
        );
    };

    const handleMarkReceived = () => {
        router.put(
            expeditions.status.url(expedition.id),
            { statut: 'RECUE' },
            {},
        );
    };

    const isLaboRole = () => {
        return ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'].includes(
            user?.role || '',
        );
    };

    return (
        <>
            <Head title={`BL #${expedition.id}`} />

            <div className="expedition-show-page">
                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <Link href={expeditions.index()} className="back-link">
                            <ArrowLeft size={18} strokeWidth={1.5} />
                            Retour aux expéditions
                        </Link>
                        <h1 className="page-title">
                            Bon de livraison #{expedition.id}
                        </h1>
                        <div className="page-meta">
                            <span className="meta-item">
                                <Calendar size={14} strokeWidth={1.5} />
                                Date: {formatDate(expedition.date)}
                            </span>
                            <span className="meta-item">
                                <User size={14} strokeWidth={1.5} />
                                Créé par: {expedition.creator?.nom || 'Inconnu'}
                            </span>
                        </div>
                    </div>
                    <div className="header-actions">
                        {expedition.statut === 'BROUILLON' && isLaboRole() && (
                            <button
                                onClick={handleSend}
                                className="btn-primary"
                            >
                                <Truck size={16} strokeWidth={1.5} />
                                Envoyer le BL
                            </button>
                        )}
                        {expedition.statut === 'ENVOYEE' && isLaboRole() && (
                            <button
                                onClick={handleMarkReceived}
                                className="btn-primary"
                            >
                                <CheckCircle size={16} strokeWidth={1.5} />
                                Marquer reçue
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Card */}
                <div className="expedition-card">
                    {/* Hero Header */}
                    <div className="expedition-hero">
                        <div className="expedition-hero-left">
                            <div className="expedition-reference">
                                BL #{expedition.id}
                            </div>
                            <div className="expedition-destination">
                                <MapPin size={16} strokeWidth={1.5} />
                                Destinataire:{' '}
                                {expedition.boulangerie?.nom ||
                                    'Boulangerie inconnue'}
                                {expedition.boulangerie?.adresse && (
                                    <span className="destination-address">
                                        — {expedition.boulangerie.adresse}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="expedition-hero-right">
                            <span className={statusInfo.class}>
                                {statusInfo.icon}
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Produits */}
                    <div className="section-products">
                        <div className="section-header">
                            <Package size={16} strokeWidth={1.5} />
                            <span>Produits expédiés</span>
                            <span className="product-count">
                                {expedition.lines.length} référence(s) —{' '}
                                {totalQuantity} unité(s)
                            </span>
                        </div>

                        {expedition.lines.length > 0 ? (
                            <div className="products-grid">
                                {expedition.lines.map((line) => (
                                    <div key={line.id} className="product-card">
                                        <div className="product-main">
                                            <div className="product-name">
                                                {line.product?.nom ||
                                                    `Produit #${line.product_id}`}
                                            </div>
                                            {line.product?.code && (
                                                <div className="product-code">
                                                    {line.product.code}
                                                </div>
                                            )}
                                        </div>
                                        <div className="product-details">
                                            <div className="detail-item">
                                                <span className="detail-label">
                                                    Quantité
                                                </span>
                                                <span className="detail-value">
                                                    {line.quantite} u.
                                                </span>
                                            </div>
                                            {line.dlc && (
                                                <div className="detail-item">
                                                    <span className="detail-label">
                                                        DLC
                                                    </span>
                                                    <span className="detail-value">
                                                        {formatDate(line.dlc)}
                                                    </span>
                                                </div>
                                            )}
                                            {line.lot_reference && (
                                                <div className="detail-item">
                                                    <span className="detail-label">
                                                        Lot
                                                    </span>
                                                    <span className="detail-value">
                                                        {line.lot_reference}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-products">Aucun produit</p>
                        )}
                    </div>

                    {/* Réception si existe */}
                    {expedition.reception && (
                        <div className="reception-section">
                            <div className="section-header">
                                <CheckCircle size={16} strokeWidth={1.5} />
                                <span>Réception</span>
                                <span
                                    className={`status-badge ${expedition.reception.statut === 'CONFIRMEE' ? 'status-badge--success' : 'status-badge--warning'}`}
                                >
                                    {expedition.reception.statut === 'CONFIRMEE'
                                        ? 'Confirmée'
                                        : 'En attente'}
                                </span>
                            </div>
                            {expedition.reception.lines &&
                                expedition.reception.lines.length > 0 && (
                                    <div className="reception-grid">
                                        {expedition.reception.lines.map(
                                            (line) => (
                                                <div
                                                    key={line.id}
                                                    className="reception-line"
                                                >
                                                    <div className="reception-product">
                                                        {line.product?.nom ||
                                                            `Produit #${line.product_id}`}
                                                    </div>
                                                    <div className="reception-quantities">
                                                        <span>
                                                            Attendu:{' '}
                                                            {line.qte_attendue}
                                                        </span>
                                                        <span
                                                            className={
                                                                line.ecart !==
                                                                    null &&
                                                                line.ecart !== 0
                                                                    ? 'text-danger'
                                                                    : 'text-success'
                                                            }
                                                        >
                                                            Reçu:{' '}
                                                            {line.qte_recue ??
                                                                '-'}
                                                        </span>
                                                        {line.ecart !== null &&
                                                            line.ecart !==
                                                                0 && (
                                                                <span className="text-warning">
                                                                    Écart:{' '}
                                                                    {line.ecart >
                                                                    0
                                                                        ? '+'
                                                                        : ''}
                                                                    {line.ecart}
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="info-card">
                    <div className="info-icon">
                        <FileText size={18} strokeWidth={1.5} />
                    </div>
                    <div className="info-content">
                        <div className="info-title">
                            À propos de ce bon de livraison
                        </div>
                        <div className="info-text">
                            {expedition.statut === 'BROUILLON' &&
                                'Ce BL est en état brouillon. Il peut encore être modifié avant envoi.'}
                            {expedition.statut === 'ENVOYEE' &&
                                'Le BL a été envoyé à la boulangerie. En attente de réception.'}
                            {expedition.statut === 'RECUE' &&
                                'La boulangerie a confirmé la réception de ce bon de livraison.'}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .expedition-show-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                /* Header */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--text-3);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .back-link:hover {
                    color: var(--orange);
                }
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .page-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.75rem;
                    color: var(--text-3);
                }
                .header-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }

                /* Expedition Card */
                .expedition-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .expedition-card:hover {
                    box-shadow: var(--shadow-sm);
                }

                /* Hero */
                .expedition-hero {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--border);
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .expedition-hero-left {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .expedition-reference {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--orange);
                    letter-spacing: -0.5px;
                }
                .expedition-destination {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-1);
                }
                .destination-address {
                    font-weight: 400;
                    color: var(--text-3);
                    font-size: 0.8rem;
                }
                .expedition-hero-right {
                    display: flex;
                    align-items: center;
                }

                /* Status Badge */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.3rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .status-badge--info {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .status-badge--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .status-badge--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .status-badge--default {
                    background: var(--bg-card-2);
                    color: var(--text-3);
                }

                /* Section Products */
                .section-products {
                    padding: 1.25rem 1.5rem;
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 1rem;
                }
                .product-count {
                    margin-left: auto;
                    padding: 0.2rem 0.6rem;
                    background: var(--bg-card-2);
                    border-radius: 20px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: var(--text-3);
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 0.75rem;
                }
                .product-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 0.85rem 1rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }
                .product-card:hover {
                    border-color: var(--orange);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                }
                .product-main {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                }
                .product-name {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-1);
                }
                .product-code {
                    font-size: 0.65rem;
                    color: var(--text-3);
                    font-family: monospace;
                }
                .product-details {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    align-items: flex-end;
                }
                .detail-item {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.15rem;
                }
                .detail-label {
                    font-size: 0.6rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .detail-value {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-1);
                }

                .no-products {
                    text-align: center;
                    color: var(--text-3);
                    font-size: 0.8rem;
                    padding: 1rem;
                }

                /* Reception section */
                .reception-section {
                    padding: 1.25rem 1.5rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }
                .reception-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }
                .reception-line {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.6rem 0.85rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                }
                .reception-product {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-1);
                }
                .reception-quantities {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                }
                .text-success {
                    color: var(--success);
                }
                .text-warning {
                    color: #f59e0b;
                }
                .text-danger {
                    color: var(--danger);
                }

                /* Info card */
                .info-card {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    background: rgba(59, 91, 219, 0.05);
                    border: 1px solid rgba(59, 91, 219, 0.15);
                    border-radius: 12px;
                }
                .info-icon {
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: rgba(59, 91, 219, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--blue);
                }
                .info-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .info-title {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .info-text {
                    font-size: 0.8rem;
                    color: var(--text-2);
                    line-height: 1.4;
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
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                }
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1.5px solid var(--orange);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-secondary:hover {
                    background: var(--orange);
                    color: white;
                }
            `}</style>
        </>
    );
}
