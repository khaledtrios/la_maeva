import { router, useForm } from '@inertiajs/react';
import {
    Search,
    Check,
    X,
    Store as StoreEmptyIcon,
    MapPin,
    Power,
    Ban,
    RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FlashMessage } from '@/Components/UI/FlashMessage';
import { logout } from '@/routes/superadmin';
import { approve, reject, suspend, reactivate } from '@/routes/superadmin/stores';
import type { Store, StoreStatus } from '@/types/store';

interface SuperAdminStoresIndexProps {
    stores: Store[];
}

const TABS: { key: StoreStatus; label: string }[] = [
    { key: 'PENDING', label: 'En attente' },
    { key: 'ACTIVE', label: 'Actives' },
    { key: 'SUSPENDED', label: 'Suspendues' },
    { key: 'REJECTED', label: 'Refusées' },
];

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export default function SuperAdminStoresIndex({
    stores: initialStores,
}: SuperAdminStoresIndexProps) {
    const [stores, setStores] = useState(initialStores);
    const [activeTab, setActiveTab] = useState<StoreStatus>('PENDING');
    const [search, setSearch] = useState('');
    const [rejectTarget, setRejectTarget] = useState<Store | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<Store | null>(null);

    const rejectForm = useForm({ reason: '' });
    const suspendForm = useForm({ reason: '' });

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(logout.url());
    };

    const counts = useMemo(
        () => ({
            PENDING: stores.filter((s) => s.status === 'PENDING').length,
            ACTIVE: stores.filter((s) => s.status === 'ACTIVE').length,
            SUSPENDED: stores.filter((s) => s.status === 'SUSPENDED').length,
            REJECTED: stores.filter((s) => s.status === 'REJECTED').length,
        }),
        [stores],
    );

    const filteredStores = useMemo(() => {
        const q = search.trim().toLowerCase();

        return stores
            .filter((s) => s.status === activeTab)
            .filter((s) => {
                if (!q) {
                    return true;
                }

                return (
                    s.name.toLowerCase().includes(q) ||
                    Boolean(s.owner?.name.toLowerCase().includes(q)) ||
                    Boolean(s.owner?.email.toLowerCase().includes(q)) ||
                    Boolean(s.city?.toLowerCase().includes(q))
                );
            });
    }, [stores, search, activeTab]);

    const handleApprove = (store: Store) => {
        router.post(
            approve.url(store.id),
            {},
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    if (page.props.stores) {
                        setStores(page.props.stores);
                    }
                },
            },
        );
    };

    const handleReactivate = (store: Store) => {
        router.post(
            reactivate.url(store.id),
            {},
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    if (page.props.stores) {
                        setStores(page.props.stores);
                    }
                },
            },
        );
    };

    const openRejectModal = (store: Store) => {
        rejectForm.reset('reason');
        rejectForm.clearErrors();
        setRejectTarget(store);
    };

    const submitReject = () => {
        if (!rejectTarget) {
            return;
        }

        rejectForm.post(reject.url(rejectTarget.id), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                if (page.props.stores) {
                    setStores(page.props.stores);
                }

                setRejectTarget(null);
            },
        });
    };

    const openSuspendModal = (store: Store) => {
        suspendForm.reset('reason');
        suspendForm.clearErrors();
        setSuspendTarget(store);
    };

    const submitSuspend = () => {
        if (!suspendTarget) {
            return;
        }

        suspendForm.post(suspend.url(suspendTarget.id), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                if (page.props.stores) {
                    setStores(page.props.stores);
                }

                setSuspendTarget(null);
            },
        });
    };

    return (
        <div className="superadmin-scene">
            <FlashMessage />

            <header className="superadmin-header">
                <span className="superadmin-brand">
                    LE <em>MAEVA</em>{' '}
                    <span className="superadmin-brand-sep">·</span> Super Admin
                </span>
                <form
                    method="post"
                    action={logout.url()}
                    onSubmit={handleLogout}
                >
                    <button type="submit" className="superadmin-logout">
                        <Power size={18} strokeWidth={1.5} />
                        <span>Déconnexion</span>
                    </button>
                </form>
            </header>

            <main className="superadmin-main">
                <div className="stores-admin-page">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Boutiques</h1>
                            <p className="page-subtitle">
                                Validation des demandes d'inscription boutique
                            </p>
                        </div>
                    </div>

                    <div className="tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                                <span className="tab-count">
                                    {counts[tab.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="table-card">
                        <div className="table-header">
                            <div className="table-title">
                                <div className="table-dot" />
                                <span>
                                    {TABS.find((t) => t.key === activeTab)
                                        ?.label}
                                </span>
                            </div>
                            <div className="search-wrap">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    className="finput-search"
                                />
                            </div>
                        </div>

                        {filteredStores.length === 0 ? (
                            <div className="empty-state-card">
                                <StoreEmptyIcon size={48} strokeWidth={1} />
                                <div className="empty-state-text">
                                    Aucune boutique dans cette catégorie
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Mobile cards */}
                                <div className="mobile-list">
                                    {filteredStores.map((store) => (
                                        <div
                                            key={store.id}
                                            className="mobile-row"
                                        >
                                            <div className="mobile-row-top">
                                                <span className="mobile-name">
                                                    {store.name}
                                                </span>
                                                <span
                                                    className="status-pill"
                                                    style={{
                                                        background: `${store.status_color}18`,
                                                        color: store.status_color,
                                                    }}
                                                >
                                                    {store.status_label}
                                                </span>
                                            </div>
                                            <div className="mobile-row-meta">
                                                <span className="meta-text">
                                                    {store.owner?.name ?? '—'}
                                                    {store.owner?.email
                                                        ? ` · ${store.owner.email}`
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className="mobile-row-meta">
                                                <span className="meta-text">
                                                    <MapPin
                                                        size={12}
                                                        style={{
                                                            display: 'inline',
                                                            marginRight: 4,
                                                            verticalAlign:
                                                                '-2px',
                                                        }}
                                                    />
                                                    {store.city ??
                                                        'Ville non renseignée'}{' '}
                                                    — Envoyée le{' '}
                                                    {formatDate(
                                                        store.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            {store.status === 'ACTIVE' && (
                                                <div className="mobile-row-meta">
                                                    <span className="meta-text">
                                                        Validée le{' '}
                                                        {formatDate(
                                                            store.status_changed_at,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {store.status === 'SUSPENDED' && (
                                                <div className="mobile-row-meta">
                                                    <span className="meta-text">
                                                        Suspendue le{' '}
                                                        {formatDate(
                                                            store.status_changed_at,
                                                        )}
                                                        {store.status_reason
                                                            ? ` — ${store.status_reason}`
                                                            : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {store.status === 'REJECTED' && (
                                                <div className="mobile-row-meta">
                                                    <span className="meta-text">
                                                        Refusée le{' '}
                                                        {formatDate(
                                                            store.status_changed_at,
                                                        )}
                                                        {store.status_reason
                                                            ? ` — ${store.status_reason}`
                                                            : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {store.status === 'PENDING' && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="btn-approve"
                                                        onClick={() =>
                                                            handleApprove(
                                                                store,
                                                            )
                                                        }
                                                    >
                                                        <Check
                                                            size={14}
                                                            strokeWidth={1.5}
                                                        />
                                                        <span>Valider</span>
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() =>
                                                            openRejectModal(
                                                                store,
                                                            )
                                                        }
                                                    >
                                                        <X
                                                            size={14}
                                                            strokeWidth={1.5}
                                                        />
                                                        <span>Refuser</span>
                                                    </button>
                                                </div>
                                            )}
                                            {store.status === 'ACTIVE' && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="btn-suspend"
                                                        onClick={() =>
                                                            openSuspendModal(
                                                                store,
                                                            )
                                                        }
                                                    >
                                                        <Ban
                                                            size={14}
                                                            strokeWidth={1.5}
                                                        />
                                                        <span>Suspendre</span>
                                                    </button>
                                                </div>
                                            )}
                                            {store.status === 'SUSPENDED' && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="btn-approve"
                                                        onClick={() =>
                                                            handleReactivate(
                                                                store,
                                                            )
                                                        }
                                                    >
                                                        <RotateCcw
                                                            size={14}
                                                            strokeWidth={1.5}
                                                        />
                                                        <span>Réactiver</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop table */}
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Boutique</th>
                                                <th>Propriétaire</th>
                                                <th>Ville</th>
                                                <th>Soumise le</th>
                                                <th>Statut</th>
                                                <th className="text-right">
                                                    Actions / détails
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStores.map((store) => (
                                                <tr key={store.id}>
                                                    <td>
                                                        <span className="store-name">
                                                            {store.name}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="owner-cell">
                                                            <span className="owner-name">
                                                                {store.owner
                                                                    ?.name ??
                                                                    '—'}
                                                            </span>
                                                            <span className="owner-email">
                                                                {store.owner
                                                                    ?.email ??
                                                                    ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="text-muted">
                                                        {store.city ?? '—'}
                                                    </td>
                                                    <td className="text-muted">
                                                        {formatDate(
                                                            store.created_at,
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="status-pill"
                                                            style={{
                                                                background: `${store.status_color}18`,
                                                                color: store.status_color,
                                                            }}
                                                        >
                                                            {
                                                                store.status_label
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        {store.status ===
                                                            'PENDING' && (
                                                            <div className="table-actions">
                                                                <button
                                                                    className="btn-approve"
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            store,
                                                                        )
                                                                    }
                                                                >
                                                                    <Check
                                                                        size={
                                                                            14
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                    Valider
                                                                </button>
                                                                <button
                                                                    className="btn-reject"
                                                                    onClick={() =>
                                                                        openRejectModal(
                                                                            store,
                                                                        )
                                                                    }
                                                                >
                                                                    <X
                                                                        size={
                                                                            14
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                    Refuser
                                                                </button>
                                                            </div>
                                                        )}
                                                        {store.status ===
                                                            'ACTIVE' && (
                                                            <div className="table-actions">
                                                                <span className="detail-text">
                                                                    Validée le{' '}
                                                                    {formatDate(
                                                                        store.status_changed_at,
                                                                    )}
                                                                </span>
                                                                <button
                                                                    className="btn-suspend"
                                                                    onClick={() =>
                                                                        openSuspendModal(
                                                                            store,
                                                                        )
                                                                    }
                                                                >
                                                                    <Ban
                                                                        size={
                                                                            14
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                    Suspendre
                                                                </button>
                                                            </div>
                                                        )}
                                                        {store.status ===
                                                            'SUSPENDED' && (
                                                            <div className="table-actions">
                                                                <span className="detail-text detail-text--danger">
                                                                    {formatDate(
                                                                        store.status_changed_at,
                                                                    )}
                                                                    {store.status_reason
                                                                        ? ` — ${store.status_reason}`
                                                                        : ''}
                                                                </span>
                                                                <button
                                                                    className="btn-approve"
                                                                    onClick={() =>
                                                                        handleReactivate(
                                                                            store,
                                                                        )
                                                                    }
                                                                >
                                                                    <RotateCcw
                                                                        size={
                                                                            14
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                    Réactiver
                                                                </button>
                                                            </div>
                                                        )}
                                                        {store.status ===
                                                            'REJECTED' && (
                                                            <span className="detail-text detail-text--danger">
                                                                {formatDate(
                                                                    store.status_changed_at,
                                                                )}
                                                                {store.status_reason
                                                                    ? ` — ${store.status_reason}`
                                                                    : ''}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* ── MODAL REFUS ── */}
            {rejectTarget && (
                <div
                    className="modal-overlay"
                    onClick={() => setRejectTarget(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Refuser la demande
                                </h3>
                                <p className="modal-subtitle">
                                    Boutique « {rejectTarget.name} »
                                </p>
                            </div>
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">
                                    Motif du refus
                                    <span className="form-optional">
                                        {' '}
                                        (facultatif)
                                    </span>
                                </label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={rejectForm.data.reason}
                                    onChange={(e) =>
                                        rejectForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Expliquez brièvement la raison du refus…"
                                />
                                {rejectForm.errors.reason && (
                                    <div className="form-error">
                                        {rejectForm.errors.reason}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={rejectForm.processing}
                                className="btn-danger-solid"
                            >
                                {rejectForm.processing
                                    ? 'Refus en cours…'
                                    : 'Confirmer le refus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL SUSPENSION ── */}
            {suspendTarget && (
                <div
                    className="modal-overlay"
                    onClick={() => setSuspendTarget(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Suspendre la boutique
                                </h3>
                                <p className="modal-subtitle">
                                    Boutique « {suspendTarget.name} »
                                </p>
                            </div>
                            <button
                                onClick={() => setSuspendTarget(null)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">
                                    Motif de la suspension
                                    <span className="form-optional">
                                        {' '}
                                        (facultatif)
                                    </span>
                                </label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={suspendForm.data.reason}
                                    onChange={(e) =>
                                        suspendForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Expliquez brièvement la raison de la suspension…"
                                />
                                {suspendForm.errors.reason && (
                                    <div className="form-error">
                                        {suspendForm.errors.reason}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setSuspendTarget(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitSuspend}
                                disabled={suspendForm.processing}
                                className="btn-danger-solid"
                            >
                                {suspendForm.processing
                                    ? 'Suspension en cours…'
                                    : 'Confirmer la suspension'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .superadmin-scene {
                    min-height: 100vh;
                    background: var(--bg-page);
                }
                .superadmin-header {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: var(--header-h);
                    padding: 0 1.25rem;
                    background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-2) 100%);
                    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.28);
                }
                .superadmin-brand {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 700;
                    font-size: 1.3rem;
                    letter-spacing: 0.06em;
                    color: #fff;
                }
                .superadmin-brand em {
                    font-style: normal;
                    font-weight: 800;
                    color: #f5924a;
                }
                .superadmin-brand-sep {
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 400;
                }
                .superadmin-logout {
                    display: flex;
                    align-items: center;
                    gap: 0.45rem;
                    background: rgba(232, 116, 42, 0.18);
                    border: 1px solid rgba(232, 116, 42, 0.4);
                    padding: 0.4rem 0.9rem;
                    border-radius: 40px;
                    font-weight: 500;
                    font-size: 0.8rem;
                    color: #f5924a;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .superadmin-logout:hover {
                    background: var(--orange);
                    border-color: var(--orange);
                    color: white;
                    transform: translateY(-1px);
                }
                .superadmin-main {
                    padding: 1.5rem 1.25rem 3rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .stores-admin-page { display: flex; flex-direction: column; gap: 1.5rem; }

                .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
                .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.25rem; }
                .page-subtitle { font-size: 0.8rem; color: var(--text-3); }

                /* Tabs */
                .tabs {
                    display: flex;
                    gap: 4px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 4px;
                    width: fit-content;
                    flex-wrap: wrap;
                }
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-3);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tab-btn:hover { color: var(--text-1); }
                .tab-btn.active { background: var(--bg-card); color: var(--orange); box-shadow: var(--shadow-sm); }
                .tab-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 20px;
                    height: 20px;
                    padding: 0 6px;
                    border-radius: 999px;
                    background: var(--bg-card-2);
                    color: var(--text-2);
                    font-size: 0.68rem;
                    font-weight: 700;
                }
                .tab-btn.active .tab-count { background: rgba(232, 116, 42, 0.15); color: var(--orange); }

                /* Table card */
                .table-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); overflow: hidden; }
                .table-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
                .table-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-2); }
                .table-dot { width: 8px; height: 8px; background: var(--orange); border-radius: 50%; }
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput-search {
                    padding: 0.5rem 0.75rem 0.5rem 32px;
                    width: 100%;
                    max-width: 240px;
                    font-size: 0.85rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                }

                /* Mobile list */
                .mobile-list { display: flex; flex-direction: column; }
                .mobile-row { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
                .mobile-row:hover { background: var(--bg-card-2); }
                .mobile-row-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; gap: 0.5rem; }
                .mobile-name { font-weight: 600; font-size: 0.9rem; color: var(--text-1); }
                .mobile-row-meta { margin-bottom: 0.3rem; }
                .meta-text { font-size: 0.75rem; color: var(--text-3); }
                .mobile-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }

                /* Desktop table */
                .table-wrapper { display: none; overflow-x: auto; }
                @media (min-width: 768px) {
                    .mobile-list { display: none; }
                    .table-wrapper { display: block; }
                }
                .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .data-table thead tr { border-bottom: 2px solid var(--border); }
                .data-table th { padding: 0.85rem 1rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); text-align: left; white-space: nowrap; }
                .data-table th.text-right { text-align: right; }
                .data-table tbody tr { border-bottom: 1px solid var(--border); }
                .data-table tbody tr:hover { background: var(--bg-card-2); }
                .data-table td { padding: 0.85rem 1rem; vertical-align: top; }
                .data-table td.text-right { text-align: right; }
                .store-name { font-weight: 600; color: var(--text-1); }
                .text-muted { color: var(--text-3); }
                .owner-cell { display: flex; flex-direction: column; gap: 2px; }
                .owner-name { font-weight: 500; color: var(--text-1); font-size: 0.85rem; }
                .owner-email { font-size: 0.72rem; color: var(--text-3); }
                .detail-text { font-size: 0.78rem; color: var(--text-3); }
                .detail-text--danger { color: var(--danger); }

                /* Status pill (colors sourced from backend status_color) */
                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.2rem 0.65rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                /* Action buttons */
                .table-actions { display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
                .btn-approve, .btn-reject, .btn-suspend {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .btn-approve { background: rgba(30, 158, 106, 0.1); color: var(--success); border: 1px solid rgba(30, 158, 106, 0.3); }
                .btn-approve:hover { background: rgba(30, 158, 106, 0.18); transform: translateY(-1px); }
                .btn-reject { background: rgba(214, 59, 59, 0.1); color: var(--danger); border: 1px solid rgba(214, 59, 59, 0.3); }
                .btn-reject:hover { background: rgba(214, 59, 59, 0.18); transform: translateY(-1px); }
                .btn-suspend { background: rgba(232, 116, 42, 0.1); color: var(--orange); border: 1px solid rgba(232, 116, 42, 0.3); }
                .btn-suspend:hover { background: rgba(232, 116, 42, 0.18); transform: translateY(-1px); }

                /* Empty state */
                .empty-state-card { background: var(--bg-card-2); text-align: center; padding: 3rem; color: var(--text-3); }
                .empty-state-text { margin-top: 1rem; font-size: 0.9rem; }

                /* Modal (mirrors Admin/Index.tsx conventions) */
                .modal-overlay {
                    position: fixed; inset: 0; z-index: 100;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 1rem;
                }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 480px;
                    width: 100%;
                    overflow: hidden;
                }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem 1.5rem 1rem; border-bottom: 1px solid var(--border); }
                .modal-title { font-size: 1.15rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.25rem; }
                .modal-subtitle { font-size: 0.8rem; color: var(--text-3); }
                .modal-close {
                    width: 32px; height: 32px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }
                .modal-close:hover { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
                .modal-body { padding: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
                .form-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
                .form-optional { font-weight: 400; text-transform: none; font-size: 0.65rem; }
                .form-textarea {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    width: 100%;
                    resize: vertical;
                }
                .form-error { font-size: 0.75rem; color: var(--danger); }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex; justify-content: flex-end; gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .btn-neutral {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem; font-weight: 500;
                    cursor: pointer;
                }
                .btn-neutral:hover { background: var(--bg-card-2); }
                .btn-danger-solid {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, var(--danger), #e05a5a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem; font-weight: 600;
                    cursor: pointer;
                }
                .btn-danger-solid:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(214, 59, 59, 0.35); }
                .btn-danger-solid:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            `}</style>
        </div>
    );
}
