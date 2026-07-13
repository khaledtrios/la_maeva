import { router } from '@inertiajs/react';
import { Power, Store as StoreIcon, Wrench } from 'lucide-react';
import { FlashMessage } from '@/Components/UI/FlashMessage';
import { logout } from '@/routes/store';
import type { StoreSummary } from '@/types/store';

interface DashboardProps {
    store: StoreSummary;
}

export default function Dashboard({ store }: DashboardProps) {
    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(logout.url());
    };

    return (
        <div className="store-dash-scene">
            <FlashMessage />

            <header className="store-dash-header">
                <span className="store-dash-brand">
                    LE <em>MAEVA</em>{' '}
                    <span className="store-dash-brand-sep">·</span> Boutique
                </span>
                <form
                    method="post"
                    action={logout.url()}
                    onSubmit={handleLogout}
                >
                    <button type="submit" className="store-dash-logout">
                        <Power size={18} strokeWidth={1.5} />
                        <span>Déconnexion</span>
                    </button>
                </form>
            </header>

            <main className="store-dash-main">
                <div className="store-dash-card">
                    <div className="store-dash-icon">
                        <StoreIcon size={32} strokeWidth={1.5} />
                    </div>
                    <h1 className="store-dash-title">
                        Bienvenue, {store.name} !
                    </h1>
                    <p className="store-dash-note">
                        <Wrench size={14} strokeWidth={1.5} />
                        Le back-office complet de votre boutique est en cours de
                        construction. Revenez bientôt pour gérer vos commandes,
                        votre stock et votre facturation.
                    </p>
                </div>
            </main>

            <style>{`
                .store-dash-scene {
                    min-height: 100vh;
                    background: var(--bg-page);
                }
                .store-dash-header {
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
                .store-dash-brand {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 700;
                    font-size: 1.3rem;
                    letter-spacing: 0.06em;
                    color: #fff;
                }
                .store-dash-brand em {
                    font-style: normal;
                    font-weight: 800;
                    color: #f5924a;
                }
                .store-dash-brand-sep {
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 400;
                }
                .store-dash-logout {
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
                .store-dash-logout:hover {
                    background: var(--orange);
                    border-color: var(--orange);
                    color: white;
                    transform: translateY(-1px);
                }
                .store-dash-main {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem 1.25rem;
                }
                .store-dash-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow);
                    padding: 2.75rem 2rem;
                    max-width: 460px;
                    width: 100%;
                    text-align: center;
                }
                .store-dash-icon {
                    width: 72px;
                    height: 72px;
                    margin: 0 auto 1.25rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--orange-dim);
                    color: var(--orange);
                }
                .store-dash-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.75rem;
                }
                .store-dash-note {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.4rem;
                    font-size: 0.85rem;
                    color: var(--text-3);
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
