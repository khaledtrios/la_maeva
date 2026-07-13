import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    FileText,
    Plus,
    Filter,
    Search,
    X,
    RefreshCw,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Send,
    Trash2,
    Calendar,
    Euro,
} from 'lucide-react';
import type { FactureStatut, PeriodeType } from '@/types';
import { show, pdf, validate, destroy, pay, cancel } from '@/routes/factures';
import FactureCreate from './Create';

// Composant Modal de confirmation simple
const ConfirmModal = ({
    title,
    message,
    type,
    onConfirm,
    onCancel,
}: {
    title: string;
    message: string;
    type: 'danger' | 'success' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    const getIcon = () => {
        if (type === 'danger')
            return <AlertCircle size={28} strokeWidth={1.5} />;
        if (type === 'success')
            return <CheckCircle size={28} strokeWidth={1.5} />;
        return <AlertCircle size={28} strokeWidth={1.5} />;
    };

    const getIconClass = () => {
        if (type === 'danger') return 'modal-icon-danger';
        if (type === 'success') return 'modal-icon-success';
        return 'modal-icon-warning';
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className={getIconClass()}>{getIcon()}</div>
                    <button onClick={onCancel} className="modal-close">
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>
                <div className="modal-body text-center">
                    <h3 className="modal-title">{title}</h3>
                    <p className="modal-message">{message}</p>
                </div>
                <div className="modal-footer-center">
                    <button onClick={onCancel} className="btn-neutral">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className={`btn-${type}`}>
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

// Composant Modal d'annulation avec raison
const CancelModal = ({
    title,
    message,
    onConfirm,
    onCancel,
}: {
    title: string;
    message: string;
    onConfirm: (raison: string) => void;
    onCancel: () => void;
}) => {
    const [raison, setRaison] = useState('');

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="modal modal-danger"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header-danger">
                    <div className="modal-icon-danger">
                        <AlertCircle size={28} strokeWidth={1.5} />
                    </div>
                    <button onClick={onCancel} className="modal-close">
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>
                <div className="modal-body text-center">
                    <h3 className="modal-title-danger">{title}</h3>
                    <p className="modal-message">{message}</p>
                    <div className="form-group">
                        <label className="form-label">
                            Raison de l'annulation
                        </label>
                        <textarea
                            value={raison}
                            onChange={(e) => setRaison(e.target.value)}
                            className="form-textarea"
                            rows={3}
                            placeholder="Expliquez la raison de l'annulation..."
                            required
                        />
                    </div>
                </div>
                <div className="modal-footer-danger">
                    <button onClick={onCancel} className="btn-neutral">
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm(raison)}
                        disabled={!raison.trim()}
                        className="btn-danger"
                    >
                        Confirmer l'annulation
                    </button>
                </div>
            </div>
        </div>
    );
};

// Fonction de formatage de date
const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export default function FacturesIndex({
    factures,
    boutiques,
    labos,
    filters,
    periodeTypes,
    statuts,
}: {
    factures: any;
    boutiques: Array<{ id: number; nom: string }>;
    labos: Array<{ id: number; nom: string }>;
    filters: any;
    periodeTypes: string[];
    statuts: FactureStatut[];
}) {
    const { user } = useAuth();
    const [search, setSearch] = useState(filters);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{
        id: number;
        numero: string;
    } | null>(null);
    const [cancelModal, setCancelModal] = useState<{
        id: number;
        numero: string;
    } | null>(null);
    const [payModal, setPayModal] = useState<{
        id: number;
        numero: string;
    } | null>(null);

    const getStatutInfo = (statut: FactureStatut) => {
        const variants: Record<
            FactureStatut,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            BROUILLON: {
                label: 'Brouillon',
                class: 'status-badge status-badge--warning',
                icon: <Clock size={12} strokeWidth={1.5} />,
            },
            EMISE: {
                label: 'Émise',
                class: 'status-badge status-badge--info',
                icon: <Send size={12} strokeWidth={1.5} />,
            },
            PAYEE: {
                label: 'Payée',
                class: 'status-badge status-badge--success',
                icon: <CheckCircle size={12} strokeWidth={1.5} />,
            },
            ANNULEE: {
                label: 'Annulée',
                class: 'status-badge status-badge--danger',
                icon: <XCircle size={12} strokeWidth={1.5} />,
            },
        };
        return (
            variants[statut] || {
                label: statut,
                class: 'status-badge status-badge--default',
                icon: null,
            }
        );
    };

    const applyFilters = () => {
        setIsSubmitting(true);
        router.get('/factures', search, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsSubmitting(false),
        });
    };

    const resetFilters = () => {
        setSearch({
            boulangerie_id: '',
            periode_type: '',
            statut: '',
            date_from: '',
            date_to: '',
        });
        router.get('/factures', {}, { preserveState: true });
    };

    const handlePay = (id: number) => {
        router.put(
            pay.url(id),
            {},
            {
                onSuccess: () => setPayModal(null),
            },
        );
    };

    const handleCancel = (id: number, raison: string) => {
        router.put(
            cancel.url(id),
            { raison },
            {
                onSuccess: () => setCancelModal(null),
            },
        );
    };

    const handleDelete = (id: number) => {
        router.delete(destroy.url(id), {
            onSuccess: () => setDeleteModal(null),
        });
    };

    const totalMontant = factures.data.reduce(
        (sum: number, f: any) => sum + parseFloat(f.montant_total),
        0,
    );
    const hasActiveFilters =
        search.boulangerie_id ||
        search.periode_type ||
        search.statut ||
        search.date_from ||
        search.date_to;

    return (
        <div className="factures-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Facturation</h1>
                    <p className="page-subtitle">
                        {factures.total} facture{factures.total > 1 ? 's' : ''}{' '}
                        • Total{' '}
                        {totalMontant.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                        })}{' '}
                        €
                    </p>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'RESP_LABO') && (
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={16} strokeWidth={1.5} />
                        Générer facture
                    </button>
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
                            {
                                factures.data.filter(
                                    (f: any) => f.statut === 'BROUILLON',
                                ).length
                            }
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--info">
                        <FileText size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Émises</div>
                        <div className="stat-value stat-value--info">
                            {
                                factures.data.filter(
                                    (f: any) => f.statut === 'EMISE',
                                ).length
                            }
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <CheckCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Payées</div>
                        <div className="stat-value stat-value--success">
                            {
                                factures.data.filter(
                                    (f: any) => f.statut === 'PAYEE',
                                ).length
                            }
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Euro size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Montant total</div>
                        <div className="stat-value">
                            {totalMontant.toLocaleString('fr-FR', {
                                minimumFractionDigits: 0,
                            })}{' '}
                            €
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
                                <label className="filter-label">Boutique</label>
                                <select
                                    value={search.boulangerie_id || ''}
                                    onChange={(e) =>
                                        setSearch({
                                            ...search,
                                            boulangerie_id: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">
                                        Toutes les boutiques
                                    </option>
                                    {boutiques.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">Période</label>
                                <select
                                    value={search.periode_type || ''}
                                    onChange={(e) =>
                                        setSearch({
                                            ...search,
                                            periode_type: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">
                                        Toutes les périodes
                                    </option>
                                    {periodeTypes.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">Statut</label>
                                <select
                                    value={search.statut || ''}
                                    onChange={(e) =>
                                        setSearch({
                                            ...search,
                                            statut: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">Tous les statuts</option>
                                    {statuts.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
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
                                        value={search.date_from || ''}
                                        onChange={(e) =>
                                            setSearch({
                                                ...search,
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
                                        value={search.date_to || ''}
                                        onChange={(e) =>
                                            setSearch({
                                                ...search,
                                                date_to: e.target.value,
                                            })
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
            {factures.data.length === 0 ? (
                <div className="empty-state-card">
                    <FileText size={48} strokeWidth={1} />
                    <div className="empty-state-text">
                        Aucune facture trouvée
                    </div>
                    <div className="empty-state-subtext">
                        Modifiez vos filtres ou créez une nouvelle facture
                    </div>
                </div>
            ) : (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Liste des factures</span>
                        </div>
                        <div className="table-count">
                            {factures.total} facture
                            {factures.total > 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Boutique</th>
                                    <th>Période</th>
                                    <th className="text-right">Montant</th>
                                    <th>Statut</th>
                                    <th>Génération</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factures.data.map((f: any) => {
                                    const statutInfo = getStatutInfo(f.statut);
                                    return (
                                        <tr key={f.id}>
                                            <td>
                                                <Link
                                                    href={show.url(f.id)}
                                                    className="invoice-link"
                                                >
                                                    {f.numero}
                                                </Link>
                                            </td>
                                            <td className="text-muted">
                                                {f.boulangerie?.nom}
                                            </td>
                                            <td>
                                                <div className="period-cell">
                                                    <span>
                                                        {formatDate(
                                                            f.date_debut,
                                                        )}{' '}
                                                        →{' '}
                                                        {formatDate(f.date_fin)}
                                                    </span>
                                                    <span className="period-type">
                                                        {f.periode_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="amount-value text-right">
                                                {parseFloat(
                                                    f.montant_total,
                                                ).toFixed(2)}{' '}
                                                €
                                            </td>
                                            <td>
                                                <span
                                                    className={statutInfo.class}
                                                >
                                                    {statutInfo.icon}
                                                    {statutInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`generation-badge ${f.generation_auto ? 'auto' : 'manual'}`}
                                                >
                                                    {f.generation_auto
                                                        ? 'Automatique'
                                                        : 'Manuelle'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="table-actions">
                                                    <a
                                                        href={pdf.url(f.id)}
                                                        target="_blank"
                                                        className="btn-icon"
                                                        title="PDF"
                                                    >
                                                        <Download
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </a>
                                                    <Link
                                                        href={show.url(f.id)}
                                                        rel="noopener noreferrer"
                                                        className="btn-icon"
                                                        title="Voir"
                                                    >
                                                        <Eye
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </Link>
                                                    {(user?.role === 'ADMIN' ||
                                                        user?.role ===
                                                            'RESP_LABO') && (
                                                        <>
                                                            {f.statut ===
                                                                'BROUILLON' && (
                                                                <>
                                                                    <Link
                                                                        href={validate.url(
                                                                            f.id,
                                                                        )}
                                                                        method="put"
                                                                        className="btn-icon-success"
                                                                        title="Émettre"
                                                                    >
                                                                        <Send
                                                                            size={
                                                                                16
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </Link>
                                                                    <button
                                                                        onClick={() =>
                                                                            setDeleteModal(
                                                                                {
                                                                                    id: f.id,
                                                                                    numero: f.numero,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="btn-icon-danger"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                16
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {f.statut ===
                                                                'EMISE' && (
                                                                <button
                                                                    onClick={() =>
                                                                        setPayModal(
                                                                            {
                                                                                id: f.id,
                                                                                numero: f.numero,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="btn-icon-success"
                                                                    title="Marquer payée"
                                                                >
                                                                    <CheckCircle
                                                                        size={
                                                                            16
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                            {f.statut !==
                                                                'ANNULEE' && (
                                                                <button
                                                                    onClick={() =>
                                                                        setCancelModal(
                                                                            {
                                                                                id: f.id,
                                                                                numero: f.numero,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="btn-icon-warning"
                                                                    title="Annuler"
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            16
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mobile-list">
                        {factures.data.map((f: any) => {
                            const statutInfo = getStatutInfo(f.statut);
                            return (
                                <div key={f.id} className="mobile-card">
                                    <div className="mobile-card-header">
                                        <Link
                                            href={show.url(f.id)}
                                            className="mobile-invoice-number"
                                        >
                                            {f.numero}
                                        </Link>
                                        <span className={statutInfo.class}>
                                            {statutInfo.icon}
                                            {statutInfo.label}
                                        </span>
                                    </div>
                                    <div className="mobile-card-body">
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">
                                                Boutique
                                            </span>
                                            <span className="mobile-field-value">
                                                {f.boulangerie?.nom}
                                            </span>
                                        </div>
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">
                                                Période
                                            </span>
                                            <span className="mobile-field-value">
                                                {formatDate(f.date_debut)} →{' '}
                                                {formatDate(f.date_fin)}
                                            </span>
                                        </div>
                                        <div className="mobile-field">
                                            <span className="mobile-field-label">
                                                Montant
                                            </span>
                                            <span className="mobile-field-value amount">
                                                {parseFloat(
                                                    f.montant_total,
                                                ).toFixed(2)}{' '}
                                                €
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mobile-card-actions">
                                        <Link
                                            href={pdf.url(f.id)}
                                            target="_blank"
                                            className="btn-icon"
                                            title="PDF"
                                        >
                                            <Download
                                                size={16}
                                                strokeWidth={1.5}
                                            />
                                        </Link>
                                        <Link
                                            href={show.url(f.id)}
                                            className="btn-icon"
                                            title="Voir"
                                        >
                                            <Eye size={16} strokeWidth={1.5} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {factures.last_page > 1 && (
                        <div className="pagination">
                            <div className="pagination-info">
                                Page {factures.current_page} sur{' '}
                                {factures.last_page}
                            </div>
                            <div className="pagination-controls">
                                {factures.links
                                    .filter(
                                        (link: any) =>
                                            link.label !== 'Next' &&
                                            link.label !== 'Previous',
                                    )
                                    .map((link: any, idx: number) => (
                                        <button
                                            key={idx}
                                            className={`pagination-btn ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url)
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
            )}

            {/* Modals */}
            {deleteModal && (
                <ConfirmModal
                    title="Supprimer la facture"
                    message={`Êtes-vous sûr de vouloir supprimer la facture ${deleteModal.numero} ?`}
                    type="danger"
                    onConfirm={() => handleDelete(deleteModal.id)}
                    onCancel={() => setDeleteModal(null)}
                />
            )}

            {payModal && (
                <ConfirmModal
                    title="Marquer comme payée"
                    message={`Confirmez-vous que la facture ${payModal.numero} a été payée ?`}
                    type="success"
                    onConfirm={() => handlePay(payModal.id)}
                    onCancel={() => setPayModal(null)}
                />
            )}

            {cancelModal && (
                <CancelModal
                    title="Annuler la facture"
                    message={`Êtes-vous sûr de vouloir annuler la facture ${cancelModal.numero} ?`}
                    onConfirm={(raison: string) =>
                        handleCancel(cancelModal.id, raison)
                    }
                    onCancel={() => setCancelModal(null)}
                />
            )}

            {/* Modal création */}
            {createModalOpen && (
                <FactureCreate
                    boutiques={boutiques}
                    labos={labos}
                    periodeTypes={periodeTypes}
                    onClose={() => setCreateModalOpen(false)}
                />
            )}

            {/* Styles */}
            <style>{`
                .factures-page {
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
                .stat-icon--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .stat-icon--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
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
                        grid-template-columns: repeat(5, 1fr);
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
                .period-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .period-type {
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .amount-value {
                    font-weight: 700;
                    color: var(--text-1);
                }
                .text-muted {
                    color: var(--text-3);
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }

                /* Badges */
                .status-badge {
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
                .status-badge--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .status-badge--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .generation-badge {
                    font-size: 0.7rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }
                .generation-badge.auto {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .generation-badge.manual {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                }

                /* Actions */
                .table-actions {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
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
                .btn-icon-success {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.4rem;
                    background: transparent;
                    color: var(--success);
                    border: 1px solid rgba(30, 158, 106, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                }
                .btn-icon-success:hover {
                    background: rgba(30, 158, 106, 0.1);
                }
                .btn-icon-danger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.4rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                }
                .btn-icon-danger:hover {
                    background: rgba(214, 59, 59, 0.1);
                }
                .btn-icon-warning {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.4rem;
                    background: transparent;
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
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
                .mobile-invoice-number {
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
                }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 420px;
                    width: 100%;
                    overflow: hidden;
                }
                .modal-danger {
                    border: 1px solid rgba(214, 59, 59, 0.2);
                }
                .modal-header {
                    display: flex;
                    justify-content: flex-end;
                    padding: 1rem 1rem 0;
                }
                .modal-header-danger {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 0.5rem;
                }
                .modal-icon-danger {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(214, 59, 59, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--danger);
                    margin: 0 auto;
                }
                .modal-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-1);
                }
                .modal-title-danger {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--danger);
                }
                .modal-message {
                    font-size: 0.9rem;
                    color: var(--text-2);
                    margin-top: 0.5rem;
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
                    padding: 0 1.5rem 1rem;
                }
                .modal-footer-center {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-footer-danger {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .text-center {
                    text-align: center;
                }

                /* Form */
                .form-group {
                    margin-top: 1rem;
                }
                .form-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--text-2);
                }
                .form-textarea {
                    width: 100%;
                    padding: 0.65rem;
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.85rem;
                }
                .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
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
                }
                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, var(--danger), #e05a5a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                }
                .btn-success {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, var(--success), #2db87a);
                    color: white;
                    border: none;
                    border-radius: 10px;
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
        </div>
    );
}
