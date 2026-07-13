import { useState, useMemo } from 'react';
import { router, useForm } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import receptions from '@/routes/receptions';
import returns from '@/routes/returns';
import {
    ClipboardList,
    Inbox,
    CheckCircle,
    X,
    AlertCircle,
    Package,
    Calendar,
    Truck,
    AlertTriangle,
    RefreshCw,
    Search,
} from 'lucide-react';
import type { Reception, ReceptionLine } from '@/types';

interface ReceptionsIndexProps {
    en_attente: (Reception & {
        expedition: { entity: { nom: string }; lines: any[] };
        lines: (ReceptionLine & { product: any })[];
    })[];
    historique: (Reception & {
        expedition: { entity: { nom: string }; lines: any[] };
        lines: (ReceptionLine & { product: any })[];
    })[];
}

export default function ReceptionsIndex({
    en_attente,
    historique,
}: ReceptionsIndexProps) {
    const { hasRole } = useAuth();
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [qtesRecues, setQtesRecues] = useState<Record<number, number>>({});
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedReception, setSelectedReception] = useState<any>(null);

    const confirmForm = useForm<{
        lines: Array<{ reception_line_id: number; qte_recue: number }>;
    }>({ lines: [] });

    const openConfirm = (reception: any) => {
        setSelectedReception(reception);
        const initial: Record<number, number> = {};
        reception.lines.forEach((line: any) => {
            initial[line.id] = line.qte_recue ?? line.qte_attendue;
        });
        setQtesRecues(initial);
        setConfirmModalOpen(true);
    };

    const handleConfirm = () => {
        if (!selectedReception) return;
        const lines = Object.entries(qtesRecues).map(([id, qte_recue]) => ({
            reception_line_id: Number(id),
            qte_recue,
        }));
        router.post(
            receptions.confirm(selectedReception.id),
            { lines },
            {
                onSuccess: () => {
                    setConfirmModalOpen(false);
                    setConfirmingId(null);
                    setSelectedReception(null);
                    setQtesRecues({});
                },
            },
        );
    };

    const ecartColor = (attendue: number, recue: number | null) => {
        if (recue === null) return 'text-muted';
        const diff = recue - attendue;
        if (diff === 0) return 'text-success';
        return diff < 0 ? 'text-danger' : 'text-warning';
    };

    const ecartValue = (attendue: number, recue: number | null) => {
        if (recue === null) return '—';
        const diff = recue - attendue;
        return diff > 0 ? `+${diff}` : diff.toString();
    };

    const totalAttendu = (reception: any) =>
        reception.lines.reduce(
            (sum: number, l: any) => sum + l.qte_attendue,
            0,
        );
    const totalRecu = (reception: any) =>
        reception.lines.reduce(
            (sum: number, l: any) => sum + (l.qte_recue ?? 0),
            0,
        );

    const hasEcart = (reception: any) => {
        return reception.lines.some(
            (line: any) =>
                line.qte_recue !== null && line.qte_recue !== line.qte_attendue,
        );
    };

    // ── Search ──
    const [search, setSearch] = useState('');
    const filteredHistorique = useMemo(
        () =>
            !search
                ? historique
                : historique.filter((r) =>
                      (r.expedition.entity.nom || '')
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                  ),
        [historique, search],
    );

    // Calcule la DLC : date d'expédition + dlc du produit
    const calculateDLC = (
        expeditionDate: string,
        dlc: number | null,
    ): string => {
        if (!expeditionDate || dlc === null) return '-';
        const date = new Date(expeditionDate);
        date.setDate(date.getDate() + dlc);
        return date.toLocaleDateString('fr-FR');
    };

    return (
        <div className="receptions-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Réceptions</h1>
                    <p className="page-subtitle">
                        Gestion des réceptions de marchandises
                    </p>
                </div>
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--warning">
                        <AlertCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">En attente</div>
                        <div className="stat-value stat-value--warning">
                            {en_attente.length}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <CheckCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Réceptionnées</div>
                        <div className="stat-value stat-value--success">
                            {historique.length}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Package size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total produits</div>
                        <div className="stat-value">
                            {[...en_attente, ...historique].reduce(
                                (acc, r) => acc + totalAttendu(r),
                                0,
                            )}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Truck size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Fournisseurs</div>
                        <div className="stat-value">
                            {
                                new Set(
                                    [...en_attente, ...historique].map(
                                        (r) => r.expedition.entity.nom,
                                    ),
                                ).size
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION EN ATTENTE ── */}
            {en_attente.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">
                            <div className="section-dot section-dot--warning" />
                            <span>En attente de confirmation</span>
                        </div>
                        <div className="section-badge">{en_attente.length}</div>
                    </div>
                    <div className="cards-list">
                        {en_attente.map((reception) => (
                            <div
                                key={reception.id}
                                className="reception-card pending"
                            >
                                <div className="reception-card-header">
                                    <div className="reception-info">
                                        <div className="reception-title-row">
                                            <span className="reception-entity">
                                                {
                                                    reception.expedition.entity
                                                        .nom
                                                }
                                            </span>
                                        </div>
                                        <span className="reception-date">
                                            <Calendar
                                                size={12}
                                                strokeWidth={1.5}
                                            />
                                            {new Date(
                                                reception.date,
                                            ).toLocaleDateString('fr-FR')}
                                        </span>
                                        <div className="reception-stats">
                                            <span className="reception-stat">
                                                <span className="reception-stat-label">
                                                    Attendu
                                                </span>
                                                <span className="reception-stat-value">
                                                    {totalAttendu(reception)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openConfirm(reception)}
                                        className="btn-primary-sm"
                                    >
                                        <CheckCircle
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        Confirmer
                                    </button>
                                </div>

                                <div className="reception-preview">
                                    <div className="preview-products">
                                        {reception.lines
                                            .slice(0, 3)
                                            .map((line) => {
                                                const dlcDate = calculateDLC(
                                                    reception.expedition.date,
                                                    line.product?.dlc ?? null,
                                                );
                                                return (
                                                    <div
                                                        key={line.id}
                                                        className="preview-product"
                                                    >
                                                        <span className="preview-name">
                                                            {line.product.nom}
                                                        </span>
                                                        <span className="preview-qty">
                                                            {line.qte_attendue}{' '}
                                                            u.
                                                        </span>
                                                        {line.product?.dlc && (
                                                            <span className="preview-dlc">
                                                                DLC: {dlcDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        {reception.lines.length > 3 && (
                                            <span className="preview-more">
                                                +{reception.lines.length - 3}{' '}
                                                autres
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── SECTION HISTORIQUE ── */}
            <div className="section">
                <div className="section-header">
                    <div className="section-title">
                        <div className="section-dot section-dot--success" />
                        <span>Historique des réceptions</span>
                    </div>
                    <div>
                        <div className="search-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher une réception..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="finput finput--search"
                            />
                        </div>
                    </div>
                    <div className="section-badge">{historique.length}</div>
                </div>

                {filteredHistorique.length === 0 ? (
                    <div className="empty-state-card">
                        <Inbox size={48} strokeWidth={1} />
                        <div className="empty-state-text">
                            {search
                                ? 'Aucune réception trouvée'
                                : 'Aucune réception confirmée'}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="cards-list">
                            {filteredHistorique.map((reception) => (
                                <div
                                    key={reception.id}
                                    className="reception-card"
                                >
                                    <div className="reception-card-header">
                                        <div className="reception-info">
                                            <div className="reception-title-row">
                                                <span className="reception-entity">
                                                    {
                                                        reception.expedition
                                                            .entity.nom
                                                    }
                                                </span>
                                            </div>
                                            <span className="reception-date">
                                                <Calendar
                                                    size={12}
                                                    strokeWidth={1.5}
                                                />
                                                {new Date(
                                                    reception.date,
                                                ).toLocaleDateString('fr-FR')}
                                            </span>
                                            <div className="reception-stats">
                                                <span className="reception-stat">
                                                    <span className="reception-stat-label">
                                                        Reçu
                                                    </span>
                                                    <span className="reception-stat-value reception-stat-value--success">
                                                        {totalRecu(reception)}
                                                    </span>
                                                </span>
                                                <span className="reception-stat">
                                                    <span className="reception-stat-label">
                                                        Attendu
                                                    </span>
                                                    <span className="reception-stat-value">
                                                        {totalAttendu(
                                                            reception,
                                                        )}
                                                    </span>
                                                </span>
                                                {hasEcart(reception) && (
                                                    <span className="reception-stat reception-stat--warning">
                                                        <AlertTriangle
                                                            size={12}
                                                        />
                                                        Écart constaté
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="reception-actions">
                                            <div className="reception-status confirmed">
                                                <CheckCircle
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                                Confirmée
                                            </div>
                                            {(hasRole('RESP_BOUTIQUE') ||
                                                hasRole('EMPLOYE_VENTE') ||
                                                hasRole('ADMIN')) && (
                                                <button
                                                    onClick={() =>
                                                        router.visit(
                                                            returns.create({
                                                                query: {
                                                                    reception_id:
                                                                        reception.id,
                                                                },
                                                            }),
                                                        )
                                                    }
                                                    className="btn-primary-sm"
                                                    title="Créer un retour pour cette réception"
                                                >
                                                    <AlertTriangle
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                    Retour
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="reception-details">
                                        <table className="details-table">
                                            <thead>
                                                <tr>
                                                    <th>Produit</th>
                                                    <th className="text-right">
                                                        Attendu
                                                    </th>
                                                    <th className="text-right">
                                                        Reçu
                                                    </th>
                                                    <th className="text-right">
                                                        DLC
                                                    </th>
                                                    <th className="text-right">
                                                        Écart
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reception.lines.map((line) => {
                                                    const dlcDate =
                                                        calculateDLC(
                                                            reception.expedition
                                                                .date,
                                                            line.product?.dlc ??
                                                                null,
                                                        );
                                                    return (
                                                        <tr key={line.id}>
                                                            <td className="product-name">
                                                                {
                                                                    line.product
                                                                        .nom
                                                                }
                                                            </td>
                                                            <td className="text-right">
                                                                {
                                                                    line.qte_attendue
                                                                }
                                                            </td>
                                                            <td
                                                                className={`text-right ${ecartColor(line.qte_attendue, line.qte_recue)}`}
                                                            >
                                                                {line.qte_recue ??
                                                                    '—'}
                                                            </td>
                                                            <td className="text-right">
                                                                <span
                                                                    className={`tag ${
                                                                        line
                                                                            .product
                                                                            ?.dlc
                                                                            ? 'tag-success'
                                                                            : 'tag-muted'
                                                                    }`}
                                                                >
                                                                    {dlcDate}
                                                                </span>
                                                            </td>
                                                            <td
                                                                className={`text-right font-semibold ${ecartColor(line.qte_attendue, line.qte_recue)}`}
                                                            >
                                                                {ecartValue(
                                                                    line.qte_attendue,
                                                                    line.qte_recue,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── MODAL CONFIRMATION RÉCEPTION ── */}
            {confirmModalOpen && selectedReception && (
                <div
                    className="modal-overlay"
                    onClick={() => setConfirmModalOpen(false)}
                >
                    <div
                        className="modal modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Confirmer la réception
                                </h3>
                                <p className="modal-subtitle">
                                    {selectedReception.expedition.entity.nom} -{' '}
                                    {new Date(
                                        selectedReception.date,
                                    ).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <button
                                onClick={() => setConfirmModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-message">
                                Saisissez les quantités réellement reçues pour
                                chaque produit :
                            </p>
                            <div className="reception-lines-edit">
                                {selectedReception.lines.map((line: any) => {
                                    const dlcDate = calculateDLC(
                                        selectedReception.expedition.date,
                                        line.product?.dlc ?? null,
                                    );
                                    return (
                                        <div
                                            key={line.id}
                                            className="reception-line-edit"
                                        >
                                            <div className="reception-line-info">
                                                <span className="reception-line-name">
                                                    {line.product.nom}
                                                </span>
                                                <span className="reception-line-attendu">
                                                    Attendu: {line.qte_attendue}
                                                </span>
                                                {line.product?.dlc && (
                                                    <span className="reception-line-dlc">
                                                        DLC: {dlcDate}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="reception-line-input-group">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={
                                                        qtesRecues[line.id] ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setQtesRecues({
                                                            ...qtesRecues,
                                                            [line.id]: Number(
                                                                e.target.value,
                                                            ),
                                                        })
                                                    }
                                                    className="reception-line-input"
                                                />
                                                <span
                                                    className={`reception-ecart ${ecartColor(line.qte_attendue, qtesRecues[line.id])}`}
                                                >
                                                    {qtesRecues[line.id] !==
                                                    undefined
                                                        ? ecartValue(
                                                              line.qte_attendue,
                                                              qtesRecues[
                                                                  line.id
                                                              ],
                                                          )
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setConfirmModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={confirmForm.processing}
                                className="btn-primary"
                            >
                                {confirmForm.processing ? (
                                    <span className="spinner" />
                                ) : (
                                    <CheckCircle size={16} strokeWidth={1.5} />
                                )}
                                Confirmer la réception
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .receptions-page { display: flex; flex-direction: column; gap: 1.5rem; }

                /* Header */
                .page-header { margin-bottom: 0.25rem; }
                .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.25rem; }
                .page-subtitle { font-size: 0.8rem; color: var(--text-3); }

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
                    transition: all 0.25s ease;
                }
                .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
                .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-icon--orange { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .stat-icon--success { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .stat-icon--warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .stat-content { flex: 1; }
                .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--orange); line-height: 1.2; }
                .stat-value--success { color: var(--success); }
                .stat-value--warning { color: #f59e0b; }

                /* Section */
                .section { margin-bottom: 0.5rem; }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid var(--border);
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .section-dot { width: 10px; height: 10px; border-radius: 50%; }
                .section-dot--warning { background: #f59e0b; }
                .section-dot--success { background: var(--success); }
                .section-badge {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                }

                /* Cards List */
                /* Search input */
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 260px; }

                .cards-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .reception-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .reception-card:hover { box-shadow: var(--shadow-sm); }
                .reception-card.pending { border-left: 4px solid #f59e0b; }
                .reception-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    background: #f59e0b14;
                    border-bottom: 1px solid var(--border);
                }
                .reception-info { flex: 1; }
                .reception-title-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .reception-entity { font-weight: 700; color: var(--text-1); }
                .reception-date {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.85rem;
                    color: var(--text-3);
                }
                .reception-stats { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
                .reception-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.75rem;
                }
                .reception-stat-label { color: var(--text-3); }
                .reception-stat-value { font-weight: 600; color: var(--text-1); }
                .reception-stat-value--success { color: var(--success); }
                .reception-stat--warning { color: #f59e0b; }
                .reception-status {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.3rem 0.7rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .reception-status.confirmed {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }

                /* Preview */
                .reception-preview { padding: 1rem 1.25rem; }
                .preview-products { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
                .preview-product {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.2rem 0.6rem;
                    background: var(--bg-card-2);
                    border-radius: 20px;
                    font-size: 0.75rem;
                }
                .preview-name { color: var(--text-2); }
                .preview-qty { font-weight: 600; color: var(--text-1); }
                .preview-dlc {
                    font-size: 0.65rem;
                    color: var(--success);
                    background: rgba(30, 158, 106, 0.1);
                    padding: 0.15rem 0.4rem;
                    border-radius: 20px;
                    margin-left: 0.3rem;
                }
                .preview-more { font-size: 0.7rem; color: var(--text-3); }

                /* Details */
                .reception-details { padding: 1rem 1.25rem; border-top: 1px solid var(--border); }
                .details-table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
                .details-table th {
                    text-align: left;
                    padding: 0.5rem;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    border-bottom: 2px solid var(--border);
                }
                .details-table th.text-right { text-align: right; }
                .details-table td {
                    padding: 0.5rem;
                    border-bottom: 1px solid var(--border);
                }
                .details-table tr:last-child td { border-bottom: none; }
                .product-name { font-weight: 500; color: var(--text-1); }
                .text-right { text-align: right; }
                .text-success { color: var(--success); font-weight: 600; }
                .text-danger { color: var(--danger); font-weight: 600; }
                .text-warning { color: #f59e0b; font-weight: 600; }
                .text-muted { color: var(--text-3); }

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
                    max-width: 600px;
                    width: 100%;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .modal-lg { max-width: 680px; }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .modal-title { font-size: 1.2rem; font-weight: 700; color: var(--text-1); }
                .modal-subtitle { font-size: 0.8rem; color: var(--text-3); margin-top: 4px; }
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
                .modal-close:hover { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
                .modal-body { padding: 1.5rem; }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-message { font-size: 0.9rem; color: var(--text-2); margin-bottom: 1rem; }

                /* Reception lines edit */
                .reception-lines-edit {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .reception-line-edit {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background: var(--bg-card-2);
                    border-radius: 12px;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .reception-line-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .reception-line-name { font-weight: 600; color: var(--text-1); }
                .reception-line-attendu { font-size: 0.75rem; color: var(--text-3); }
                .reception-line-dlc {
                    font-size: 0.75rem;
                    color: var(--success);
                    background: rgba(30, 158, 106, 0.1);
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }
                .reception-line-input-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .reception-line-input {
                    width: 90px;
                    padding: 0.5rem 0.6rem;
                    font-size: 0.85rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    text-align: center;
                }
                .reception-line-input:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .reception-ecart {
                    min-width: 50px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-align: center;
                }

                /* Empty State */
                .empty-state-card {
                    background: var(--bg-card-2);
                    border-radius: 14px;
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-3);
                }
                .empty-state-text { margin-top: 1rem; font-size: 0.9rem; }

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
                    transition: all 0.25s ease;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35); }
                .btn-primary-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.9rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary-sm:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(232, 116, 42, 0.3); }
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
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-neutral:hover { background: var(--bg-card-2); }

                /* Spinner */
                .spinner {
                    width: 16px;
                    height: 16px;
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
        </div>
    );
}
