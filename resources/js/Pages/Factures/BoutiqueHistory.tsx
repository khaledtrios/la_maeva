import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    ArrowLeft,
    FileText,
    Download,
    Eye,
    Euro,
    Store,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Send,
} from 'lucide-react';
import { show, pdf } from '@/routes/factures';

export default function FactureBoutiqueHistory({
    boutique,
    factures,
}: {
    boutique: { id: number; nom: string; adresse: string | null };
    factures: {
        data: Array<{
            id: number;
            numero: string;
            date_debut: string;
            date_fin: string;
            periode_type: string;
            montant_total: number;
            statut: string;
            generation_auto: boolean;
            entity: { nom: string };
            lignes: Array<{
                id: number;
                quantite: number;
                prix_unitaire: number;
                montant: number;
                product: { nom: string };
            }>;
        }>;
        links: any;
        current_page: number;
        last_page: number;
    };
}) {
    const { user } = useAuth();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const getStatutInfo = (statut: string) => {
        const variants: Record<
            string,
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

    const formatDate = (date: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const total = factures.data.reduce(
        (sum, f) => sum + parseFloat(f.montant_total.toString()),
        0,
    );

    const stats = {
        brouillon: factures.data.filter((f) => f.statut === 'BROUILLON').length,
        emise: factures.data.filter((f) => f.statut === 'EMISE').length,
        payee: factures.data.filter((f) => f.statut === 'PAYEE').length,
    };

    return (
        <div className="history-page">
            <Head title={`Factures ${boutique.nom}`} />

            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href="/factures" className="back-link">
                        <ArrowLeft size={18} strokeWidth={1.5} />
                        Retour aux factures
                    </Link>
                    <h1 className="page-title">Factures {boutique.nom}</h1>
                    {boutique.adresse && (
                        <p className="page-subtitle">{boutique.adresse}</p>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <FileText size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total factures</div>
                        <div className="stat-value">{factures.data.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--warning">
                        <Clock size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">En attente</div>
                        <div className="stat-value stat-value--warning">
                            {stats.brouillon + stats.emise}
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
                            {stats.payee}
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
                            {total.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                            })}{' '}
                            €
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            {factures.data.length === 0 ? (
                <div className="empty-state-card">
                    <FileText size={48} strokeWidth={1} />
                    <div className="empty-state-text">
                        Aucune facture pour cette boutique
                    </div>
                </div>
            ) : (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Historique des factures</span>
                        </div>
                        <div className="table-count">
                            {factures.data.length} facture
                            {factures.data.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Période</th>
                                    <th>Émetteur</th>
                                    <th className="text-right">Montant</th>
                                    <th>Statut</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factures.data.map((f) => {
                                    const statutInfo = getStatutInfo(f.statut);
                                    return (
                                        <tr
                                            key={f.id}
                                            className={
                                                expandedId === f.id
                                                    ? 'expanded'
                                                    : ''
                                            }
                                            onClick={() =>
                                                setExpandedId(
                                                    expandedId === f.id
                                                        ? null
                                                        : f.id,
                                                )
                                            }
                                        >
                                            <td>
                                                <Link
                                                    href={show.url(f.id)}
                                                    className="invoice-link"
                                                >
                                                    {f.numero}
                                                </Link>
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
                                            <td className="text-muted">
                                                {f.entity?.nom}
                                            </td>
                                            <td className="amount-value text-right">
                                                {parseFloat(
                                                    f.montant_total.toString(),
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
                                            <td className="text-center">
                                                <div className="table-actions">
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
                                                        <Eye
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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

            <style>{`
                .history-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem;
                }
                .page-header {
                    margin-bottom: 0.5rem;
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
                .stat-icon--warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
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
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--orange);
                }
                .stat-value--warning {
                    color: #f59e0b;
                }
                .stat-value--success {
                    color: var(--success);
                }
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
                .data-table th.text-center {
                    text-align: center;
                }
                .data-table tbody tr {
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .data-table tbody tr:hover {
                    background: var(--bg-card-2);
                }
                .data-table td {
                    padding: 0.75rem 1rem;
                }
                .invoice-link {
                    font-weight: 600;
                    color: var(--orange);
                    text-decoration: none;
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
                }
                .btn-icon:hover {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
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
                }
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
                }
                .pagination-btn {
                    min-width: 34px;
                    padding: 0.4rem 0.6rem;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
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
            `}</style>
        </div>
    );
}
