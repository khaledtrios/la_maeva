import { Head, Link, router, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import commandesUrgentes from '@/routes/commandes-urgentes';
import {
    ShoppingBag,
    Calendar,
    User,
    MapPin,
    AlertTriangle,
    Clock,
    CheckCircle,
    Truck,
    ArrowLeft,
    Package,
} from 'lucide-react';

interface ShowProps {
    commande: {
        id: number;
        date: string;
        statut: string;
        priorite: number;
        notes: string | null;
        created_by: number;
        created_at: string;
        entity: {
            id: number;
            nom: string;
            adresse: string | null;
        };
        creator: {
            id: number;
            nom: string;
        } | null;
        lines: Array<{
            id: number;
            product_id: number;
            quantite: number;
            product: {
                id: number;
                nom: string;
                code: string | null;
                category: {
                    id: number;
                    nom: string;
                };
            } | null;
        }>;
    };
}

export default function CommandesUrgentesShow() {
    const { user } = useAuth();
    const page = usePage<PageProps>().props;
    const { commande } = page as unknown as ShowProps;

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

    const getStatusInfo = (status: string) => {
        const classes: Record<
            string,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            ENVOYEE: {
                label: 'Envoyée',
                class: 'status-badge status-badge--info',
                icon: <Clock size={12} strokeWidth={1.5} />,
            },
            PRISE_EN_CHARGE: {
                label: 'Prise en charge',
                class: 'status-badge status-badge--warning',
                icon: <User size={12} strokeWidth={1.5} />,
            },
            EXPEDIEE: {
                label: 'Expédiée',
                class: 'status-badge status-badge--success',
                icon: <Truck size={12} strokeWidth={1.5} />,
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

    const getPriorityInfo = (priorite: number) => {
        if (priorite >= 4) {
            return {
                label: `Priorité ${priorite}/5`,
                class: 'priority-badge priority-badge--high',
                icon: <AlertTriangle size={12} strokeWidth={1.5} />,
            };
        }
        return {
            label: `Priorité ${priorite}/5`,
            class: 'priority-badge priority-badge--normal',
            icon: null,
        };
    };

    const isLaboRole = () => {
        return ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'].includes(
            user?.role || '',
        );
    };

    const statusInfo = getStatusInfo(commande.statut);
    const priorityInfo = getPriorityInfo(commande.priorite);

    const handleTake = () => {
        router.post(
            commandesUrgentes.take.url(commande.id),
            {},
            {
                onSuccess: () => {},
            },
        );
    };

    const handleCreateBl = () => {
        router.visit(commandesUrgentes.createBl.url(commande.id));
    };

    const totalQuantity = commande.lines.reduce(
        (sum, line) => sum + (line.quantite || 0),
        0,
    );

    return (
        <>
            <Head title={`Commande #${commande.id}`} />

            <div className="commande-show-page">
                {/* Header with back button */}
                <div className="page-header">
                    <div className="header-left">
                        <Link
                            href={commandesUrgentes.index()}
                            className="back-link"
                        >
                            <ArrowLeft size={18} strokeWidth={1.5} />
                            Retour à la liste
                        </Link>
                        <h1 className="page-title">Commande #{commande.id}</h1>
                        <div className="page-meta">
                            <span className="meta-item">
                                <Calendar size={14} strokeWidth={1.5} />
                                Créée le {formatDateTime(commande.created_at)}
                            </span>
                            <span className="meta-item">
                                <User size={14} strokeWidth={1.5} />
                                {commande.creator?.nom || 'Utilisateur inconnu'}
                            </span>
                        </div>
                    </div>
                    <div className="header-actions">
                        {commande.statut === 'ENVOYEE' && isLaboRole() && (
                            <button
                                onClick={handleTake}
                                className="btn-primary"
                            >
                                <CheckCircle size={16} strokeWidth={1.5} />
                                Prendre en charge
                            </button>
                        )}
                        {commande.statut === 'PRISE_EN_CHARGE' &&
                            isLaboRole() && (
                                <button
                                    onClick={handleCreateBl}
                                    className="btn-primary"
                                >
                                    <Truck size={16} strokeWidth={1.5} />
                                    Créer le BL & Expédier
                                </button>
                            )}
                        {commande.statut === 'EXPEDIEE' && (
                            <div className="status-success-badge">
                                <CheckCircle size={16} strokeWidth={1.5} />
                                Expédiée
                            </div>
                        )}
                    </div>
                </div>

                {/* Main commande card */}
                <div className="commande-card">
                    {/* En-tête commande */}
                    <div className="commande-hero">
                        <div className="commande-hero-left">
                            <div className="commande-reference">
                                Réf. #{commande.id}
                            </div>
                            <div className="commande-boutique">
                                <MapPin size={16} strokeWidth={1.5} />
                                {commande.entity.nom}
                                {commande.entity.adresse && (
                                    <span className="boutique-address">
                                        — {commande.entity.adresse}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="commande-hero-right">
                            <div className="commande-date-badge">
                                <Calendar size={14} strokeWidth={1.5} />
                                {formatDate(commande.date)}
                            </div>
                        </div>
                    </div>

                    {/* Badges statut et priorité */}
                    <div className="commande-badges">
                        <span className={statusInfo.class}>
                            {statusInfo.icon}
                            {statusInfo.label}
                        </span>
                        <span className={priorityInfo.class}>
                            {priorityInfo.icon}
                            {priorityInfo.label}
                        </span>
                    </div>

                    {/* Notes si présentes */}
                    {commande.notes && (
                        <div className="commande-notes">
                            <div className="notes-label">Notes</div>
                            <div className="notes-content">
                                {commande.notes}
                            </div>
                        </div>
                    )}

                    {/* Détail des produits */}
                    <div className="products-section">
                        <div className="section-header">
                            <ShoppingBag size={16} strokeWidth={1.5} />
                            <span>Produits demandés</span>
                            <span className="product-count-badge">
                                {commande.lines.length} produit(s) —{' '}
                                {totalQuantity} unité(s)
                            </span>
                        </div>

                        {commande.lines.length > 0 ? (
                            <div className="products-list">
                                {commande.lines.map((line) => (
                                    <div key={line.id} className="product-item">
                                        <div className="product-info">
                                            <div className="product-name">
                                                {line.product?.nom ||
                                                    `Produit #${line.product_id}`}
                                            </div>
                                            {line.product?.code && (
                                                <div className="product-code">
                                                    {line.product.code}
                                                </div>
                                            )}
                                            {line.product?.category && (
                                                <div className="product-category">
                                                    {line.product.category.nom}
                                                </div>
                                            )}
                                        </div>
                                        <div className="product-quantity">
                                            <Package
                                                size={14}
                                                strokeWidth={1.5}
                                            />
                                            <span>{line.quantite}</span>{' '}
                                            unité(s)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-lines">
                                Aucun produit dans cette commande
                            </p>
                        )}
                    </div>
                </div>

                {/* Info contextuelle */}
                <div className="info-section">
                    <div className="info-card">
                        <div className="info-icon">
                            <Clock size={18} strokeWidth={1.5} />
                        </div>
                        <div className="info-content">
                            <div className="info-title">
                                Statut de la commande
                            </div>
                            <div className="info-text">
                                {commande.statut === 'ENVOYEE' &&
                                    'La commande a été envoyée au labo et est en attente de prise en charge.'}
                                {commande.statut === 'PRISE_EN_CHARGE' &&
                                    'La commande a été prise en charge par le labo. Vous pouvez maintenant créer le bon de livraison.'}
                                {commande.statut === 'EXPEDIEE' &&
                                    'La commande a été expédiée vers la boulangerie. Un bon de livraison a été généré.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .commande-show-page {
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

                /* Commande Card */
                .commande-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .commande-card:hover {
                    box-shadow: var(--shadow-sm);
                }

                /* Hero section */
                .commande-hero {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--border);
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .commande-hero-left {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .commande-reference {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--orange);
                    letter-spacing: -0.5px;
                }
                .commande-boutique {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-1);
                }
                .boutique-address {
                    font-weight: 400;
                    color: var(--text-3);
                    font-size: 0.8rem;
                }
                .commande-hero-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.5rem;
                }
                .commande-date-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.85rem;
                    background: var(--bg-card-2);
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-2);
                }

                /* Badges */
                .commande-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    padding: 0 1.5rem 1rem;
                }
                .status-badge, .priority-badge {
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
                .status-badge--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .status-badge--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .priority-badge--high {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .priority-badge--normal {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                }

                /* Notes */
                .commande-notes {
                    padding: 1rem 1.5rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .notes-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 0.35rem;
                }
                .notes-content {
                    font-size: 0.85rem;
                    color: var(--text-2);
                    line-height: 1.5;
                }

                /* Products section */
                .products-section {
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
                .product-count-badge {
                    margin-left: auto;
                    padding: 0.2rem 0.6rem;
                    background: var(--bg-card-2);
                    border-radius: 20px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: var(--text-3);
                }
                .products-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .product-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.85rem 1rem;
                    background: var(--bg-card-2);
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    transition: all 0.2s ease;
                }
                .product-item:hover {
                    border-color: var(--orange);
                    transform: translateX(4px);
                }
                .product-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }
                .product-name {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-1);
                }
                .product-code {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    font-family: monospace;
                }
                .product-category {
                    font-size: 0.65rem;
                    color: var(--text-3);
                    font-weight: 500;
                    text-transform: uppercase;
                }
                .product-quantity {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--orange);
                }
                .no-lines {
                    text-align: center;
                    color: var(--text-3);
                    font-size: 0.8rem;
                    padding: 1rem;
                }

                /* Info section */
                .info-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .info-card {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    background: rgba(232, 116, 42, 0.05);
                    border: 1px solid rgba(232, 116, 42, 0.15);
                    border-radius: 12px;
                }
                .info-icon {
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: rgba(232, 116, 42, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--orange);
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
                    transition: all 0.25s ease;
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
                    transition: all 0.25s ease;
                }
                .btn-secondary:hover {
                    background: var(--orange);
                    color: white;
                }

                .status-success-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
            `}</style>
        </>
    );
}
