import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import {
    AlertTriangle,
    CheckCircle,
    Plus,
    X,
    AlertCircle,
    Clock,
    CheckSquare,
    MessageSquare,
    Users,
    Filter,
    Search,
} from 'lucide-react';
import type { HaccpNonConformite } from '@/types';

interface NonConformitesIndexProps {
    ncs: (HaccpNonConformite & { creator?: { nom: string } | null })[];
}

export default function NonConformitesIndex({ ncs }: NonConformitesIndexProps) {
    const { user, hasRole } = useAuth();
    const [filter, setFilter] = useState<'ALL' | 'OUVERTE' | 'RESOLUE'>('ALL');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [selectedNC, setSelectedNC] = useState<HaccpNonConformite | null>(
        null,
    );

    const form = useForm({
        type: '',
        description: '',
    });

    const resolveForm = useForm({ action: '' });

    const filteredNcs = ncs.filter(
        (nc) => filter === 'ALL' || nc.statut === filter,
    );

    // ── Search ──
    const [search, setSearch] = useState('');
    const searchFiltered = useMemo(() =>
        !search
            ? filteredNcs
            : filteredNcs.filter(
                  (nc) =>
                      nc.type.toLowerCase().includes(search.toLowerCase()) ||
                      nc.description.toLowerCase().includes(search.toLowerCase()),
              ),
    [filteredNcs, search]);

    const stats = {
        total: ncs.length,
        ouvertes: ncs.filter((nc) => nc.statut === 'OUVERTE').length,
        resolues: ncs.filter((nc) => nc.statut === 'RESOLUE').length,
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/nonconformites', {
            onSuccess: () => {
                setCreateModalOpen(false);
                form.reset();
            },
        });
    };

    const openResolveModal = (nc: HaccpNonConformite) => {
        setSelectedNC(nc);
        resolveForm.setData('action', nc.action || '');
        setResolveModalOpen(true);
    };

    const submitResolve = () => {
        if (!selectedNC) return;
        router.put(
            `/nonconformites/${selectedNC.id}`,
            {
                ...resolveForm.data,
                statut: 'RESOLUE',
            },
            {
                onSuccess: () => {
                    setResolveModalOpen(false);
                    setSelectedNC(null);
                    resolveForm.reset();
                },
            },
        );
    };

    return (
        <div className="nc-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Non-conformités HACCP</h1>
                    <p className="page-subtitle">
                        Gestion des anomalies et actions correctives
                    </p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={16} strokeWidth={1.5} />
                    <span>Signaler une NC</span>
                </button>
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <AlertTriangle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--danger">
                        <Clock size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Ouvertes</div>
                        <div className="stat-value stat-value--danger">
                            {stats.ouvertes}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <CheckCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Résolues</div>
                        <div className="stat-value stat-value--success">
                            {stats.resolues}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <CheckSquare size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Taux résolution</div>
                        <div className="stat-value">
                            {stats.total > 0
                                ? Math.round(
                                      (stats.resolues / stats.total) * 100,
                                  )
                                : 0}
                            %
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FILTRES ── */}
            <div className="filters-section">
                <div className="filters-header">
                    <Filter size={14} strokeWidth={1.5} />
                    <span>Filtrer par statut</span>
                </div>
                <div className="filters-buttons">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                    >
                        Toutes ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter('OUVERTE')}
                        className={`filter-btn filter-btn--danger ${filter === 'OUVERTE' ? 'active' : ''}`}
                    >
                        Ouvertes ({stats.ouvertes})
                    </button>
                    <button
                        onClick={() => setFilter('RESOLUE')}
                        className={`filter-btn filter-btn--success ${filter === 'RESOLUE' ? 'active' : ''}`}
                    >
                        Résolues ({stats.resolues})
                    </button>
                </div>
                <div className="search-wrap" style={{ marginTop: '0.75rem' }}>
                    <Search size={14} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher une NC..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="finput finput--search"
                    />
                </div>
            </div>

            {/* ── LISTE DES NON-CONFORMITÉS ── */}
            {searchFiltered.length === 0 ? (
                <div className="empty-state-card">
                    <CheckCircle size={48} strokeWidth={1} />
                    <div className="empty-state-text">
                        {search
                            ? 'Aucune non-conformité trouvée'
                            : filter === 'ALL'
                                ? 'Aucune non-conformité enregistrée'
                                : filter === 'OUVERTE'
                                  ? 'Aucune non-conformité ouverte'
                                  : 'Aucune non-conformité résolue'}
                    </div>
                    <div className="empty-state-subtext">
                        {filter === 'ALL' && !search &&
                            'Cliquez sur "Signaler une NC" pour en créer une'}
                    </div>
                </div>
            ) : (
                <div className="nc-list">
                    {searchFiltered.map((nc) => (
                        <div
                            key={nc.id}
                            className={`nc-card ${nc.statut === 'OUVERTE' ? 'open' : 'resolved'}`}
                        >
                            <div className="nc-card-header">
                                <div className="nc-header-left">
                                    <div className="nc-type-badge">
                                        <AlertTriangle
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        <span>{nc.type}</span>
                                    </div>
                                    <div
                                        className={`nc-status ${nc.statut === 'OUVERTE' ? 'status-open' : 'status-resolved'}`}
                                    >
                                        {nc.statut === 'OUVERTE' ? (
                                            <>
                                                <Clock
                                                    size={12}
                                                    strokeWidth={1.5}
                                                />
                                                Ouverte
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle
                                                    size={12}
                                                    strokeWidth={1.5}
                                                />
                                                Résolue
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="nc-date">
                                    {new Date(nc.date).toLocaleDateString(
                                        'fr-FR',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        },
                                    )}
                                </div>
                            </div>

                            <div className="nc-card-body">
                                <p className="nc-description">
                                    {nc.description}
                                </p>
                                <div className="nc-meta">
                                    <Users size={12} strokeWidth={1.5} />
                                    <span>
                                        Saisi par : {nc.creator?.nom || '-'}
                                    </span>
                                </div>
                            </div>

                            {nc.action && (
                                <div className="nc-action">
                                    <div className="nc-action-header">
                                        <CheckSquare
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        <span>Action corrective</span>
                                    </div>
                                    <p className="nc-action-text">
                                        {nc.action}
                                    </p>
                                </div>
                            )}

                            {nc.statut === 'OUVERTE' &&
                                hasRole(
                                    'ADMIN',
                                    'RESP_LABO',
                                    'RESP_BOUTIQUE',
                                ) && (
                                    <div className="nc-card-footer">
                                        <button
                                            onClick={() => openResolveModal(nc)}
                                            className="btn-success"
                                        >
                                            <CheckCircle
                                                size={14}
                                                strokeWidth={1.5}
                                            />
                                            Marquer comme résolue
                                        </button>
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL CRÉATION ── */}
            {createModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setCreateModalOpen(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Signaler une non-conformité
                                </h3>
                                <p className="modal-subtitle">
                                    Décrivez l'anomalie constatée
                                </p>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={submitCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">
                                        Type{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <select
                                        value={form.data.type}
                                        onChange={(e) =>
                                            form.setData('type', e.target.value)
                                        }
                                        className="form-select"
                                        required
                                    >
                                        <option value="">
                                            Sélectionner un type...
                                        </option>
                                        <option value="TEMPERATURE">
                                            Température
                                        </option>
                                        <option value="HYGIENE">Hygiène</option>
                                        <option value="TRACEABILITE">
                                            Traçabilité
                                        </option>
                                        <option value="ETIQUETAGE">
                                            Étiquetage
                                        </option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Description{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <textarea
                                        value={form.data.description}
                                        onChange={(e) =>
                                            form.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="form-textarea"
                                        rows={4}
                                        placeholder="Description détaillée de la non-conformité..."
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="btn-neutral"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="btn-primary"
                                >
                                    {form.processing ? (
                                        <span className="spinner" />
                                    ) : (
                                        <Plus size={16} strokeWidth={1.5} />
                                    )}
                                    {form.processing
                                        ? 'Création...'
                                        : 'Créer la NC'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL RÉSOLUTION ── */}
            {resolveModalOpen && selectedNC && (
                <div
                    className="modal-overlay"
                    onClick={() => setResolveModalOpen(false)}
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
                                onClick={() => setResolveModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <h3 className="modal-title-success text-center">
                                Résoudre la non-conformité
                            </h3>
                            <p className="modal-message text-center">
                                Non-conformité :{' '}
                                <strong>{selectedNC.type}</strong>
                            </p>
                            <div className="nc-preview">
                                <p className="nc-preview-label">Description</p>
                                <p className="nc-preview-text">
                                    {selectedNC.description}
                                </p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Action corrective{' '}
                                    <span className="text-orange">*</span>
                                </label>
                                <textarea
                                    value={resolveForm.data.action}
                                    onChange={(e) =>
                                        resolveForm.setData(
                                            'action',
                                            e.target.value,
                                        )
                                    }
                                    className="form-textarea"
                                    rows={4}
                                    placeholder="Décrivez l'action corrective mise en place..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-footer-success">
                            <button
                                onClick={() => setResolveModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitResolve}
                                disabled={resolveForm.processing}
                                className="btn-success"
                            >
                                {resolveForm.processing ? (
                                    <span className="spinner-white" />
                                ) : (
                                    <CheckCircle size={16} strokeWidth={1.5} />
                                )}
                                {resolveForm.processing
                                    ? 'Traitement...'
                                    : 'Marquer comme résolue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .nc-page {
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

                /* Filters */
                .filters-section {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .filters-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-3);
                }
                .filters-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .filter-btn {
                    padding: 0.35rem 1rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    color: var(--text-2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .filter-btn:hover {
                    background: var(--bg-card);
                }
                .filter-btn.active {
                    background: var(--orange);
                    border-color: var(--orange);
                    color: white;
                }
                .filter-btn--danger.active {
                    background: var(--danger);
                    border-color: var(--danger);
                }
                .filter-btn--success.active {
                    background: var(--success);
                    border-color: var(--success);
                }

                /* NC List */
                .nc-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .nc-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .nc-card:hover {
                    box-shadow: var(--shadow-sm);
                }
                .nc-card.open {
                    border-left: 4px solid var(--orange);
                }
                .nc-card.resolved {
                    border-left: 4px solid var(--success);
                    opacity: 0.85;
                }
                .nc-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    background: var(--bg-card-2);
                    border-bottom: 1px solid var(--border);
                }
                .nc-header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .nc-type-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.25rem 0.7rem;
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .nc-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.65rem;
                    font-weight: 600;
                }
                .status-open {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .status-resolved {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .nc-date {
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .nc-card-body {
                    padding: 1rem 1.25rem;
                }
                .nc-description {
                    font-size: 0.9rem;
                    color: var(--text-2);
                    line-height: 1.5;
                    margin-bottom: 0.75rem;
                }
                .nc-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .nc-action {
                    margin: 0 1.25rem 1rem 1.25rem;
                    padding: 0.75rem;
                    background: rgba(30, 158, 106, 0.05);
                    border: 1px solid rgba(30, 158, 106, 0.15);
                    border-radius: 10px;
                }
                .nc-action-header {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: var(--success);
                    margin-bottom: 0.5rem;
                }
                .nc-action-text {
                    font-size: 0.85rem;
                    color: var(--text-2);
                }
                .nc-card-footer {
                    padding: 0.75rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
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
                    font-weight: 600;
                }
                .empty-state-subtext {
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                }

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
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                }
                .btn-success {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, var(--success), #2db87a);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-success:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(30, 158, 106, 0.3);
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
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
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
                .modal-success {
                    max-width: 560px;
                    border: 1px solid rgba(30, 158, 106, 0.2);
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
                .modal-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .modal-title-success {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--success);
                    margin-bottom: 0.5rem;
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
                .modal-footer-success {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-message {
                    font-size: 0.9rem;
                    color: var(--text-2);
                    margin-bottom: 1rem;
                }
                .text-center {
                    text-align: center;
                }
                .text-orange {
                    color: var(--orange);
                }

                /* Search input */
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 260px; }

                /* NC Preview */
                .nc-preview {
                    background: var(--bg-card-2);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }
                .nc-preview-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 0.5rem;
                }
                .nc-preview-text {
                    font-size: 0.85rem;
                    color: var(--text-2);
                    line-height: 1.4;
                }

                /* Form */
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
                .form-select, .form-textarea {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    transition: all 0.2s;
                    width: 100%;
                }
                .form-select:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }

                /* Spinners */
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                .spinner-white {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
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
