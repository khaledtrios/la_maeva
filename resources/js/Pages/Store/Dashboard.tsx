import { Factory, Package, Truck, ShoppingCart, FileText, Settings } from 'lucide-react';
import { withLayout } from '@/hooks/withLayout';
import { router } from '@inertiajs/react';
import type { StoreSummary } from '@/types/store';
import store from '@/routes/store';

interface DashboardProps {
    store: StoreSummary;
    stats?: {
        saisies: number;
        unites_produites: number;
        pertes: number;
    };
    user?: {
        nom: string;
        role: string;
    };
}

const modules = [
    { name: 'Production', icon: Factory, url: store.production.url() },
    { name: 'Stocks Labo', icon: Package, url: store.inventory.url() },
    { name: 'Stocks Boutique', icon: Package, url: store.stocks.url() },
    { name: 'Produits', icon: Package, url: store.products.url() },
    { name: 'Expéditions', icon: Truck, url: store.expeditions.url() },
    { name: 'Réceptions', icon: Truck, url: store.receptions.url() },
    { name: 'Retours', icon: Truck, url: store.returns.url() },
    { name: 'Ventes', icon: ShoppingCart, url: store.sales.url() },
    { name: 'Facturation', icon: FileText, url: store.facturation.url() },
    { name: 'HACCP', icon: Settings, url: store.haccp.url() },
    { name: 'Incidents', icon: Settings, url: store.incidents.url() },
    { name: 'Admin', icon: Settings, url: store.admin.url() },
];

function Dashboard({ store, stats, user }: DashboardProps) {
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(today);

    return (
        <div className="page-content">
            {user && (
                <div className="welcome-header">
                    <div>
                        <h1 className="welcome-title">
                            Bonjour, <span className="highlight">{user.nom}</span> 👋
                        </h1>
                        <p className="welcome-date">{formattedDate}</p>
                        <div className="welcome-info">
                            <span className="badge">{user.role}</span>
                            <span className="separator">•</span>
                            <span className="store-name">{store.name}</span>
                        </div>
                    </div>
                </div>
            )}

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--blue">📋</div>
                        <div className="stat-label">SAISIES AUJOURD'HUI</div>
                        <div className="stat-value">{stats.saisies}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--green">✓</div>
                        <div className="stat-label">UNITÉS PRODUITES</div>
                        <div className="stat-value">{stats.unites_produites}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--red">⚠</div>
                        <div className="stat-label">PERTES</div>
                        <div className="stat-value">{stats.pertes}</div>
                    </div>
                </div>
            )}

            <div className="modules-section">
                <h2 className="modules-title">Modules</h2>
                <div className="modules-grid">
                    {modules.map((module) => (
                        <button
                            key={module.name}
                            onClick={() => router.visit(module.url)}
                            className="module-card"
                        >
                            <div className="module-icon">
                                <module.icon size={24} strokeWidth={1.5} />
                            </div>
                            <div className="module-name">{module.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .page-content {
                    padding: 2rem 1.5rem;
                }
                .welcome-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--border);
                }
                .welcome-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.5rem;
                }
                .welcome-title .highlight {
                    color: var(--orange);
                }
                .welcome-date {
                    font-size: 0.9rem;
                    color: var(--text-3);
                    margin-bottom: 0.75rem;
                    text-transform: capitalize;
                }
                .welcome-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.9rem;
                }
                .badge {
                    background: var(--orange-dim);
                    color: var(--orange);
                    padding: 0.35rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .separator {
                    color: var(--text-3);
                }
                .store-name {
                    color: var(--text-2);
                    font-weight: 500;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .stat-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .stat-icon--blue {
                    background: rgba(59, 91, 219, 0.1);
                }
                .stat-icon--green {
                    background: rgba(76, 175, 80, 0.1);
                }
                .stat-icon--red {
                    background: rgba(220, 95, 95, 0.1);
                }
                .stat-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-3);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .modules-section {
                    margin-top: 2rem;
                }
                .modules-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: var(--text-1);
                    margin-bottom: 1.5rem;
                }
                .modules-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 1rem;
                }
                .module-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 1.25rem 1rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                }
                .module-card:hover {
                    background: var(--bg-hover);
                    border-color: var(--orange);
                    box-shadow: 0 2px 8px rgba(255, 127, 31, 0.1);
                }
                .module-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: var(--orange-dim);
                    color: var(--orange);
                }
                .module-name {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--text-2);
                }
            `}</style>
        </div>
    );
}

export default withLayout(Dashboard);
