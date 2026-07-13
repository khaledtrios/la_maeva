import { useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import {
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    Factory,
    Package,
    Wallet,
    BarChart2,
    Settings,
    Thermometer,
    AlertCircle,
    Cookie,
    Truck,
    AlertOctagon,
    Clock,
    DollarSign,
} from 'lucide-react';
import { index as productionRoutes } from '@/routes/production';
import { index as productsRoutes } from '@/routes/products';
import { index as inventoryRoutes } from '@/routes/inventory';
import { index as expeditionsRoutes } from '@/routes/expeditions';
import { index as receptionsRoutes } from '@/routes/receptions';
import { index as salesRoutes } from '@/routes/sales';
import { index as haccpIndex } from '@/routes/haccp';
import { index as reportingRoutes } from '@/routes/reporting';
import { index as adminRoutes } from '@/routes/admin';
import { index as stockRoutes } from '@/routes/stock';

interface Alert {
    id: number;
    ingredient: { nom: string; unite: string | null };
    quantite: number;
    seuil_minimum: number;
    deficit: number;
}

interface LaboData {
    count: number;
    total_unites: number;
    total_pertes: number;
    productions: any[];
}

interface BoutiqueData {
    receptions_en_attente: number;
    returns_en_attente: number;
    expired_count: number;
    expiring_soon_count: number;
    stock_summary: {
        total_quantity: number;
        total_value: number;
    };
}

interface FactureStats {
    factures_brouillon: number;
    factures_emises_mois: number;
    montant_en_cours: number;
}

interface MenuItem {
    label: string;
    route: { url: () => string };
    roles: string[];
    badge?: number;
    Icon: React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        className?: string;
    }>;
}

export default function Dashboard() {
    const { auth, alerts, laboData, boutiqueData, factureStats } = usePage().props as any;
    const { user } = useAuth();
    const { pusher } = useRealtime(); // initialise Pusher pour les alertes en temps réel

    // Écoute des alertes temps réel (stock, commandes, etc.)
    useEffect(() => {
        const playSound = () => {
            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch (e) {
                // silence
            }
        };

        const handleAlert = () => {
            console.log('[Dashboard] Nouvelle alerte reçue');
            playSound();
            // Recharger les alertes du dashboard
            router.reload({
                only: ['alerts', 'laboData', 'boutiqueData'],
                preserveState: true,
                preserveScroll: true,
            });
        };

        window.addEventListener('commande-urgente-created', handleAlert);
        window.addEventListener('stock-alert', handleAlert);

        return () => {
            window.removeEventListener('commande-urgente-created', handleAlert);
            window.removeEventListener('stock-alert', handleAlert);
        };
    }, [router]);

    const receptionsEnAttente = boutiqueData?.receptions_en_attente || 0;
    const returnsEnAttente = boutiqueData?.returns_en_attente || 0;

    const menuItems = useMemo<MenuItem[]>(() => {
        const all: MenuItem[] = [
            {
                label: 'Production',
                route: productionRoutes,
                roles: ['ADMIN', 'RESP_LABO', 'EMPLOYE_LABO'],
                Icon: Factory,
            },
            {
                label: 'Produits',
                route: productsRoutes,
                roles: ['ADMIN', 'RESP_LABO'],
                Icon: Cookie,
            },
            {
                label: 'Stocks Labo',
                route: inventoryRoutes,
                roles: ['ADMIN', 'RESP_LABO'],
                Icon: Package,
                badge: alerts.length,
            },
            {
                label: 'Expéditions',
                route: expeditionsRoutes,
                roles: ['ADMIN', 'RESP_LABO'],
                Icon: Truck,
            },
            {
                label: 'Réceptions',
                route: receptionsRoutes,
                roles: ['ADMIN', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE'],
                Icon: Package,
                badge: receptionsEnAttente,
            },
            {
                label: 'Ventes',
                route: salesRoutes,
                roles: ['ADMIN', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE'],
                Icon: Wallet,
            },
            {
                label: 'Stocks Boutique',
                route: stockRoutes,
                roles: ['ADMIN', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE'],
                Icon: Package,
            },
            {
                label: 'HACCP',
                route: haccpIndex,
                roles: [
                    'ADMIN',
                    'RESP_LABO',
                    'RESP_BOUTIQUE',
                    'EMPLOYE_LABO',
                    'EMPLOYE_VENTE',
                ],
                Icon: Thermometer,
            },
            {
                label: 'Rapports',
                route: reportingRoutes,
                roles: ['ADMIN', 'DIRECTION', 'RESP_BOUTIQUE', 'RESP_LABO'],
                Icon: BarChart2,
            },
            {
                label: 'Administration',
                route: adminRoutes,
                roles: ['ADMIN'],
                Icon: Settings,
            },
        ];
        if (!user) return [];
        return all
            .map((item) => ({ ...item, badge: item.badge ?? 0 }))
            .filter((item) => item.roles.includes(user.role));
    }, [user?.role, alerts.length, receptionsEnAttente]);

    const entityName = user?.entity?.nom || `Entité #${user?.entity_id}`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    const statsCards = laboData
        ? [
              {
                  label: "Saisies aujourd'hui",
                  value: laboData.count,
                  color: 'var(--blue)',
                  bg: 'var(--blue-dim)',
                  Icon: ClipboardList,
              },
              {
                  label: 'Unités produites',
                  value: laboData.total_unites,
                  color: 'var(--success)',
                  bg: 'var(--success-bg)',
                  Icon: CheckCircle,
              },
              {
                  label: 'Pertes',
                  value: laboData.total_pertes,
                  color: 'var(--danger)',
                  bg: 'var(--danger-bg)',
                  Icon: AlertTriangle,
              },
          ]
        : [];

// Ajouter stats facturation pour labo
const facturationCards = factureStats && factureStats.montant_en_cours !== undefined && (user?.role === 'ADMIN' || user?.role === 'RESP_LABO')
    ? [
        {
            label: 'Factures brouillon',
            value: factureStats.factures_brouillon ?? 0,
            color: 'var(--warning)',
            bg: 'var(--warning-bg)',
            Icon: Wallet,
        },
        {
            label: 'Factures émises (mois)',
            value: factureStats.factures_emises_mois ?? 0,
            color: 'var(--info)',
            bg: 'var(--info-bg)',
            Icon: BarChart2,
        },
        {
            label: 'Montant en cours',
            value: (factureStats.montant_en_cours ?? 0).toFixed(2) + ' €',
            color: 'var(--success)',
            bg: 'var(--success-bg)',
            Icon: DollarSign,
        },
    ]
    : [];

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="greeting-section">
                    <h1 className="greeting-title">
                        Bonjour, <span className="user-name">{user?.nom}</span>
                        <span className="wave-emoji">👋</span>
                    </h1>
                    <p className="greeting-date">{dateFormatted}</p>
                    <div className="user-badge">
                        <span className="user-role">{user?.role}</span>
                        <span className="separator">•</span>
                        <span className="user-entity">{entityName}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards Grid - Production / Stock */}
            {statsCards.length > 0 && (
                <div className="stats-grid">
                    {statsCards.map((stat: any, index: number) => (
                        <div
                            key={stat.label}
                            className="stat-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div
                                className="stat-icon-wrapper"
                                style={{ background: stat.bg }}
                            >
                                <stat.Icon
                                    size={24}
                                    strokeWidth={1.5}
                                    style={{ color: stat.color }}
                                />
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">{stat.label}</p>
                                <p
                                    className="stat-value"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Cards Grid - Facturation (LABO/ADMIN uniquement) */}
            {facturationCards.length > 0 && (
                <div className="stats-grid">
                    {facturationCards.map((stat: any, index: number) => (
                        <div
                            key={stat.label}
                            className="stat-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div
                                className="stat-icon-wrapper"
                                style={{ background: stat.bg }}
                            >
                                <stat.Icon
                                    size={24}
                                    strokeWidth={1.5}
                                    style={{ color: stat.color }}
                                />
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">{stat.label}</p>
                                <p
                                    className="stat-value"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alert Messages */}
            {boutiqueData && receptionsEnAttente > 0 && (
                <div className="alert alert-warning" role="alert">
                    <AlertCircle size={18} strokeWidth={2} />
                    <span className="alert-text">
                        {receptionsEnAttente} réception
                        {receptionsEnAttente > 1 ? 's' : ''} en attente de
                        confirmation
                    </span>
                </div>
            )}

            {boutiqueData && returnsEnAttente > 0 && (
                <div className="alert alert-warning" role="alert">
                    <AlertTriangle size={18} strokeWidth={2} />
                    <span className="alert-text">
                        {returnsEnAttente} retour
                        {returnsEnAttente > 1 ? 's' : ''} en attente d'envoi
                        au laboratoire
                    </span>
                </div>
            )}

            {alerts.length > 0 && (
                <div className="alert alert-danger" role="alert">
                    <AlertCircle size={18} strokeWidth={2} />
                    <span className="alert-text">
                        {alerts.length} ingrédient{alerts.length > 1 ? 's' : ''}{' '}
                        en rupture de stock
                    </span>
                </div>
            )}

            {/* Widgets Boutique */}
            {boutiqueData && (
                <div className="boutique-widgets">
                    <h2 className="section-title">📦 Ma Boutique</h2>
                    <div className="widgets-grid">
                        {/* Alertes DLC */}
                        {(boutiqueData.expired_count > 0 || boutiqueData.expiring_soon_count > 0) && (
                            <>
                                {boutiqueData.expired_count > 0 && (
                                    <div className="widget widget-danger">
                                        <div className="widget-icon">
                                            <AlertOctagon size={24} />
                                        </div>
                                        <div className="widget-content">
                                            <div className="widget-value">{boutiqueData.expired_count}</div>
                                            <div className="widget-label">Lot(s) expiré(s)</div>
                                        </div>
                                        <div className="widget-action">
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => router.visit('/stock')}
                                            >
                                                Voir stock
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {boutiqueData.expiring_soon_count > 0 && (
                                    <div className="widget widget-warning">
                                        <div className="widget-icon">
                                            <Clock size={24} />
                                        </div>
                                        <div className="widget-content">
                                            <div className="widget-value">{boutiqueData.expiring_soon_count}</div>
                                            <div className="widget-label">Expire(nt) bientôt (≤3j)</div>
                                        </div>
                                        <div className="widget-action">
                                            <button
                                                className="btn btn-sm btn-warning"
                                                onClick={() => router.visit('/stock')}
                                            >
                                                Prioriser
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Retours en attente */}
                        {returnsEnAttente > 0 && (
                            <div className="widget widget-warning">
                                <div className="widget-icon">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="widget-content">
                                    <div className="widget-value">{returnsEnAttente}</div>
                                    <div className="widget-label">Retour{returnsEnAttente > 1 ? 's' : ''} en attente</div>
                                </div>
                                <div className="widget-action">
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={() => router.visit('/returns')}
                                    >
                                        Voir retours
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Résumé stock */}
                        <div className="widget widget-info">
                            <div className="widget-icon">
                                <Package size={24} />
                            </div>
                            <div className="widget-content">
                                <div className="widget-value">
                                    {Number(boutiqueData.stock_summary?.total_quantity || 0).toLocaleString()}
                                </div>
                                <div className="widget-label">Produits en stock</div>
                            </div>
                            <div className="widget-action">
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => router.visit('/stock')}
                                >
                                    Détails
                                </button>
                            </div>
                        </div>

                        {/* Valeur stock */}
                        <div className="widget widget-success">
                            <div className="widget-icon">
                                <DollarSign size={24} />
                            </div>
                            <div className="widget-content">
                                <div className="widget-value">
                                    {Number(boutiqueData.stock_summary?.total_value || 0).toLocaleString('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                </div>
                                <div className="widget-label">Valeur stock</div>
                            </div>
                            <div className="widget-action">
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => router.visit('/stock/movements')}
                                >
                                    Historique
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu Grid */}
            <div className="menu-section">
                <h2 className="menu-title">Modules</h2>
                <div className="menu-grid">
                    {menuItems.map((item, index) => {
                        const Icon = item.Icon;
                        return (
                            <button
                                key={item.label}
                                onClick={() => router.visit(item.route.url())}
                                className="menu-card"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="menu-card-icon-wrapper">
                                    <Icon
                                        size={28}
                                        strokeWidth={1.5}
                                        className="menu-card-icon"
                                    />
                                    {item.badge !== undefined &&
                                        item.badge > 0 && (
                                            <span className="menu-badge">
                                                {item.badge}
                                            </span>
                                        )}
                                </div>
                                <span className="menu-card-label">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .dashboard-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                /* Header Section */
                .dashboard-header {
                    margin-bottom: 2rem;
                    animation: fadeInUp 0.4s ease-out;
                }

                .greeting-section {
                    padding: 0.25rem 0;
                }

                .greeting-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .user-name {
                    background: linear-gradient(135deg, #e8742a, #f5924a);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }

                .wave-emoji {
                    font-size: 1.75rem;
                    animation: wave 1s ease-in-out infinite;
                    display: inline-block;
                }

                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(15deg); }
                    75% { transform: rotate(-10deg); }
                }

                .greeting-date {
                    font-size: 0.875rem;
                    color: var(--text-3);
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .user-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .user-role {
                    background: rgba(232, 116, 42, 0.1);
                    color: #e8742a;
                    padding: 0.25rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    letter-spacing: 0.03em;
                }

                .separator {
                    color: var(--text-3);
                    opacity: 0.5;
                }

                .user-entity {
                    color: var(--text-2);
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                @media (min-width: 0px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (min-width: 640px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (min-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                .stat-card {
                    background: var(--bg-card);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1px solid var(--border);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: fadeInUp 0.4s ease-out both;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow);
                    border-color: transparent;
                }

                .stat-icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-3);
                    margin-bottom: 0.25rem;
                }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    line-height: 1.2;
                }

                /* Alert Messages */
                .alert {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    border-radius: var(--radius);
                    margin-bottom: 1.25rem;
                    animation: fadeInUp 0.4s ease-out;
                }

                .alert-warning {
                    background: var(--warning-bg);
                    border-left: 4px solid var(--warning);
                    color: var(--warning);
                }

                .alert-danger {
                    background: var(--danger-bg);
                    border-left: 4px solid var(--danger);
                    color: var(--danger);
                }

                .alert-text {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-2);
                }

                /* Menu Section */
                .menu-section {
                    margin-top: 1rem;
                }

                .menu-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-1);
                    margin-bottom: 1.25rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid var(--border);
                    display: inline-block;
                }

                .menu-grid {
                    display: grid;
                    gap: 1rem;
                }

                @media (min-width: 0px) {
                    .menu-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (min-width: 640px) {
                    .menu-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (min-width: 1024px) {
                    .menu-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                @media (min-width: 1280px) {
                    .menu-grid {
                        grid-template-columns: repeat(5, 1fr);
                    }
                }

                /* Menu Card Styles - Suppression de tous les effets Tailwind */
                .menu-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    padding: 1.5rem 1rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: fadeInUp 0.4s ease-out both;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    outline: none !important;
                    outline-width: 0 !important;
                    outline-color: transparent !important;
                    --tw-ring-color: transparent !important;
                    --tw-ring-offset-width: 0px !important;
                    --tw-ring-offset-color: transparent !important;
                    --tw-ring-offset-shadow: 0 0 #0000 !important;
                    --tw-ring-shadow: 0 0 #0000 !important;
                    box-shadow: none !important;
                }

                /* Supprimer tous les effets de focus/active de Tailwind */
                .menu-card:focus,
                .menu-card:focus-visible,
                .menu-card:active,
                .menu-card:focus-within {
                    outline: none !important;
                    outline-width: 0 !important;
                    outline-color: transparent !important;
                    --tw-ring-color: transparent !important;
                    --tw-ring-offset-width: 0px !important;
                    --tw-ring-offset-color: transparent !important;
                    --tw-ring-offset-shadow: 0 0 #0000 !important;
                    --tw-ring-shadow: 0 0 #0000 !important;
                    box-shadow: none !important;
                }

                /* Effet de fond orange au hover */
                .menu-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(232, 116, 42, 0.08), rgba(232, 116, 42, 0.02));
                    opacity: 0;
                    transition: opacity 0.25s ease;
                    z-index: 0;
                }

                .menu-card:hover::before {
                    opacity: 1;
                }

                .menu-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(232, 116, 42, 0.2), 0 2px 4px rgba(232, 116, 42, 0.1) !important;
                    border-color: #e8742a !important;
                    background: linear-gradient(135deg, var(--bg-card), rgba(232, 116, 42, 0.04));
                }

                .menu-card:active {
                    transform: translateY(-2px);
                }

                .menu-card-icon-wrapper {
                    position: relative;
                    display: inline-block;
                    z-index: 1;
                }

                .menu-card-icon {
                    color: var(--text-2);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Transition sur le scale de l'icône */
                .menu-card:hover .menu-card-icon {
                    color: #e8742a !important;
                    transform: scale(1.1);
                    filter: drop-shadow(0 2px 6px rgba(232, 116, 42, 0.3));
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .menu-badge {
                    position: absolute;
                    top: -8px;
                    right: -12px;
                    background: #e8742a;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 0.125rem 0.375rem;
                    border-radius: 20px;
                    min-width: 20px;
                    text-align: center;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    animation: bounce 0.3s ease-out;
                    z-index: 2;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .menu-card:hover .menu-badge {
                    transform: scale(1.1);
                    background: #f5924a;
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes bounce {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                .menu-card-label {
                    position: relative;
                    z-index: 1;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-1);
                    text-align: center;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .menu-card:hover .menu-card-label {
                    color: #e8742a !important;
                    transform: translateY(-1px);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Boutique Widgets */
                .boutique-widgets {
                    margin-top: 2rem;
                    animation: fadeInUp 0.4s ease-out both;
                }

                .section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-1);
                    margin-bottom: 1rem;
                }

                .widgets-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1rem;
                }

                .widget {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: all 0.25s ease;
                }

                .widget:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                }

                .widget-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .widget-content {
                    flex: 1;
                }

                .widget-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-1);
                    line-height: 1.2;
                }

                .widget-label {
                    font-size: 0.875rem;
                    color: var(--text-3);
                }

                .widget-action .btn-sm {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8125rem;
                }

                .btn-danger {
                    background: #dc2626;
                    color: white;
                }

                .btn-warning {
                    background: #f59e0b;
                    color: white;
                }

                .btn-secondary {
                    background: var(--bg-dim);
                    border: 1px solid var(--border);
                    color: var(--text-2);
                }

                .widget-danger .widget-icon {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .widget-warning .widget-icon {
                    background: #fef3c7;
                    color: #92400e;
                }

                .widget-info .widget-icon {
                    background: #e0f2fe;
                    color: #0369a1;
                }

                .widget-success .widget-icon {
                    background: #dcfce7;
                    color: #166534;
                }

                /* Animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Mobile optimizations */
                @media (max-width: 480px) {
                    .dashboard-container {
                        padding: 0.75rem;
                    }

                    .greeting-title {
                        font-size: 1.35rem;
                    }

                    .wave-emoji {
                        font-size: 1.35rem;
                    }

                    .stat-value {
                        font-size: 1.5rem;
                    }

                    .stat-icon-wrapper {
                        width: 48px;
                        height: 48px;
                    }

                    .menu-card {
                        padding: 1rem 0.75rem;
                        transition: 0.3s;
                    }

                    .menu-card-icon {
                        width: 24px;
                        height: 24px;
                    }
                }

                /* Small phones */
                @media (max-width: 360px) {
                    .menu-grid {
                        gap: 0.75rem;
                    }

                    .menu-card-label {
                        font-size: 0.75rem;
                    }
                }

                /* Reduced motion preference */
                @media (prefers-reduced-motion: reduce) {
                    .menu-card,
                    .stat-card,
                    .greeting-title,
                    .wave-emoji {
                        animation: none;
                        transition: none;
                    }

                    .wave-emoji {
                        animation: none;
                    }

                    .menu-card::before {
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
}
