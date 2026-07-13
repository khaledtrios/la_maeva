import { useEffect, useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import commandesUrgentes from '@/routes/commandes-urgentes';
import {
    Truck,
    Package,
    Clock,
    AlertTriangle,
    CheckCircle,
    User,
    Calendar,
    MapPin,
    Plus,
    Filter,
    Eye,
    RefreshCw,
    Search,
    ShoppingBag,
    ChevronDown,
    ChevronUp,
    X,
    AlertCircle,
} from 'lucide-react';

// Composant d'alerte flash
function FlashAlert({ flash, onClose }: any) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (flash?.error) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose?.();
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [flash, onClose]);

    if (!isVisible || !flash?.error) return null;

    // Parser le message d'erreur
    const parseErrorMessage = (errorMsg: any) => {
        const lines = errorMsg.split('\n');
        const mainError = lines[0];
        const details = lines.slice(1).filter((line: any) => line.trim());

        // Extraire les informations de stock
        const stockMatch = errorMsg.match(
            /Produit "([^"]+)" : demandé (\d+), disponible (\d+)/,
        );
        if (stockMatch) {
            return {
                product: stockMatch[1],
                requested: parseInt(stockMatch[2]),
                available: parseInt(stockMatch[3]),
                missing: parseInt(stockMatch[2]) - parseInt(stockMatch[3]),
                mainError,
                details,
            };
        }

        return { mainError, details };
    };

    const errorData = parseErrorMessage(flash.error);

    return (
        <div className="animate-slide-down fixed top-4 right-4 z-50 w-96">
            <div className="overflow-hidden rounded-lg border-l-4 border-red-500 bg-red-50 shadow-lg">
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="mb-1 text-sm font-semibold text-red-800">
                                Erreur de stock
                            </h3>
                            <div className="text-sm text-red-700">
                                <p className="font-medium">
                                    {errorData.mainError}
                                </p>

                                {errorData.product && (
                                    <div className="mt-2 rounded-md bg-red-100 p-2">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="font-semibold">
                                                Produit:
                                            </span>
                                            <span>{errorData.product}</span>
                                        </div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="font-semibold">
                                                Demandé:
                                            </span>
                                            <span className="font-bold text-red-600">
                                                {errorData.requested}
                                            </span>
                                        </div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="font-semibold">
                                                Disponible:
                                            </span>
                                            <span>{errorData.available}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-red-200 pt-1">
                                            <span className="font-semibold">
                                                Manque:
                                            </span>
                                            <span className="font-bold text-red-600">
                                                {errorData.missing} unités
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {errorData.details.length > 0 &&
                                    errorData.details.map(
                                        (detail: any, index: any) => (
                                            <p
                                                key={index}
                                                className="mt-1 text-xs text-red-600"
                                            >
                                                {detail}
                                            </p>
                                        ),
                                    )}
                            </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    onClose?.();
                                }}
                                className="inline-flex rounded-md p-1.5 text-red-500 transition-colors duration-200 hover:bg-red-100 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:outline-none"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Barre de progression */}
                <div className="h-1 bg-red-100">
                    <div
                        className="animate-shrink h-full bg-red-500"
                        style={{ animationDuration: '8s' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function CommandesUrgentesIndex() {
    const { user } = useAuth();
    const { pusher } = useRealtime(); // initialise Pusher
    const page = usePage<PageProps>().props;
    const { commandes, stats, filters, statuts, flash } = page as any;

    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [takeModal, setTakeModal] = useState<{
        id: number;
        ref: string;
    } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFlash, setShowFlash] = useState(true);

    // Initialiser toutes les commandes comme expandées par défaut
    useEffect(() => {
        if (commandes?.data) {
            const ids: any = new Set(commandes.data.map((c: any) => c.id));
            setExpandedIds(ids);
        }
    }, [commandes]);

    // Écoute des événements temps réel (statut des commandes)
    useEffect(() => {
        const handleStatusUpdate = () => {
            console.log('[CommandesUrgentes] Statut de commande mis à jour');
            // Recharger la page pour voir les changements de statut
            router.reload({
                preserveState: true,
                preserveScroll: true,
            });
        };

        window.addEventListener('commande-urgente-status-updated', handleStatusUpdate);

        return () => {
            window.removeEventListener('commande-urgente-status-updated', handleStatusUpdate);
        };
    }, [router]);

    const handleFilterChange = (key: string, value: string) => {
        setIsSubmitting(true);
        router.get(
            commandesUrgentes.index(),
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
            commandesUrgentes.index(),
            {},
            {
                preserveState: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const applyFilters = () => {
        const queryParams = new URLSearchParams();
        if (filters.statut) queryParams.append('statut', filters.statut);
        if (filters.date_from)
            queryParams.append('date_from', filters.date_from);
        if (filters.date_to) queryParams.append('date_to', filters.date_to);
        if (filters.priorite) queryParams.append('priorite', filters.priorite);

        router.get(window.location.pathname, Object.fromEntries(queryParams), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusInfo = (status: string) => {
        const classes: Record<
            string,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            ENVOYEE: {
                label: 'En attente',
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleTake = (id: number) => {
        router.post(
            commandesUrgentes.take.url(id),
            {},
            {
                onSuccess: () => setTakeModal(null),
            },
        );
    };

    const handleCreateBl = (commandeId: number) => {
        router.visit(commandesUrgentes.createBl.url(commandeId));
    };

    const isLaboRole = () => {
        return ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'].includes(
            user?.role || '',
        );
    };

    const hasActiveFilters =
        filters?.statut ||
        filters?.date_from ||
        filters?.date_to ||
        filters?.priorite;

    const toggleDetail = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const filteredCommandes =
        commandes?.data?.filter((commande: any) => {
            if (filters.statut && commande.statut !== filters.statut)
                return false;
            if (filters.date_from && commande.date < filters.date_from)
                return false;
            if (filters.date_to && commande.date > filters.date_to)
                return false;
            if (filters.priorite && commande.priorite != filters.priorite)
                return false;
            return true;
        }) || [];

    return (
        <>
            <Head title="Commandes urgentes" />

            {/* Alerte Flash */}
            <FlashAlert flash={flash} onClose={() => setShowFlash(false)} />

            <div className="commandes-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Commandes urgentes</h1>
                        <p className="page-subtitle">
                            Réassort jour même — Demandes des boutiques
                        </p>
                    </div>
                    <div className="header-actions">
                        {isLaboRole() && (
                            <div className="attente-badge">
                                <AlertTriangle size={14} strokeWidth={1.5} />
                                <span>{stats?.en_attente || 0} en attente</span>
                            </div>
                        )}
                        {!isLaboRole() && (
                            <Link
                                href={commandesUrgentes.create()}
                                className="btn-primary"
                            >
                                <Plus size={16} strokeWidth={1.5} />
                                Nouvelle commande
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--blue">
                            <ShoppingBag size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total</div>
                            <div className="stat-value">
                                {stats?.total || 0}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--warning">
                            <Clock size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">En attente</div>
                            <div className="stat-value stat-value--warning">
                                {stats?.en_attente || 0}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--warning">
                            <User size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Prise en charge</div>
                            <div className="stat-value">
                                {stats?.prise_en_charge || 0}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--success">
                            <CheckCircle size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Expédiées</div>
                            <div className="stat-value stat-value--success">
                                {stats?.expediees || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="filters-header">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn-secondary"
                        >
                            <Filter size={14} strokeWidth={1.5} />
                            Filtrer
                            <ChevronDown
                                size={14}
                                strokeWidth={1.5}
                                className={`filter-chevron ${showFilters ? 'rotate' : ''}`}
                            />
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="btn-ghost-sm"
                            >
                                <RefreshCw size={12} strokeWidth={1.5} />
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="filters-panel">
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label className="filter-label">
                                        Statut
                                    </label>
                                    <select
                                        value={filters?.statut || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'statut',
                                                e.target.value,
                                            )
                                        }
                                        className="filter-select"
                                    >
                                        <option value="">
                                            Tous les statuts
                                        </option>
                                        {Object.entries(statuts || {}).map(
                                            ([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label as string}
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
                                            value={filters?.date_from || ''}
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
                                            value={filters?.date_to || ''}
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
                                <div className="filter-group">
                                    <label className="filter-label">
                                        Priorité
                                    </label>
                                    <select
                                        value={filters?.priorite || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'priorite',
                                                e.target.value,
                                            )
                                        }
                                        className="filter-select"
                                    >
                                        <option value="">Toutes</option>
                                        <option value="5">5 (Urgente)</option>
                                        <option value="4">4 (Haute)</option>
                                        <option value="3">3 (Moyenne)</option>
                                        <option value="2">2 (Basse)</option>
                                        <option value="1">
                                            1 (Très basse)
                                        </option>
                                    </select>
                                </div>
                                <div className="filter-actions">
                                    <button
                                        onClick={applyFilters}
                                        className="btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="spinner" />
                                        ) : (
                                            <Search
                                                size={14}
                                                strokeWidth={1.5}
                                            />
                                        )}
                                        Appliquer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Liste des commandes - Cards */}
                {filteredCommandes.length === 0 ? (
                    <div className="empty-state-card">
                        <ShoppingBag size={48} strokeWidth={1} />
                        <div className="empty-state-text">
                            Aucune commande urgente trouvée
                        </div>
                        <div className="empty-state-subtext">
                            Modifiez vos filtres ou créez une nouvelle commande
                        </div>
                    </div>
                ) : (
                    <div className="commandes-list">
                        {filteredCommandes.map((commande: any) => {
                            const statusInfo = getStatusInfo(commande.statut);
                            const priorityInfo = getPriorityInfo(
                                commande.priorite,
                            );
                            const totalQty =
                                commande.lines?.reduce(
                                    (sum: number, line: any) =>
                                        sum + (line.quantite || 0),
                                    0,
                                ) || 0;

                            return (
                                <div
                                    key={commande.id}
                                    className="commande-card"
                                >
                                    {/* En-tête cliquable */}
                                    <div
                                        className="commande-header"
                                        onClick={() =>
                                            toggleDetail(commande.id)
                                        }
                                    >
                                        <div className="commande-info">
                                            <div className="commande-title-row">
                                                <h3 className="commande-title">
                                                    <Link
                                                        href={commandesUrgentes.show(
                                                            commande.id,
                                                        )}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="commande-reference-link"
                                                    >
                                                        #{commande.id}
                                                    </Link>
                                                </h3>
                                                <span
                                                    className={
                                                        priorityInfo.class
                                                    }
                                                >
                                                    {priorityInfo.icon}
                                                    {priorityInfo.label}
                                                </span>
                                                <span
                                                    className={statusInfo.class}
                                                >
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className="commande-meta">
                                                <span className="meta-item">
                                                    <MapPin
                                                        size={14}
                                                        strokeWidth={1}
                                                    />
                                                    {commande.entity?.nom}
                                                </span>
                                                <span className="meta-item">
                                                    <Calendar
                                                        size={14}
                                                        strokeWidth={1}
                                                    />
                                                    {formatDate(commande.date)}
                                                </span>
                                                <span className="meta-item">
                                                    <Package
                                                        size={14}
                                                        strokeWidth={1}
                                                    />
                                                    {commande.lines?.length ||
                                                        0}{' '}
                                                    produit(s)
                                                </span>
                                                <span className="meta-item">
                                                    {totalQty} unité(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="commande-toggle">
                                            {expandedIds.has(commande.id) ? (
                                                <ChevronUp
                                                    size={20}
                                                    strokeWidth={1.5}
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={20}
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Détail des lignes */}
                                    {expandedIds.has(commande.id) && (
                                        <div className="commande-details">
                                            <div className="details-section">
                                                <div className="details-title">
                                                    Produits de la commande
                                                </div>
                                                {commande.lines &&
                                                commande.lines.length > 0 ? (
                                                    <div className="lines-grid">
                                                        {commande.lines.map(
                                                            (line: any) => (
                                                                <div
                                                                    key={
                                                                        line.id
                                                                    }
                                                                    className="line-card"
                                                                >
                                                                    <div className="line-product">
                                                                        <Package
                                                                            size={
                                                                                14
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                        <span className="product-name">
                                                                            {line
                                                                                .product
                                                                                ?.nom ||
                                                                                `Produit #${line.product_id}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="line-quantity">
                                                                        <span className="quantity-value">
                                                                            {
                                                                                line.quantite
                                                                            }
                                                                        </span>
                                                                        <span className="quantity-label">
                                                                            unité(s)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="no-lines">
                                                        Aucun produit
                                                    </p>
                                                )}
                                            </div>

                                            {commande.notes && (
                                                <div className="details-section">
                                                    <div className="details-title">
                                                        Notes
                                                    </div>
                                                    <div className="notes-box">
                                                        {commande.notes}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="details-section">
                                                <div className="details-title">
                                                    Créé par
                                                </div>
                                                <div className="creator-info">
                                                    <User
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                    <span>
                                                        {commande.creator
                                                            ?.nom || 'Inconnu'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Affichage de l'erreur stock pour cette commande */}
                                            {flash?.error &&
                                                flash?.error &&
                                                flash.error.includes(
                                                    'Stock insuffisant',
                                                ) && (
                                                    <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 p-3">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-red-800">
                                                                    Stock
                                                                    insuffisant
                                                                </p>
                                                                <p className="mt-1 text-xs text-red-700">
                                                                    {flash.error
                                                                        .split(
                                                                            '\n',
                                                                        )
                                                                        .map(
                                                                            (
                                                                                line: any,
                                                                                i: any,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        line
                                                                                    }
                                                                                    {i <
                                                                                        flash.error.split(
                                                                                            '\n',
                                                                                        )
                                                                                            .length -
                                                                                            1 && (
                                                                                        <br />
                                                                                    )}
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Actions selon statut */}
                                            {commande.statut === 'ENVOYEE' &&
                                                isLaboRole() && (
                                                    <div className="details-actions">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTakeModal({
                                                                    id: commande.id,
                                                                    ref: `#${commande.id}`,
                                                                });
                                                            }}
                                                            className="btn-primary w-full"
                                                        >
                                                            <CheckCircle
                                                                size={16}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            Prendre en charge
                                                        </button>
                                                    </div>
                                                )}

                                            {commande.statut ===
                                                'PRISE_EN_CHARGE' &&
                                                isLaboRole() && (
                                                    <div className="details-actions">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCreateBl(
                                                                    commande.id,
                                                                );
                                                            }}
                                                            className="btn-primary w-full"
                                                        >
                                                            <Truck
                                                                size={16}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            Créer le BL &
                                                            Expédier
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {/* Actions rapides si fermé */}
                                    {!expandedIds.has(commande.id) && (
                                        <div className="commande-footer">
                                            {commande.statut === 'ENVOYEE' &&
                                                isLaboRole() && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTakeModal({
                                                                id: commande.id,
                                                                ref: `#${commande.id}`,
                                                            });
                                                        }}
                                                        className="btn-primary w-full"
                                                    >
                                                        <CheckCircle
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                        Prendre en charge
                                                    </button>
                                                )}
                                            {commande.statut ===
                                                'PRISE_EN_CHARGE' &&
                                                isLaboRole() && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.visit(
                                                                commandesUrgentes.createBl.url(
                                                                    commande.id,
                                                                ),
                                                            );
                                                        }}
                                                        className="btn-primary w-full"
                                                    >
                                                        <Truck
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                        Créer le BL & Expédier
                                                    </button>
                                                )}
                                            {(commande.statut === 'ENVOYEE' &&
                                                !isLaboRole()) ||
                                            (commande.statut ===
                                                'PRISE_EN_CHARGE' &&
                                                !isLaboRole()) ||
                                            commande.statut === 'EXPEDIEE' ? (
                                                <Link
                                                    href={commandesUrgentes.show(
                                                        commande.id,
                                                    )}
                                                    className="btn-secondary w-full"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Eye
                                                        size={16}
                                                        strokeWidth={1.5}
                                                    />
                                                    Voir le détail
                                                </Link>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {commandes?.links && commandes.links.length > 3 && (
                    <div className="pagination">
                        <div className="pagination-info">
                            Page {commandes.current_page} sur{' '}
                            {commandes.last_page}
                        </div>
                        <div className="pagination-controls">
                            {commandes.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    className={`pagination-btn ${
                                        link.active ? 'active' : ''
                                    } ${!link.url ? 'disabled' : ''}`}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Prendre en charge */}
            {takeModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setTakeModal(null)}
                >
                    <div
                        className="modal modal-success"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-success">
                            <div className="modal-icon-success">
                                <CheckCircle size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => setTakeModal(null)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-success">
                                Prendre en charge
                            </h3>
                            <p className="modal-message">
                                Voulez-vous prendre en charge la commande{' '}
                                <strong>{takeModal.ref}</strong> ?
                            </p>
                            <p className="modal-message-subtle">
                                Cette action vous assignera la commande et la
                                fera passer en statut "Prise en charge".
                            </p>
                        </div>
                        <div className="modal-footer-success">
                            <button
                                onClick={() => setTakeModal(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleTake(takeModal.id)}
                                className="btn-primary"
                            >
                                <CheckCircle size={16} strokeWidth={1.5} />
                                Prendre en charge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .commandes-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                /* Animations */
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }

                .animate-slide-down {
                    animation: slideDown 0.3s ease-out;
                }

                .animate-shrink {
                    animation: shrink linear forwards;
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
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .attente-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.9rem;
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
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
                .stat-icon--blue {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .stat-icon--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
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
                .stat-value--success {
                    color: var(--success);
                }

                /* Filters */
                .filters-section {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                }
                .filters-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .filter-chevron {
                    transition: transform 0.2s ease;
                }
                .filter-chevron.rotate {
                    transform: rotate(180deg);
                }
                .filters-panel {
                    padding: 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .filters-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    align-items: flex-end;
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
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                }
                .filter-select {
                    padding: 0.6rem 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    font-size: 0.85rem;
                }
                .filter-input:focus,
                .filter-select:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
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
                .filter-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                @media (min-width: 768px) {
                    .filter-actions {
                        justify-content: flex-end;
                    }
                }

                /* Commandes list - Card layout */
                .commandes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .commande-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .commande-card:hover {
                    box-shadow: var(--shadow-sm);
                }
                .commande-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1rem 1.25rem;
                    cursor: pointer;
                }
                .commande-info {
                    flex: 1;
                }
                .commande-title-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.5rem;
                }
                .commande-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin: 0;
                }
                .commande-reference-link {
                    color: var(--orange);
                    text-decoration: none;
                    font-weight: 700;
                }
                .commande-reference-link:hover {
                    text-decoration: underline;
                }
                .status-badge,
                .priority-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                }
                .commande-meta {
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
                .commande-toggle {
                    color: var(--text-3);
                    display: flex;
                    align-items: center;
                    margin-left: 0.75rem;
                }
                .commande-details {
                    border-top: 1px solid var(--border);
                    padding: 1rem 1.25rem;
                    background: var(--bg-card-2);
                }
                .details-section {
                    margin-bottom: 1rem;
                }
                .details-section:last-of-type {
                    margin-bottom: 0;
                }
                .details-title {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                    margin-bottom: 0.6rem;
                }
                .lines-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 0.5rem;
                }
                .line-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.6rem 0.85rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .line-card:hover {
                    border-color: var(--orange);
                    transform: translateX(2px);
                }
                .line-product {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    color: var(--text-2);
                    font-weight: 500;
                }
                .line-product .product-name {
                    font-weight: 500;
                    color: var(--text-1);
                }
                .line-quantity {
                    display: flex;
                    align-items: baseline;
                    gap: 0.25rem;
                    font-size: 0.8rem;
                }
                .quantity-value {
                    font-weight: 700;
                    font-size: 1rem;
                    color: var(--orange);
                }
                .quantity-label {
                    font-size: 0.65rem;
                    color: var(--text-3);
                }
                .no-lines {
                    text-align: center;
                    color: var(--text-3);
                    font-size: 0.8rem;
                    padding: 0.5rem;
                }

                .notes-box {
                    padding: 0.75rem;
                    background: var(--bg-card);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: var(--text-2);
                    line-height: 1.5;
                    border: 1px solid var(--border);
                }

                .creator-info {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    color: var(--text-2);
                }

                .details-actions {
                    margin-top: 1rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border);
                }
                .details-actions-row {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border);
                }

                .commande-footer {
                    padding: 0.75rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }

                /* Empty state */
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

                /* Modals */
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
                    max-width: 460px;
                    width: 100%;
                    overflow: hidden;
                }
                .modal-success {
                    border: 1px solid rgba(30, 158, 106, 0.2);
                }
                .modal-header-success {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 0.5rem;
                }
                .modal-icon-success {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(30, 158, 106, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--success);
                    margin: 0 auto;
                }
                .modal-title-success {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--success);
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
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .modal-message {
                    font-size: 0.9rem;
                    color: var(--text-2);
                    margin-top: 0.5rem;
                }
                .modal-message-subtle {
                    font-size: 0.75rem;
                    color: var(--text-3);
                    margin-top: 0.5rem;
                }
                .modal-footer-success {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
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
                .btn-primary.w-full {
                    width: 100%;
                    justify-content: center;
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
                .btn-secondary.w-full {
                    width: 100%;
                    justify-content: center;
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
                .btn-neutral {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
                }

                .spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
