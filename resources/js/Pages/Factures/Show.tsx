import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    FileText,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Send,
    Trash2,
    ArrowLeft,
    Building2,
    Store,
    Package,
    Calendar,
    Euro,
    User,
    FileCheck,
    X,
} from 'lucide-react';
import { pdf, validate, pay, cancel, destroy } from '@/routes/factures';

export default function FactureShow({ facture }: { facture: any }) {
    const { user } = useAuth();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelRaison, setCancelRaison] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canEdit = user?.role === 'ADMIN' || user?.role === 'RESP_LABO';

    const total = facture.lignes.reduce(
        (sum: number, l: any) => sum + parseFloat(l.montant),
        0,
    );

    const formatDate = (date: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getStatutInfo = (statut: string) => {
        const variants: Record<
            string,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            BROUILLON: {
                label: 'Brouillon',
                class: 'status-badge status-badge--warning',
                icon: <Clock size={14} strokeWidth={1.5} />,
            },
            EMISE: {
                label: 'Émise',
                class: 'status-badge status-badge--info',
                icon: <Send size={14} strokeWidth={1.5} />,
            },
            PAYEE: {
                label: 'Payée',
                class: 'status-badge status-badge--success',
                icon: <CheckCircle size={14} strokeWidth={1.5} />,
            },
            ANNULEE: {
                label: 'Annulée',
                class: 'status-badge status-badge--danger',
                icon: <XCircle size={14} strokeWidth={1.5} />,
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

    const handleValidate = () => {
        setIsSubmitting(true);
        router.put(
            validate.url(facture.id),
            {},
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handlePay = () => {
        setIsSubmitting(true);
        router.put(
            pay.url(facture.id),
            {},
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleCancel = () => {
        if (!cancelRaison.trim()) return;
        setIsSubmitting(true);
        router.put(
            cancel.url(facture.id),
            { raison: cancelRaison },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setCancelModalOpen(false);
                    setCancelRaison('');
                },
            },
        );
    };

    const handleDelete = () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            router.delete(destroy.url(facture.id));
        }
    };

    const statutInfo = getStatutInfo(facture.statut);

    return (
        <div className="facture-page">
            <Head title={`Facture ${facture.numero}`} />

            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href="/factures" className="back-link">
                        <ArrowLeft size={18} strokeWidth={1.5} />
                        Retour aux factures
                    </Link>
                    <h1 className="page-title">Facture {facture.numero}</h1>
                    <p className="page-subtitle">
                        Du {formatDate(facture.date_debut)} au{' '}
                        {formatDate(facture.date_fin)} • {facture.periode_type}
                    </p>
                </div>
                <div className="header-actions">
                    <a
                        href={pdf.url(facture.id)}
                        target="_blank"
                        className="btn-secondary"
                        rel="noopener noreferrer"
                    >
                        <Download size={16} strokeWidth={1.5} />
                        PDF
                    </a>
                    {canEdit && facture.statut === 'BROUILLON' && (
                        <>
                            <button
                                onClick={handleValidate}
                                disabled={isSubmitting}
                                className="btn-primary"
                            >
                                {isSubmitting ? (
                                    <span className="spinner" />
                                ) : (
                                    <Send size={16} strokeWidth={1.5} />
                                )}
                                Émettre
                            </button>
                            <button
                                onClick={() => setCancelModalOpen(true)}
                                className="btn-warning"
                            >
                                <XCircle size={16} strokeWidth={1.5} />
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn-danger"
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                                Supprimer
                            </button>
                        </>
                    )}
                    {facture.statut === 'EMISE' && canEdit && (
                        <button
                            onClick={handlePay}
                            disabled={isSubmitting}
                            className="btn-primary"
                        >
                            {isSubmitting ? (
                                <span className="spinner" />
                            ) : (
                                <CheckCircle size={16} strokeWidth={1.5} />
                            )}
                            Marquer payée
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            <div className={`status-banner ${facture.statut.toLowerCase()}`}>
                <div className="status-banner-icon">{statutInfo.icon}</div>
                <div className="status-banner-content">
                    <span className="status-banner-label">Statut :</span>
                    <span className={`status-badge ${statutInfo.class}`}>
                        {statutInfo.label}
                    </span>
                    {facture.validator && (
                        <span className="status-banner-meta">
                            Validée par {facture.validator.nom}
                        </span>
                    )}
                    {facture.paid_at && (
                        <span className="status-banner-meta">
                            Payée le {formatDate(facture.paid_at)}
                        </span>
                    )}
                </div>
            </div>

            {/* Émetteur / Destinataire */}
            <div className="cards-grid">
                <div className="info-card">
                    <div className="info-card-header">
                        <div className="info-card-icon info-card-icon--orange">
                            <Building2 size={20} strokeWidth={1.5} />
                        </div>
                        <h3 className="info-card-title">Émetteur</h3>
                    </div>
                    <div className="info-card-body">
                        <p className="info-card-name">{facture.entity?.nom}</p>
                        {facture.entity?.adresse && (
                            <p className="info-card-address">
                                {facture.entity.adresse}
                            </p>
                        )}
                        <p className="info-card-type">Laboratoire</p>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-card-header">
                        <div className="info-card-icon info-card-icon--orange">
                            <Store size={20} strokeWidth={1.5} />
                        </div>
                        <h3 className="info-card-title">Destinataire</h3>
                    </div>
                    <div className="info-card-body">
                        <p className="info-card-name">
                            {facture.boulangerie?.nom}
                        </p>
                        {facture.boulangerie?.adresse && (
                            <p className="info-card-address">
                                {facture.boulangerie.adresse}
                            </p>
                        )}
                        <p className="info-card-type">Boulangerie</p>
                    </div>
                </div>
            </div>

            {/* Métadonnées */}
            <div className="metadata-card">
                <div className="metadata-grid">
                    <div className="metadata-item">
                        <Calendar size={16} strokeWidth={1.5} />
                        <span>Générée le {formatDate(facture.created_at)}</span>
                    </div>
                    <div className="metadata-item">
                        <User size={16} strokeWidth={1.5} />
                        <span>
                            Générée par {facture.generator?.nom || 'Système'}
                        </span>
                        {facture.generation_auto && (
                            <span className="badge-auto">Automatique</span>
                        )}
                    </div>
                    {facture.validator && (
                        <div className="metadata-item">
                            <FileCheck size={16} strokeWidth={1.5} />
                            <span>Validée par {facture.validator.nom}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tableau des lignes */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Détail de la facture</span>
                    </div>
                    <div className="table-count">
                        {facture.lignes.length} ligne
                        {facture.lignes.length > 1 ? 's' : ''}
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th className="text-right">Quantité</th>
                                <th className="text-right">Prix unitaire</th>
                                <th className="text-right">Montant</th>
                                <th>Lot / DLC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facture.lignes.map((ligne: any) => (
                                <tr key={ligne.id}>
                                    <td className="product-name">
                                        {ligne.product?.nom}
                                    </td>
                                    <td className="text-right">
                                        {ligne.quantite}
                                    </td>
                                    <td className="text-right">
                                        {parseFloat(
                                            ligne.prix_unitaire,
                                        ).toFixed(2)}{' '}
                                        €
                                    </td>
                                    <td className="amount text-right">
                                        {parseFloat(ligne.montant).toFixed(2)} €
                                    </td>
                                    <td className="lot-cell">
                                        {ligne.lot_reference && (
                                            <div className="lot-number">
                                                Lot: {ligne.lot_reference}
                                            </div>
                                        )}
                                        {ligne.dlc && (
                                            <div className="dlc-info">
                                                DLC: {formatDate(ligne.dlc)}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                <div className="total-section">
                    <div className="total-line">
                        <span>Sous-total</span>
                        <span>{total.toFixed(2)} €</span>
                    </div>
                    <div className="total-line grand-total">
                        <span>TOTAL</span>
                        <span>{total.toFixed(2)} €</span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {facture.notes && (
                <div className="notes-card">
                    <div className="notes-header">
                        <FileText size={16} strokeWidth={1.5} />
                        <span>Notes</span>
                    </div>
                    <p className="notes-content">{facture.notes}</p>
                </div>
            )}

            {/* Modal Annulation */}
            {cancelModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setCancelModalOpen(false)}
                >
                    <div
                        className="modal modal-danger"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-danger">
                            <div className="modal-icon-danger">
                                <AlertCircle size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => setCancelModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-danger">
                                Annuler la facture
                            </h3>
                            <p className="modal-message">
                                Êtes-vous sûr de vouloir annuler la facture{' '}
                                <strong>{facture.numero}</strong> ?
                            </p>
                            <div className="form-group">
                                <label className="form-label">
                                    Raison de l'annulation
                                </label>
                                <textarea
                                    value={cancelRaison}
                                    onChange={(e) =>
                                        setCancelRaison(e.target.value)
                                    }
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Expliquez la raison de l'annulation..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-footer-danger">
                            <button
                                onClick={() => setCancelModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={!cancelRaison.trim() || isSubmitting}
                                className="btn-danger"
                            >
                                {isSubmitting ? (
                                    <span className="spinner" />
                                ) : (
                                    <XCircle size={16} strokeWidth={1.5} />
                                )}
                                Confirmer l'annulation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .facture-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem;
                }

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
                    text-decoration: none;
                    margin-bottom: 0.5rem;
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
                    flex-wrap: wrap;
                }

                /* Status Banner */
                .status-banner {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border-radius: 14px;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                }
                .status-banner.brouillon { border-left: 4px solid #f59e0b; }
                .status-banner.emise { border-left: 4px solid var(--blue); }
                .status-banner.payee { border-left: 4px solid var(--success); }
                .status-banner.annulee { border-left: 4px solid var(--danger); }
                .status-banner-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-card-2);
                }
                .status-banner-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .status-banner-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-3);
                }
                .status-banner-meta {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    padding-left: 0.5rem;
                    border-left: 1px solid var(--border);
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .status-badge--warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .status-badge--info { background: rgba(59, 91, 219, 0.1); color: var(--blue); }
                .status-badge--success { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .status-badge--danger { background: rgba(214, 59, 59, 0.1); color: var(--danger); }

                /* Info Cards */
                .cards-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                @media (min-width: 768px) {
                    .cards-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                .info-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .info-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    background: var(--bg-card-2);
                }
                .info-card-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .info-card-icon--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .info-card-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-2);
                    margin: 0;
                }
                .info-card-body {
                    padding: 1rem 1.25rem;
                }
                .info-card-name {
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.25rem;
                }
                .info-card-address {
                    font-size: 0.75rem;
                    color: var(--text-3);
                    margin-bottom: 0.5rem;
                }
                .info-card-type {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }

                /* Metadata */
                .metadata-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    padding: 1rem 1.25rem;
                }
                .metadata-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }
                .metadata-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: var(--text-2);
                }
                .badge-auto {
                    font-size: 0.65rem;
                    padding: 0.2rem 0.5rem;
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                    border-radius: 20px;
                    margin-left: 0.5rem;
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
                .table-wrapper {
                    overflow-x: auto;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .data-table thead tr {
                    border-bottom: 2px solid var(--border);
                }
                .data-table th {
                    padding: 0.75rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                }
                .data-table th.text-right {
                    text-align: right;
                }
                .data-table td {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .data-table td.text-right {
                    text-align: right;
                }
                .product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .amount {
                    font-weight: 700;
                    color: var(--orange);
                }
                .lot-cell {
                    font-size: 0.75rem;
                }
                .lot-number {
                    font-family: monospace;
                    background: var(--bg-card-2);
                    display: inline-block;
                    padding: 0.15rem 0.4rem;
                    border-radius: 4px;
                }
                .dlc-info {
                    margin-top: 0.2rem;
                    color: var(--text-3);
                }

                /* Total Section */
                .total-section {
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }
                .total-line {
                    display: flex;
                    justify-content: flex-end;
                    gap: 2rem;
                    padding: 0.25rem 0;
                }
                .grand-total {
                    font-size: 1.1rem;
                    font-weight: 800;
                    border-top: 1px solid var(--border);
                    margin-top: 0.5rem;
                    padding-top: 0.75rem;
                }
                .grand-total span:first-child {
                    color: var(--text-1);
                }
                .grand-total span:last-child {
                    color: var(--orange);
                    font-size: 1.3rem;
                }

                /* Notes Card */
                .notes-card {
                    background: rgba(245, 158, 11, 0.05);
                    border: 1px solid rgba(245, 158, 11, 0.15);
                    border-radius: 14px;
                    padding: 1rem 1.25rem;
                }
                .notes-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #f59e0b;
                    margin-bottom: 0.5rem;
                }
                .notes-content {
                    font-size: 0.85rem;
                    color: var(--text-2);
                    line-height: 1.5;
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
                    text-decoration: none;
                }
                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--danger), #e05a5a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-warning {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, #f59e0b, #fbbf24);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
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
                    font-size: 0.8rem;
                    cursor: pointer;
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
                    max-width: 460px;
                    width: 100%;
                    overflow: hidden;
                }
                .modal-danger {
                    border: 1px solid rgba(214, 59, 59, 0.2);
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
                .modal-title-danger {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--danger);
                    margin-bottom: 0.5rem;
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

                .spinner {
                    width: 16px;
                    height: 16px;
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
