import { useState, useRef, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouteWithSlug } from '@/utils/routeWithSlug';
import {
    Building,
    UserPlus,
    Trash2,
    Pencil,
    CheckCircle,
    X,
    Users,
    AlertCircle,
    Shield,
    Store,
    FlaskConical,
    Package,
    RefreshCw,
    FileText,
    Image,
    Upload,
    Search,
} from 'lucide-react';
import type { Entity } from '@/types';
import FactureSettings from './FactureSettings';

interface AdminIndexProps {
    entities: Array<Entity & { logo?: string | null; logo_url?: string | null }>;
    users: Array<{
        id: number;
        nom: string;
        entity_id: number;
        entity?: { id: number; nom: string; type: string } | null;
        role: string;
        active: boolean;
        pin: string;
    }>;
    facture_settings?: {
        auto_generation_enabled: boolean;
        description?: string;
    };
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: '#d63b3b',
    DIRECTION: '#8b5cf6',
    RESP_LABO: '#3b5bdb',
    EMPLOYE_LABO: '#3b5bdb',
    RESP_BOUTIQUE: '#e8742a',
    EMPLOYE_VENTE: '#e8742a',
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrateur',
    DIRECTION: 'Direction',
    RESP_LABO: 'Responsable Labo',
    EMPLOYE_LABO: 'Employé Labo',
    RESP_BOUTIQUE: 'Responsable Boutique',
    EMPLOYE_VENTE: 'Employé Vente',
};

export default function AdminIndex({
    entities: initialEntities,
    users: initialUsers,
    facture_settings,
}: AdminIndexProps) {
    const { hasRole } = useAuth();
    // Store Admin (guard "store") : espace cloisonné à son store. On masque les
    // entités globales et la facturation, et on poste vers /store/admin/* (l'Admin
    // interne poste vers /admin/*, le slug étant rajouté par l'intercepteur d'app.tsx).
    const isStoreAdmin = hasRole('STORE_ADMIN');
    const adminBase = isStoreAdmin ? '/store/admin' : '/admin';
    const [activeTab, setActiveTab] = useState<'entities' | 'users' | 'facturation'>(
        isStoreAdmin ? 'users' : 'entities',
    );
    const [entities, setEntities] = useState(initialEntities);
    const [users, setUsers] = useState(initialUsers);
    const [entityModalOpen, setEntityModalOpen] = useState(false);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [deleteEntity, setDeleteEntity] = useState<{
        id: number;
        nom: string;
    } | null>(null);
    const [deleteUser, setDeleteUser] = useState<{
        id: number;
        nom: string;
        role: string;
    } | null>(null);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
    const [editingUser, setEditingUser] = useState<
        (typeof initialUsers)[0] | null
    >(null);
    const [logoModalEntity, setLogoModalEntity] = useState<(typeof initialEntities)[0] | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [searchEntities, setSearchEntities] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const filteredEntities = useMemo(() =>
        !searchEntities ? entities : entities.filter(e => e.nom.toLowerCase().includes(searchEntities.toLowerCase())),
    [entities, searchEntities]);
    const filteredUsers = useMemo(() =>
        !searchUsers ? users : users.filter(u => u.nom.toLowerCase().includes(searchUsers.toLowerCase())),
    [users, searchUsers]);

    const entityForm = useForm({ id: 0, type: 'LABO', nom: '', adresse: '' });
    const userForm = useForm({
        id: 0,
        nom: '',
        entity_id: '',
        role: '',
        pin: '',
        active: true,
    });

    const openEntityModal = (entity?: Entity) => {
        if (entity) {
            setEditingEntity(entity);
            entityForm.setData({
                id: entity.id,
                type: entity.type,
                nom: entity.nom,
                adresse: entity.adresse || '',
            });
        } else {
            setEditingEntity(null);
            entityForm.reset('type', 'nom', 'adresse');
        }
        setEntityModalOpen(true);
    };

    const submitEntity = () => {
        if (editingEntity) {
            entityForm.put(
                editingEntity.id === 0
                    ? ''
                    : `${adminBase}/entities/${editingEntity.id}`,
                {
                    onSuccess: (page: any) => {
                        setEntities(page.props.entities);
                        setEntityModalOpen(false);
                    },
                },
            );
        } else {
            entityForm.post(`${adminBase}/entities`, {
                onSuccess: (page: any) => {
                    setEntities(page.props.entities);
                    setEntityModalOpen(false);
                },
            });
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !logoModalEntity) return;
        setLogoUploading(true);
        const formData = new FormData();
        formData.append('logo', file);
        router.post(`${adminBase}/entities/${logoModalEntity.id}/logo`, formData, {
            forceFormData: true,
            onSuccess: (page: any) => {
                setEntities(page.props.entities);
                setLogoModalEntity(null);
                setLogoUploading(false);
            },
            onError: () => setLogoUploading(false),
        });
    };

    const handleLogoDelete = (entity: (typeof initialEntities)[0]) => {
        if (!confirm(`Supprimer le logo de « ${entity.nom} » ?`)) return;
        router.delete(`${adminBase}/entities/${entity.id}/logo`, {
            onSuccess: (page: any) => setEntities(page.props.entities),
        });
    };

    const openUserModal = (user?: (typeof initialUsers)[0]) => {
        if (user) {
            setEditingUser(user);
            userForm.setData({
                id: user.id,
                nom: user.nom,
                entity_id: user.entity_id?.toString() || '',
                role: user.role,
                pin: '',
                active: user.active,
            });
        } else {
            setEditingUser(null);
            userForm.reset('nom', 'entity_id', 'role', 'pin', 'active');
            userForm.setData('active', true);
        }
        setUserModalOpen(true);
    };

    const submitUser = () => {
        const url = editingUser
            ? `${adminBase}/users/${editingUser.id}`
            : `${adminBase}/users`;
        const method = editingUser ? 'put' : 'post';
        userForm[method](url, {
            onSuccess: (page: any) => {
                setUsers(page.props.users);
                setUserModalOpen(false);
            },
        });
    };

    const totalEntities = entities.length;
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.active).length;

    return (
        <div className="admin-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Administration</h1>
                    <p className="page-subtitle">
                        Gestion des entités, utilisateurs et produits
                    </p>
                </div>
                <div className="header-actions">
                    {!isStoreAdmin && (
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                if (confirm('Recalculer les coûts de revient de tous les produits ? Cela peut prendre quelques secondes.')) {
                                    router.post(`${adminBase}/products/recalc-costs`, {}, {
                                        onSuccess: () => {
                                            alert('Coûts recalculés avec succès !');
                                        },
                                        onError: () => {
                                            alert('Erreur lors du recalcul.');
                                        },
                                    });
                                }
                            }}
                            title="Recalculer automatiquement les coûts de revient (basé sur les prix des ingrédients)"
                        >
                            <RefreshCw size={16} strokeWidth={1.5} />
                            <span>Recalculer coûts</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                {!isStoreAdmin && (
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--orange">
                            <Building size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Entités</div>
                            <div className="stat-value">{totalEntities}</div>
                        </div>
                    </div>
                )}
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <Users size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Utilisateurs</div>
                        <div className="stat-value stat-value--success">
                            {totalUsers}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <CheckCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Comptes actifs</div>
                        <div className="stat-value">{activeUsers}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Shield size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Rôles</div>
                        <div className="stat-value">6</div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="tabs">
                {!isStoreAdmin && (
                    <button
                        className={`tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
                        onClick={() => setActiveTab('entities')}
                    >
                        <Building size={16} strokeWidth={1.5} />
                        Entités
                    </button>
                )}
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={16} strokeWidth={1.5} />
                    Utilisateurs
                </button>
                {!isStoreAdmin && (
                    <button
                        className={`tab-btn ${activeTab === 'facturation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('facturation')}
                    >
                        <FileText size={16} strokeWidth={1.5} />
                        Facturation
                    </button>
                )}
            </div>

            {/* ── ONGLET ENTITÉS ── */}
            {activeTab === 'entities' && (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Liste des entités</span>
                        </div>
                        <div className="search-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchEntities}
                                onChange={(e) => setSearchEntities(e.target.value)}
                                className="form-input finput--search"
                            />
                        </div>
                        <button
                            onClick={() => openEntityModal()}
                            className="btn-primary"
                        >
                            <Building size={14} strokeWidth={1.5} />
                            <span>Nouvelle entité</span>
                        </button>
                    </div>

                    {filteredEntities.length === 0 ? (
                        <div className="empty-state-card">
                            <Building size={48} strokeWidth={1} />
                            <div className="empty-state-text">
                                Aucune entité enregistrée
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="mobile-list">
                                {filteredEntities.map((e) => (
                                    <div key={e.id} className="mobile-row">
                                        <div className="mobile-row-top">
                                            <span className="mobile-name">
                                                {e.nom}
                                            </span>
                                            <span
                                                className={`type-badge ${e.type === 'LABO' ? 'type-badge--labo' : 'type-badge--boutique'}`}
                                            >
                                                {e.type === 'LABO' ? (
                                                    <FlaskConical size={12} />
                                                ) : (
                                                    <Store size={12} />
                                                )}
                                                {e.type}
                                            </span>
                                        </div>
                                        <div className="mobile-row-meta">
                                            <span className="meta-text">
                                                {e.adresse ||
                                                    'Adresse non renseignée'}
                                            </span>
                                        </div>
                                        <div className="mobile-actions">
                                            <button
                                                onClick={() =>
                                                    openEntityModal(e)
                                                }
                                                className="btn-ghost"
                                            >
                                                <Pencil
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                                <span>Modifier</span>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setDeleteEntity({
                                                        id: e.id,
                                                        nom: e.nom,
                                                    })
                                                }
                                                className="btn-icon-danger"
                                            >
                                                <Trash2
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Type</th>
                                            <th>Logo</th>
                                            <th>Adresse</th>
                                            <th className="text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntities.map((e) => (
                                            <tr key={e.id}>
                                                <td>
                                                    <span className="product-name">
                                                        {e.nom}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`type-badge ${e.type === 'LABO' ? 'type-badge--labo' : 'type-badge--boutique'}`}
                                                    >
                                                        {e.type === 'LABO' ? (
                                                            <FlaskConical
                                                                size={12}
                                                            />
                                                        ) : (
                                                            <Store size={12} />
                                                        )}
                                                        {e.type}
                                                    </span>
                                                </td>
                                                <td className="text-muted">
                                                    {e.adresse || '—'}
                                                </td>
                                                <td>
                                                    {e.logo_url ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <img
                                                                src={e.logo_url}
                                                                alt="Logo"
                                                                style={{ height: 32, maxWidth: 80, borderRadius: 4, objectFit: 'contain', background: '#f8f8f8', border: '1px solid #eee', padding: 2 }}
                                                            />
                                                            <button
                                                                onClick={() => handleLogoDelete(e)}
                                                                className="btn-icon-danger-sm"
                                                                title="Supprimer logo"
                                                                style={{ marginLeft: 2 }}
                                                            >
                                                                <Trash2 size={12} strokeWidth={1.5} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setLogoModalEntity(e); setTimeout(() => logoInputRef.current?.click(), 50); }}
                                                            className="btn-ghost-sm"
                                                            title="Ajouter un logo"
                                                        >
                                                            <Upload size={13} strokeWidth={1.5} />
                                                            <span style={{ fontSize: '0.75rem' }}>Logo</span>
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <div className="table-actions">
                                                        <button
                                                            onClick={() =>
                                                                openEntityModal(
                                                                    e,
                                                                )
                                                            }
                                                            className="btn-ghost-sm"
                                                            title="Éditer"
                                                        >
                                                            <Pencil
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setDeleteEntity(
                                                                    {
                                                                        id: e.id,
                                                                        nom: e.nom,
                                                                    },
                                                                )
                                                            }
                                                            className="btn-icon-danger-sm"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── ONGLET UTILISATEURS ── */}
            {activeTab === 'users' && (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Liste des utilisateurs</span>
                        </div>
                        <div className="search-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchUsers}
                                onChange={(e) => setSearchUsers(e.target.value)}
                                className="form-input finput--search"
                            />
                        </div>
                        <button
                            onClick={() => openUserModal()}
                            className="btn-primary"
                        >
                            <UserPlus size={14} strokeWidth={1.5} />
                            <span>Nouvel utilisateur</span>
                        </button>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="empty-state-card">
                            <Users size={48} strokeWidth={1} />
                            <div className="empty-state-text">
                                Aucun utilisateur enregistré
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="mobile-list">
                                {filteredUsers.map((u) => (
                                    <div key={u.id} className="mobile-row">
                                        <div className="mobile-row-top">
                                            <span className="mobile-name">
                                                {u.nom}
                                            </span>
                                            <span
                                                className={`status-badge ${u.active ? 'status-badge--success' : 'status-badge--danger'}`}
                                            >
                                                {u.active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                        <div className="mobile-row-meta">
                                            <span className="meta-text">
                                                {u.entity?.nom || '—'}
                                            </span>
                                        </div>
                                        <div className="mobile-stats">
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Rôle
                                                </span>
                                                <span
                                                    className="role-badge"
                                                    style={{
                                                        background: `${ROLE_COLORS[u.role]}15`,
                                                        color: ROLE_COLORS[
                                                            u.role
                                                        ],
                                                    }}
                                                >
                                                    {ROLE_LABELS[u.role]}
                                                </span>
                                            </div>
                                            <div className="mobile-stat-divider" />
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    PIN
                                                </span>
                                                <span className="mobile-stat-value text-muted">
                                                    ●●●●
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mobile-actions">
                                            <button
                                                onClick={() => openUserModal(u)}
                                                className="btn-ghost"
                                            >
                                                <Pencil
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                                <span>Modifier</span>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setDeleteUser({
                                                        id: u.id,
                                                        nom: u.nom,
                                                        role: u.role,
                                                    })
                                                }
                                                className="btn-icon-danger"
                                                disabled={
                                                    u.role === 'ADMIN' &&
                                                    users.filter(
                                                        (u2) =>
                                                            u2.role === 'ADMIN',
                                                    ).length === 1
                                                }
                                            >
                                                <Trash2
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Entité</th>
                                            <th>Rôle</th>
                                            <th>PIN</th>
                                            <th>Statut</th>
                                            <th className="text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id}>
                                                <td>
                                                    <span className="product-name">
                                                        {u.nom}
                                                    </span>
                                                </td>
                                                <td className="text-muted">
                                                    {u.entity?.nom || '—'}
                                                </td>
                                                <td>
                                                    <span
                                                        className="role-badge"
                                                        style={{
                                                            background: `${ROLE_COLORS[u.role]}15`,
                                                            color: ROLE_COLORS[
                                                                u.role
                                                            ],
                                                        }}
                                                    >
                                                        {ROLE_LABELS[u.role]}
                                                    </span>
                                                </td>
                                                <td className="text-muted font-mono">
                                                    ●●●●
                                                </td>
                                                <td>
                                                    <span
                                                        className={`status-badge ${u.active ? 'status-badge--success' : 'status-badge--danger'}`}
                                                    >
                                                        {u.active
                                                            ? 'Actif'
                                                            : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="table-actions">
                                                        <button
                                                            onClick={() =>
                                                                openUserModal(u)
                                                            }
                                                            className="btn-ghost-sm"
                                                            title="Éditer"
                                                        >
                                                            <Pencil
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setDeleteUser({
                                                                    id: u.id,
                                                                    nom: u.nom,
                                                                    role: u.role,
                                                                })
                                                            }
                                                            className="btn-icon-danger-sm"
                                                            title="Supprimer"
                                                            disabled={
                                                                u.role ===
                                                                    'ADMIN' &&
                                                                users.filter(
                                                                    (u2) =>
                                                                        u2.role ===
                                                                        'ADMIN',
                                                                ).length === 1
                                                            }
                                                        >
                                                            <Trash2
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── ONGLET FACTURATION ── */}
            {!isStoreAdmin && activeTab === 'facturation' && facture_settings && (
                <FactureSettings
                    auto_generation_enabled={facture_settings.auto_generation_enabled}
                    description={facture_settings.description}
                />
            )}

            {/* ── MODAL ENTITÉ ── */}
            {entityModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setEntityModalOpen(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    {editingEntity
                                        ? "Modifier l'entité"
                                        : 'Nouvelle entité'}
                                </h3>
                                <p className="modal-subtitle">
                                    {editingEntity
                                        ? "Modifier les informations de l'entité"
                                        : 'Ajouter une nouvelle entité (Laboratoire ou Boulangerie)'}
                                </p>
                            </div>
                            <button
                                onClick={() => setEntityModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">
                                    Type <span className="text-orange">*</span>
                                </label>
                                <div className="type-selector">
                                    <button
                                        type="button"
                                        className={`type-option ${entityForm.data.type === 'LABO' ? 'active' : ''}`}
                                        onClick={() =>
                                            entityForm.setData('type', 'LABO')
                                        }
                                    >
                                        <FlaskConical size={18} />
                                        Laboratoire
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-option ${entityForm.data.type === 'BOULANGERIE' ? 'active' : ''}`}
                                        onClick={() =>
                                            entityForm.setData(
                                                'type',
                                                'BOULANGERIE',
                                            )
                                        }
                                    >
                                        <Store size={18} />
                                        Boulangerie
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Nom <span className="text-orange">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={entityForm.data.nom}
                                    onChange={(e) =>
                                        entityForm.setData(
                                            'nom',
                                            e.target.value,
                                        )
                                    }
                                    className="form-input"
                                    placeholder="Nom de l'entité"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adresse</label>
                                <textarea
                                    value={entityForm.data.adresse}
                                    onChange={(e) =>
                                        entityForm.setData(
                                            'adresse',
                                            e.target.value,
                                        )
                                    }
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Adresse complète"
                                />
                            </div>
                            {editingEntity && (
                                <div className="form-group">
                                    <label className="form-label">Logo</label>
                                    {(() => {
                                        const ent = entities.find(e => e.id === editingEntity.id);
                                        return ent?.logo_url ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--bg-card-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                                <img src={ent.logo_url} alt="Logo actuel" style={{ height: 48, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', margin: 0 }}>Logo actuel</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setLogoModalEntity(ent); setTimeout(() => logoInputRef.current?.click(), 50); }}
                                                    className="btn-ghost-sm"
                                                    title="Changer le logo"
                                                >
                                                    <Upload size={13} strokeWidth={1.5} />
                                                    Changer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleLogoDelete(ent)}
                                                    className="btn-icon-danger-sm"
                                                    title="Supprimer logo"
                                                >
                                                    <Trash2 size={13} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => { const ent = entities.find(e => e.id === editingEntity.id); if (ent) { setLogoModalEntity(ent); setTimeout(() => logoInputRef.current?.click(), 50); } }}
                                                className="btn-secondary"
                                                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                                            >
                                                <Upload size={16} strokeWidth={1.5} />
                                                Téléverser un logo
                                            </button>
                                        );
                                    })()}
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 6 }}>
                                        Formats acceptés : JPG, PNG, SVG, WEBP — max 2 Mo
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setEntityModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitEntity}
                                disabled={entityForm.processing}
                                className="btn-primary"
                            >
                                {entityForm.processing ? (
                                    <span className="spinner" />
                                ) : (
                                    <CheckCircle size={16} strokeWidth={1.5} />
                                )}
                                {entityForm.processing
                                    ? 'Enregistrement…'
                                    : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL UTILISATEUR ── */}
            {userModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setUserModalOpen(false)}
                >
                    <div
                        className="modal modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    {editingUser
                                        ? "Modifier l'utilisateur"
                                        : 'Nouvel utilisateur'}
                                </h3>
                                <p className="modal-subtitle">
                                    {editingUser
                                        ? "Modifier les informations de l'utilisateur"
                                        : 'Ajouter un nouvel utilisateur avec ses accès'}
                                </p>
                            </div>
                            <button
                                onClick={() => setUserModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Nom{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={userForm.data.nom}
                                        onChange={(e) =>
                                            userForm.setData(
                                                'nom',
                                                e.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="Prénom Nom"
                                    />
                                </div>
                                {!isStoreAdmin && (
                                    <div className="form-group">
                                        <label className="form-label">
                                            Entité{' '}
                                            <span className="text-orange">*</span>
                                        </label>
                                        <select
                                            value={userForm.data.entity_id}
                                            onChange={(e) =>
                                                userForm.setData(
                                                    'entity_id',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-select"
                                        >
                                            <option value="">
                                                Sélectionner une entité…
                                            </option>
                                            {entities.map((e) => (
                                                <option key={e.id} value={e.id}>
                                                    {e.nom} (
                                                    {e.type === 'LABO'
                                                        ? 'Laboratoire'
                                                        : 'Boulangerie'}
                                                    )
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {isStoreAdmin && (
                                    <div className="form-group">
                                        <label className="form-label">
                                            Entité{' '}
                                            <span className="text-orange">*</span>
                                        </label>
                                        <div
                                            style={{
                                                padding: '0.75rem',
                                                background: 'var(--bg-card-2)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '4px',
                                                color: 'var(--text-2)',
                                            }}
                                        >
                                            {entities[0]?.nom || 'Votre entité'}
                                        </div>
                                        <p
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-3)',
                                                marginTop: '0.5rem',
                                            }}
                                        >
                                            Automatiquement assignée à votre store
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        Rôle{' '}
                                        <span className="text-orange">*</span>
                                    </label>
                                    <select
                                        value={userForm.data.role}
                                        onChange={(e) =>
                                            userForm.setData(
                                                'role',
                                                e.target.value,
                                            )
                                        }
                                        className="form-select"
                                    >
                                        {/* ADMIN et DIRECTION sont réservés à
                                            l'admin interne : le backend les
                                            refuse pour un Store Admin, on ne les
                                            propose donc pas. */}
                                        {!isStoreAdmin && (
                                            <>
                                                <option value="ADMIN">
                                                    Administrateur
                                                </option>
                                                <option value="DIRECTION">
                                                    Direction
                                                </option>
                                            </>
                                        )}
                                        <option value="RESP_LABO">
                                            Responsable Laboratoire
                                        </option>
                                        <option value="EMPLOYE_LABO">
                                            Employé Laboratoire
                                        </option>
                                        <option value="RESP_BOUTIQUE">
                                            Responsable Boutique
                                        </option>
                                        <option value="EMPLOYE_VENTE">
                                            Employé Vente
                                        </option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Code PIN
                                        {editingUser && (
                                            <span className="form-optional">
                                                {' '}
                                                (laisser vide pour ne pas
                                                changer)
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={userForm.data.pin}
                                        onChange={(e) =>
                                            userForm.setData(
                                                'pin',
                                                e.target.value,
                                            )
                                        }
                                        className="form-input pin-input"
                                        placeholder={
                                            editingUser ? '••••' : '4 chiffres'
                                        }
                                    />
                                </div>
                            </div>
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="user-active"
                                    checked={userForm.data.active}
                                    onChange={(e) =>
                                        userForm.setData(
                                            'active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                <label htmlFor="user-active">
                                    Compte actif
                                </label>
                            </div>
                            {(!editingUser || userForm.data.pin) && (
                                <p className="form-hint">
                                    Le PIN sera hashé (SHA-256) avant stockage.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setUserModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitUser}
                                disabled={userForm.processing}
                                className="btn-primary"
                            >
                                {userForm.processing ? (
                                    <span className="spinner" />
                                ) : (
                                    <UserPlus size={16} strokeWidth={1.5} />
                                )}
                                {userForm.processing
                                    ? 'Enregistrement…'
                                    : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HIDDEN LOGO INPUT ── */}
            <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
            />

            {/* ── MODAL LOGO EN COURS ── */}
            {logoUploading && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 300, padding: '2rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <Upload size={36} style={{ color: 'var(--orange)', margin: '0 auto' }} />
                        </div>
                        <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>Upload du logo en cours…</p>
                    </div>
                </div>
            )}

            {/* ── MODAL CONFIRMATION SUPPRESSION ENTITÉ ── */}
            {deleteEntity && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteEntity(null)}
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
                                onClick={() => setDeleteEntity(null)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-danger">
                                Confirmer la suppression
                            </h3>
                            <p className="modal-message">
                                Êtes-vous sûr de vouloir supprimer l'entité{' '}
                                <strong>"{deleteEntity.nom}"</strong> ?
                            </p>
                            <p className="modal-message-subtle">
                                Cette action est irréversible et supprimera
                                également tous les utilisateurs associés.
                            </p>
                        </div>
                        <div className="modal-footer-danger">
                            <button
                                onClick={() => setDeleteEntity(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() =>
                                    router.delete(
                                        `${adminBase}/entities/${deleteEntity.id}`,
                                    )
                                }
                                className="btn-danger"
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                                Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CONFIRMATION SUPPRESSION UTILISATEUR ── */}
            {deleteUser && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteUser(null)}
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
                                onClick={() => setDeleteUser(null)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-danger">
                                Confirmer la suppression
                            </h3>
                            <p className="modal-message">
                                Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
                                <strong>"{deleteUser.nom}"</strong> ?
                            </p>
                            {deleteUser.role === 'ADMIN' && (
                                <p className="modal-message-warning">
                                    ⚠️ Attention : Ceci est un compte
                                    administrateur. Assurez-vous qu'il y a un
                                    autre administrateur.
                                </p>
                            )}
                            <p className="modal-message-subtle">
                                Cette action est irréversible.
                            </p>
                        </div>
                        <div className="modal-footer-danger">
                            <button
                                onClick={() => setDeleteUser(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() =>
                                    router.delete(
                                        `${adminBase}/users/${deleteUser.id}`,
                                    )
                                }
                                className="btn-danger"
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                                Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .admin-page { display: flex; flex-direction: column; gap: 1.5rem; }

                /* Header */
                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
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
                .stat-content { flex: 1; }
                .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--orange); line-height: 1.2; }
                .stat-value--success { color: var(--success); }

                /* Tabs */
                .tabs {
                    display: flex;
                    gap: 4px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 4px;
                    width: fit-content;
                }
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.2rem;
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
                .tab-btn.active {
                    background: var(--bg-card);
                    color: var(--orange);
                    box-shadow: var(--shadow-sm);
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
                .table-dot { width: 8px; height: 8px; background: var(--orange); border-radius: 50%; }
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 240px; }

                /* Mobile List */
                .mobile-list { display: flex; flex-direction: column; }
                .mobile-row { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .mobile-row:hover { background: var(--bg-card-2); }
                .mobile-row-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
                .mobile-name { font-weight: 600; font-size: 0.9rem; color: var(--text-1); }
                .mobile-row-meta { margin-bottom: 0.65rem; }
                .meta-text { font-size: 0.75rem; color: var(--text-3); }
                .mobile-stats { display: flex; gap: 1rem; align-items: center; padding-top: 0.5rem; }
                .mobile-stat { display: flex; flex-direction: column; gap: 2px; }
                .mobile-stat-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
                .mobile-stat-value { font-size: 0.85rem; font-weight: 600; }
                .mobile-stat-divider { width: 1px; height: 24px; background: var(--border); }
                .mobile-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: flex-end; }

                /* Desktop Table */
                .table-wrapper { display: none; overflow-x: auto; }
                @media (min-width: 768px) {
                    .mobile-list { display: none; }
                    .table-wrapper { display: block; }
                }
                .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .data-table thead tr { border-bottom: 2px solid var(--border); }
                .data-table th { padding: 0.85rem 1rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); text-align: left; }
                .data-table th.text-right { text-align: right; }
                .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .data-table tbody tr:hover { background: var(--bg-card-2); }
                .data-table td { padding: 0.85rem 1rem; }
                .data-table td.text-right { text-align: right; }

                .product-name { font-weight: 600; color: var(--text-1); }
                .text-muted { color: var(--text-3); }

                /* Badges */
                .type-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .type-badge--labo { background: rgba(59, 91, 219, 0.1); color: var(--blue); }
                .type-badge--boutique { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .role-badge { display: inline-flex; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
                .status-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
                .status-badge--success { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .status-badge--danger { background: rgba(214, 59, 59, 0.1); color: var(--danger); }

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
                .btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.8rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-ghost:hover { background: rgba(232, 116, 42, 0.1); transform: translateY(-1px); }
                .btn-ghost-sm {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.7rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-ghost-sm:hover { background: rgba(232, 116, 42, 0.1); }
                .btn-icon-danger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-icon-danger:hover { background: rgba(214, 59, 59, 0.1); }
                .btn-icon-danger-sm {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.6rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-icon-danger-sm:hover { background: rgba(214, 59, 59, 0.1); }
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
                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, var(--danger), #e05a5a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(214, 59, 59, 0.35); }
                .table-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

                /* Type Selector */
                .type-selector {
                    display: flex;
                    gap: 0.5rem;
                }
                .type-option {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.6rem;
                    background: var(--bg-card-2);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--text-2);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .type-option.active {
                    background: rgba(232, 116, 42, 0.1);
                    border-color: var(--orange);
                    color: var(--orange);
                }

                /* Form */
                .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .form-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
                .form-optional { font-weight: 400; text-transform: none; font-size: 0.65rem; }
                .form-input, .form-select, .form-textarea {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    transition: all 0.2s;
                    width: 100%;
                }
                .form-input:focus, .form-select:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .pin-input { font-family: monospace; letter-spacing: 0.2em; text-align: center; }
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    margin: 0.5rem 0;
                }
                .checkbox-group input { width: 18px; height: 18px; cursor: pointer; }
                .checkbox-group label { font-size: 0.85rem; font-weight: 500; color: var(--text-1); cursor: pointer; }
                .form-hint { font-size: 0.7rem; color: var(--text-3); margin-top: 0.25rem; }

                /* Empty State */
                .empty-state-card {
                    background: var(--bg-card-2);
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-3);
                }
                .empty-state-text { margin-top: 1rem; font-size: 0.9rem; }

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
                    max-width: 560px;
                    width: 100%;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .modal-lg { max-width: 680px; }
                .modal-danger { max-width: 460px; border: 1px solid rgba(214, 59, 59, 0.2); }
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
                .modal-title { font-size: 1.2rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.25rem; }
                .modal-title-danger { font-size: 1.2rem; font-weight: 700; color: var(--danger); margin-bottom: 0.5rem; }
                .modal-subtitle { font-size: 0.8rem; color: var(--text-3); }
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
                .modal-footer-danger {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-message { font-size: 0.95rem; color: var(--text-2); margin-bottom: 0.5rem; }
                .modal-message-warning { font-size: 0.85rem; color: var(--warning); background: var(--warning-bg); padding: 0.5rem; border-radius: 8px; margin: 1rem 0; }
                .modal-message-subtle { font-size: 0.75rem; color: var(--text-3); }
                .text-center { text-align: center; }
                .text-orange { color: var(--orange); }

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
