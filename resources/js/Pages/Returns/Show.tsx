import { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import returnsRoutes from '@/routes/returns';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Building2,
    Package,
    Calendar,
    User,
    FileText,
    AlertTriangle,
    RefreshCw,
    Trash2,
    Send,
    Check,
    X,
    Upload,
    Eye,
    Download,
    Camera,
    Edit,
    Info,
} from 'lucide-react';

export default function ReturnShow() {
    const page = usePage();
    const productReturn = page.props.return as any;
    const canSend = page.props.canSend as boolean;
    const canEdit = page.props.canEdit as boolean;
    const canConfirm = page.props.canConfirm as boolean;
    const canReject = page.props.canReject as boolean;
    const canProcess = page.props.canProcess as boolean;
    const canCancel = page.props.canCancel as boolean;
    const canAddPhotos = page.props.canAddPhotos as boolean;

    const [rejectionReason, setRejectionReason] = useState('');
    const [treatmentAction, setTreatmentAction] = useState('');
    const [treatmentNotes, setTreatmentNotes] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);

    const getStatusInfo = (status: string) => {
        const classes: Record<
            string,
            { label: string; class: string; icon: React.ReactNode }
        > = {
            BROUILLON: {
                label: 'Brouillon',
                class: 'status-badge status-badge--warning',
                icon: <Clock size={14} strokeWidth={1.5} />,
            },
            ENVOYEE: {
                label: 'Envoyée au labo',
                class: 'status-badge status-badge--info',
                icon: <Truck size={14} strokeWidth={1.5} />,
            },
            RECEUE_PAR_LABO: {
                label: 'Reçue au laboratoire',
                class: 'status-badge status-badge--warning',
                icon: <Building2 size={14} strokeWidth={1.5} />,
            },
            TRAITEE: {
                label: 'Traitée',
                class: 'status-badge status-badge--info',
                icon: <RefreshCw size={14} strokeWidth={1.5} />,
            },
            CLOTUREE: {
                label: 'Clôturée',
                class: 'status-badge status-badge--success',
                icon: <CheckCircle size={14} strokeWidth={1.5} />,
            },
            REJETEE: {
                label: 'Rejetée',
                class: 'status-badge status-badge--danger',
                icon: <XCircle size={14} strokeWidth={1.5} />,
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
                  icon: <AlertTriangle size={14} strokeWidth={1.5} />,
              }
            : {
                  label: 'DLC expirée',
                  class: 'cause-badge cause-badge--warning',
                  icon: <Clock size={14} strokeWidth={1.5} />,
              };
    };

    const getTreatmentLabel = (action: string) => {
        const labels: Record<string, string> = {
            brule: '🔥 Brûlé',
            jete: '🗑️ Jeté',
            recyclage: '♻️ Recyclé',
            retour_stock: '🔄 Retour en stock',
            autre: '✏️ Autre',
        };
        return labels[action] || action;
    };

    const handleUploadPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotoFiles(Array.from(e.target.files));
        }
    };

    const submitPhotos = () => {
        if (photoFiles.length === 0) return;

        const formData = new FormData();
        photoFiles.forEach((file) => formData.append('photos[]', file));

        router.post(returnsRoutes.photosStore(productReturn.id), formData, {
            onSuccess: () => setPhotoFiles([]),
        });
    };

    const confirmSend = () => {
        router.post(
            returnsRoutes.send(productReturn.id),
            {},
            {
                onSuccess: () => {},
            },
        );
    };

    const confirmReject = () => {
        if (!rejectionReason.trim()) return;
        setActionSubmitting(true);

        router.post(
            returnsRoutes.reject(productReturn.id),
            {
                rejection_reason: rejectionReason,
            },
            {
                onFinish: () => {
                    setActionSubmitting(false);
                    setShowRejectModal(false);
                    setRejectionReason('');
                },
            },
        );
    };

    const confirmProcess = () => {
        if (!treatmentAction) return;
        setActionSubmitting(true);

        router.post(
            returnsRoutes.process(productReturn.id),
            {
                treatment_action: treatmentAction,
                treatment_notes: treatmentNotes,
            },
            {
                onFinish: () => {
                    setActionSubmitting(false);
                    setShowProcessModal(false);
                    setTreatmentAction('');
                    setTreatmentNotes('');
                },
            },
        );
    };

    const confirmCancel = () => {
        if (confirm('Annuler ce retour ?')) {
            router.delete(returnsRoutes.destroy(productReturn.id));
        }
    };

    const statusInfo = getStatusInfo(productReturn.status);
    const causeInfo = getCauseInfo(productReturn.cause);

    return (
        <>
            <Head title={`Retour ${productReturn.reference}`} />

            <div className="return-show-page">
                {/* Header avec breadcrumb */}
                <div className="page-header">
                    <div>
                        <Link
                            href={returnsRoutes.index()}
                            className="back-link"
                        >
                            <ArrowLeft size={18} strokeWidth={1.5} />
                            Retour aux retours
                        </Link>
                        <div className="header-title-row">
                            <h1 className="page-title">
                                Retour {productReturn.reference}
                            </h1>
                            <div className="header-badges">
                                <span className={statusInfo.class}>
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                </span>
                                <span className={causeInfo.class}>
                                    {causeInfo.icon}
                                    {causeInfo.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="header-actions">
                        {canEdit && (
                            <Link
                                href={returnsRoutes.edit(productReturn.id)}
                                className="btn-secondary"
                            >
                                <Edit size={16} strokeWidth={1.5} />
                                Modifier
                            </Link>
                        )}

                        {canSend && productReturn.status === 'BROUILLON' && (
                            <button
                                onClick={confirmSend}
                                className="btn-primary"
                            >
                                <Send size={16} strokeWidth={1.5} />
                                Envoyer au laboratoire
                            </button>
                        )}

                        {canConfirm && productReturn.status === 'ENVOYEE' && (
                            <button
                                onClick={() =>
                                    router.post(
                                        returnsRoutes.confirm(productReturn.id),
                                    )
                                }
                                className="btn-success"
                            >
                                <CheckCircle size={16} strokeWidth={1.5} />
                                Confirmer la réception
                            </button>
                        )}

                        {canReject &&
                            ['ENVOYEE', 'RECEUE_PAR_LABO'].includes(
                                productReturn.status,
                            ) && (
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="btn-danger"
                                >
                                    <XCircle size={16} strokeWidth={1.5} />
                                    Rejeter
                                </button>
                            )}

                        {canProcess &&
                            productReturn.status === 'RECEUE_PAR_LABO' && (
                                <button
                                    onClick={() => setShowProcessModal(true)}
                                    className="btn-primary"
                                >
                                    <RefreshCw size={16} strokeWidth={1.5} />
                                    Traiter le retour
                                </button>
                            )}

                        {canCancel && productReturn.status === 'BROUILLON' && (
                            <button
                                onClick={confirmCancel}
                                className="btn-secondary"
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                                Annuler
                            </button>
                        )}
                    </div>
                </div>

                {/* Message de guidance selon le statut */}
                {productReturn.status === 'BROUILLON' && canEdit && (
                    <div className="info-banner info-banner--info">
                        <Info size={18} strokeWidth={1.5} />
                        <span>
                            <strong>Modifiable</strong> — Vous pouvez modifier
                            ce retour en cliquant sur le bouton "Modifier". Une
                            fois envoyé, il ne pourra plus être modifié.
                        </span>
                    </div>
                )}

                {productReturn.status !== 'BROUILLON' && (
                    <div className="info-banner info-banner--secondary">
                        <Eye size={18} strokeWidth={1.5} />
                        <span>
                            <strong>Actions labo</strong> — Pour confirmer,
                            rejeter ou traiter ce retour, utilisez les boutons
                            ci-dessus.
                        </span>
                    </div>
                )}

                <div className="return-grid">
                    {/* Colonne principale */}
                    <div className="main-column">
                        {/* Informations générales */}
                        <div className="info-card">
                            <div className="info-card-header">
                                <FileText size={18} strokeWidth={1.5} />
                                <span>Informations générales</span>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Boutique</span>
                                    <span className="info-value">
                                        {productReturn.entity?.nom}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">
                                        Laboratoire destinataire
                                    </span>
                                    <span className="info-value">
                                        {productReturn.laboEntity?.nom}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">
                                        BL d'origine
                                    </span>
                                    <span className="info-value">
                                        {productReturn.bl_number || '—'}
                                    </span>
                                </div>
                                {/* <div className="info-item">
                                    <span className="info-label">BL FIFO</span>
                                    <span className="info-value">
                                        {productReturn.bl_fifo || '—'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">
                                        DLC indiquée
                                    </span>
                                    <span
                                        className={`info-value ${productReturn.dlc_display && new Date(productReturn.dlc_display) < new Date() ? 'text-danger' : ''}`}
                                    >
                                        {productReturn.dlc_display
                                            ? new Date(
                                                  productReturn.dlc_display,
                                              ).toLocaleDateString('fr-FR')
                                            : '—'}
                                        {productReturn.dlc_display &&
                                            new Date(
                                                productReturn.dlc_display,
                                            ) < new Date() && (
                                                <span className="expired-badge">
                                                    Expirée
                                                </span>
                                            )}
                                    </span>
                                </div> */}
                                <div className="info-item">
                                    <span className="info-label">Créé par</span>
                                    <span className="info-value">
                                        {productReturn.creator?.nom}
                                    </span>
                                </div>
                                {productReturn.labo_confirmed && (
                                    <>
                                        <div className="info-item">
                                            <span className="info-label">
                                                Confirmé par (labo)
                                            </span>
                                            <span className="info-value">
                                                {productReturn.receiver?.nom}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">
                                                Date confirmation
                                            </span>
                                            <span className="info-value">
                                                {new Date(
                                                    productReturn.confirmed_at!,
                                                ).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {productReturn.treatment_action && (
                                    <>
                                        <div className="info-item full-width">
                                            <span className="info-label">
                                                Action de traitement
                                            </span>
                                            <span className="info-value">
                                                {getTreatmentLabel(
                                                    productReturn.treatment_action,
                                                )}
                                                {productReturn.treatment_notes && (
                                                    <p className="treatment-notes">
                                                        {
                                                            productReturn.treatment_notes
                                                        }
                                                    </p>
                                                )}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">
                                                Traité par
                                            </span>
                                            <span className="info-value">
                                                {productReturn.processor?.nom}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">
                                                Date traitement
                                            </span>
                                            <span className="info-value">
                                                {new Date(
                                                    productReturn.processed_at!,
                                                ).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            {productReturn.notes && (
                                <div className="notes-section">
                                    <span className="info-label">Notes</span>
                                    <p className="notes-content">
                                        {productReturn.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lignes de retour */}
                        <div className="table-card">
                            <div className="table-card-header">
                                <Package size={18} strokeWidth={1.5} />
                                <span>Produits retournés</span>
                            </div>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Produit</th>
                                            <th>DLC</th>
                                            <th>Lot</th>
                                            <th className="text-center">
                                                Qté attendue
                                            </th>
                                            <th className="text-center">
                                                Qté retournée
                                            </th>
                                            <th>Cause</th>
                                            <th>Photos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productReturn.lines.map(
                                            (line: any) => (
                                                <tr key={line.id}>
                                                    <td className="product-name">
                                                        {line.product?.nom}
                                                    </td>
                                                    <td
                                                        className={
                                                            line.dlc &&
                                                            new Date(line.dlc) <
                                                                new Date()
                                                                ? 'text-danger'
                                                                : ''
                                                        }
                                                    >
                                                        {line.dlc
                                                            ? new Date(
                                                                  line.dlc,
                                                              ).toLocaleDateString(
                                                                  'fr-FR',
                                                              )
                                                            : '—'}
                                                        {line.dlc &&
                                                            new Date(line.dlc) <
                                                                new Date() && (
                                                                <span className="expired-badge">
                                                                    Expirée
                                                                </span>
                                                            )}
                                                    </td>
                                                    <td className="lot-cell">
                                                        {line.lot_reference ||
                                                            '—'}
                                                    </td>
                                                    <td className="text-center">
                                                        {line.quantite_attendue}
                                                    </td>
                                                    <td className="quantity-returned text-center">
                                                        {
                                                            line.quantite_retournee
                                                        }
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`cause-badge ${line.cause === 'DEFECTUEUX' ? 'cause-badge--danger' : 'cause-badge--warning'}`}
                                                        >
                                                            {line.cause ===
                                                            'DEFECTUEUX'
                                                                ? '⚠️ Défectueux'
                                                                : '📅 DLC expirée'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {line.photos &&
                                                        line.photos.length >
                                                            0 ? (
                                                            <div className="photo-thumbnails">
                                                                {line.photos
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            photo: any,
                                                                        ) => (
                                                                            <img
                                                                                key={
                                                                                    photo.id
                                                                                }
                                                                                src={
                                                                                    photo.url
                                                                                }
                                                                                alt=""
                                                                                className="photo-thumbnail"
                                                                                onClick={() =>
                                                                                    window.open(
                                                                                        photo.url,
                                                                                        '_blank',
                                                                                    )
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                {line.photos
                                                                    .length >
                                                                    3 && (
                                                                    <span className="photo-more">
                                                                        +
                                                                        {line
                                                                            .photos
                                                                            .length -
                                                                            3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Photos globales */}
                        {productReturn.photos &&
                            productReturn.photos.length > 0 && (
                                <div className="photos-card">
                                    <div className="photos-card-header">
                                        <Camera size={18} strokeWidth={1.5} />
                                        <span>Photos du retour</span>
                                    </div>
                                    <div className="photos-grid">
                                        {productReturn.photos.map(
                                            (photo: any) => (
                                                <div
                                                    key={photo.id}
                                                    className="photo-item"
                                                >
                                                    <img
                                                        src={photo.url}
                                                        alt="Retour"
                                                        className="photo-image"
                                                        onClick={() =>
                                                            window.open(
                                                                photo.url,
                                                                '_blank',
                                                            )
                                                        }
                                                    />
                                                    {canAddPhotos && (
                                                        <button
                                                            onClick={() =>
                                                                router.delete(
                                                                    returnsRoutes.photosDestroy(
                                                                        photo.id,
                                                                    ),
                                                                )
                                                            }
                                                            className="photo-delete"
                                                            title="Supprimer"
                                                        >
                                                            <X
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Ajout de photos */}
                        {canAddPhotos &&
                            productReturn.status !== 'CLOTUREE' &&
                            productReturn.status !== 'REJETEE' && (
                                <div className="upload-card">
                                    <div className="upload-card-header">
                                        <Upload size={18} strokeWidth={1.5} />
                                        <span>Ajouter des photos</span>
                                    </div>
                                    <div className="upload-area">
                                        <input
                                            type="file"
                                            id="photo-upload"
                                            accept="image/*"
                                            multiple
                                            onChange={handleUploadPhotos}
                                            className="upload-input"
                                        />
                                        <label
                                            htmlFor="photo-upload"
                                            className="upload-label"
                                        >
                                            <Upload
                                                size={24}
                                                strokeWidth={1.5}
                                            />
                                            <span>Ajouter des photos</span>
                                            <span className="upload-hint">
                                                JPG, PNG, WebP jusqu'à 5 Mo
                                            </span>
                                        </label>
                                    </div>
                                    {photoFiles.length > 0 && (
                                        <div className="upload-actions">
                                            <span className="upload-count">
                                                {photoFiles.length} fichier(s)
                                                sélectionné(s)
                                            </span>
                                            <button
                                                onClick={submitPhotos}
                                                className="btn-primary-sm"
                                            >
                                                <Upload
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                                Uploader
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Colonne latérale - Résumé */}
                    <div className="sidebar-column">
                        <div className="summary-card">
                            <h3 className="summary-title">Résumé du retour</h3>
                            <div className="summary-items">
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Date création
                                    </span>
                                    <span className="summary-value">
                                        {new Date(productReturn.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Date d'envoi
                                    </span>
                                    <span className="summary-value">
                                        {productReturn.updated_at && new Date(productReturn.updated_at) > new Date(productReturn.created_at)
                                            ? new Date(productReturn.updated_at).toLocaleDateString('fr-FR')
                                            : '—'}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">
                                        Total retourné
                                    </span>
                                    <span className="summary-value summary-value--danger">
                                        {productReturn.lines?.reduce((sum: number, line: any) => sum + line.quantite_retournee, 0) || 0} unités
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions rapides pour traitement */}
                        {productReturn.status === 'RECEUE_PAR_LABO' && (
                            <div className="quick-actions-card">
                                <h3 className="quick-actions-title">
                                    Actions de traitement rapide
                                </h3>
                                <div className="quick-actions-grid">
                                    <button
                                        onClick={() => {
                                            setTreatmentAction('brule');
                                            setShowProcessModal(true);
                                        }}
                                        className="quick-action-btn danger"
                                    >
                                        🔥 Brûler
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTreatmentAction('jete');
                                            setShowProcessModal(true);
                                        }}
                                        className="quick-action-btn secondary"
                                    >
                                        🗑️ Jeter
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTreatmentAction('recyclage');
                                            setShowProcessModal(true);
                                        }}
                                        className="quick-action-btn success"
                                    >
                                        ♻️ Recycler
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTreatmentAction('retour_stock');
                                            setShowProcessModal(true);
                                        }}
                                        className="quick-action-btn primary"
                                    >
                                        🔄 Retour en stock
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTreatmentAction('autre');
                                            setShowProcessModal(true);
                                        }}
                                        className="quick-action-btn warning"
                                    >
                                        ✏️ Autre
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Rejeter */}
            {showRejectModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowRejectModal(false)}
                >
                    <div
                        className="modal modal-danger"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-danger">
                            <div className="modal-icon-danger">
                                <XCircle size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-danger">
                                Rejeter le retour
                            </h3>
                            <p className="modal-message">
                                Êtes-vous sûr de vouloir rejeter ce retour ?
                            </p>
                            <div className="form-group">
                                <label className="form-label">
                                    Motif du rejet *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) =>
                                        setRejectionReason(e.target.value)
                                    }
                                    className="form-textarea"
                                    rows={4}
                                    placeholder="Expliquez pourquoi ce retour est rejeté..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer-danger">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={
                                    actionSubmitting || !rejectionReason.trim()
                                }
                                className="btn-danger"
                            >
                                {actionSubmitting ? (
                                    <span className="spinner" />
                                ) : (
                                    <XCircle size={16} strokeWidth={1.5} />
                                )}
                                Rejeter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Traiter */}
            {showProcessModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowProcessModal(false)}
                >
                    <div
                        className="modal modal-process"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-process">
                            <div className="modal-icon-process">
                                <RefreshCw size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => setShowProcessModal(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <h3 className="modal-title-process text-center">
                                Traiter le retour
                            </h3>
                            <div className="form-group">
                                <label className="form-label">Action *</label>
                                <select
                                    value={treatmentAction}
                                    onChange={(e) =>
                                        setTreatmentAction(e.target.value)
                                    }
                                    className="form-select"
                                >
                                    <option value="">
                                        Sélectionner une action
                                    </option>
                                    <option value="brule">🔥 Brûler</option>
                                    <option value="jete">🗑️ Jeter</option>
                                    <option value="recyclage">
                                        ♻️ Recycler
                                    </option>
                                    <option value="retour_stock">
                                        🔄 Retour en stock
                                    </option>
                                    <option value="autre">✏️ Autre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Notes{' '}
                                    <span className="form-optional">
                                        optionnel
                                    </span>
                                </label>
                                <textarea
                                    value={treatmentNotes}
                                    onChange={(e) =>
                                        setTreatmentNotes(e.target.value)
                                    }
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Détails sur le traitement..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer-process">
                            <button
                                onClick={() => setShowProcessModal(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmProcess}
                                disabled={actionSubmitting || !treatmentAction}
                                className="btn-primary"
                            >
                                {actionSubmitting ? (
                                    <span className="spinner" />
                                ) : (
                                    <CheckCircle size={16} strokeWidth={1.5} />
                                )}
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .return-show-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1400px;
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
                .header-title-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin: 0;
                }
                .header-badges {
                    display: flex;
                    gap: 0.5rem;
                }
                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                /* Badges */
                .status-badge, .cause-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.3rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
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
                .cause-badge--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .cause-badge--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }

                /* Grid Layout */
                .return-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 1024px) {
                    .return-grid {
                        grid-template-columns: 2fr 1fr;
                    }
                }

                /* Cards */
                .info-card, .table-card, .photos-card, .upload-card, .summary-card, .quick-actions-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .info-card-header, .table-card-header, .photos-card-header, .upload-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-2);
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    padding: 1.25rem;
                }
                @media (min-width: 640px) {
                    .info-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .info-item.full-width {
                    grid-column: 1 / -1;
                }
                .info-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .info-value {
                    font-size: 0.9rem;
                    color: var(--text-1);
                }
                .text-danger {
                    color: var(--danger);
                }
                .expired-badge {
                    font-size: 0.65rem;
                    padding: 0.125rem 0.375rem;
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                    border-radius: 20px;
                    margin-left: 0.5rem;
                }
                .treatment-notes {
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: var(--text-2);
                    font-weight: normal;
                }
                .notes-section {
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }
                .notes-content {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--text-2);
                    line-height: 1.5;
                }

                /* Table */
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
                .data-table th.text-center {
                    text-align: center;
                }
                .data-table td {
                    padding: 0.85rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .product-name {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .lot-cell {
                    font-family: monospace;
                    font-size: 0.8rem;
                }
                .text-center {
                    text-align: center;
                }
                .quantity-returned {
                    font-weight: 700;
                    color: var(--orange);
                }
                .photo-thumbnails {
                    display: flex;
                    gap: 0.25rem;
                    align-items: center;
                }
                .photo-thumbnail {
                    width: 32px;
                    height: 32px;
                    object-fit: cover;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .photo-more {
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .text-muted {
                    color: var(--text-3);
                }

                /* Photos */
                .photos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 0.75rem;
                    padding: 1.25rem;
                }
                .photo-item {
                    position: relative;
                    aspect-ratio: 1;
                }
                .photo-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                    cursor: pointer;
                }
                .photo-delete {
                    position: absolute;
                    top: 0.25rem;
                    right: 0.25rem;
                    background: rgba(0,0,0,0.6);
                    border: none;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .photo-item:hover .photo-delete {
                    opacity: 1;
                }

                /* Upload */
                .upload-area {
                    border: 2px dashed var(--border);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 1.25rem;
                    text-align: center;
                }
                .upload-input {
                    display: none;
                }
                .upload-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    color: var(--text-3);
                }
                .upload-label svg {
                    color: var(--orange);
                }
                .upload-hint {
                    font-size: 0.7rem;
                }
                .upload-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }
                .upload-count {
                    font-size: 0.8rem;
                    color: var(--text-3);
                }

                /* Summary Card */
                .summary-card, .quick-actions-card {
                    padding: 1.25rem;
                }
                .summary-title, .quick-actions-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 1rem;
                }
                .summary-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .summary-label {
                    font-size: 0.8rem;
                    color: var(--text-3);
                }
                .summary-value {
                    font-weight: 600;
                    color: var(--text-1);
                }
                .summary-value--danger {
                    color: var(--orange);
                }
                .quick-actions-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .quick-action-btn {
                    flex: 1;
                    min-width: 80px;
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-align: center;
                    cursor: pointer;
                    border: none;
                }
                .quick-action-btn.danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .quick-action-btn.secondary {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                }
                .quick-action-btn.success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .quick-action-btn.primary {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .quick-action-btn.warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
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
                    padding: 0.4rem 0.8rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    cursor: pointer;
                }
                .btn-success {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--success), #2db87a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
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
                .modal-process {
                    border: 1px solid rgba(232, 116, 42, 0.2);
                }
                .modal-header-danger, .modal-header-process {
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
                .modal-icon-process {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(232, 116, 42, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--orange);
                    margin: 0 auto;
                }
                .modal-title-danger {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--danger);
                    margin-bottom: 0.5rem;
                }
                .modal-title-process {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--orange);
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
                .modal-footer-danger, .modal-footer-process {
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
                .form-textarea, .form-select {
                    width: 100%;
                    padding: 0.65rem;
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.85rem;
                }
                .form-textarea:focus, .form-select:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .form-optional {
                    font-weight: 400;
                    text-transform: none;
                    font-size: 0.65rem;
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

                /* Info Banners */
                .info-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.25rem;
                    font-size: 0.85rem;
                    line-height: 1.5;
                }
                .info-banner--info {
                    background: rgba(59, 91, 219, 0.08);
                    border-left: 4px solid var(--blue);
                    color: var(--blue);
                }
                .info-banner--secondary {
                    background: rgba(107, 114, 128, 0.08);
                    border-left: 4px solid var(--text-3);
                    color: var(--text-2);
                }
                .info-banner strong {
                    font-weight: 700;
                }
            `}</style>
        </>
    );
}
