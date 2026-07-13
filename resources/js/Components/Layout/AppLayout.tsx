import { router, usePage } from '@inertiajs/react';
import {
    Factory,
    Cookie,
    Package,
    Truck,
    Wallet,
    Thermometer,
    BarChart2,
    Settings,
    LayoutDashboard,
    Power,
    Menu,
    X,
    ChevronRight,
    AlertTriangle,
    Circle,
    FileText,
} from 'lucide-react';
import type { PropsWithChildren} from 'react';
import { useMemo, useState, useEffect } from 'react';
import { FlashMessage } from '@/Components/UI/FlashMessage';
import { ToastContainer } from '@/Components/UI/ToastContainer';
import { logout, dashboard } from '@/routes';

import { index as adminIndex } from '@/routes/admin';
import commandesUrgentes from '@/routes/commandes-urgentes';
import { index as expeditionsIndex } from '@/routes/expeditions';
import { index as facturesIndex } from '@/routes/factures';
import { index as haccpIndex } from '@/routes/haccp';
import { index as inventoryIndex } from '@/routes/inventory';
import { index as nonconformitesIndex } from '@/routes/nonconformites';
import { index as productionIndex } from '@/routes/production';
import { index as productsIndex } from '@/routes/products';
import { index as receptionsIndex } from '@/routes/receptions';
import { index as reportingIndex } from '@/routes/reporting';
import { index as returnsIndex } from '@/routes/returns';
import { index as salesIndex } from '@/routes/sales';
import { index as stockIndex } from '@/routes/stock';
import type { Role } from '@/types';

type RouteObject = { url: (options?: Record<string, unknown>) => string };

const NAV_ICONS: Record<string, React.ReactNode> = {
    Dashboard: <LayoutDashboard size={20} strokeWidth={1.7} />,
    Production: <Factory size={20} strokeWidth={1.7} />,
    Produits: <Cookie size={20} strokeWidth={1.7} />,
    'Stocks Labo': <Package size={20} strokeWidth={1.7} />,
    Expéditions: <Truck size={20} strokeWidth={1.7} />,
    Réceptions: <Package size={20} strokeWidth={1.7} />,
    Retours: <AlertTriangle size={20} strokeWidth={1.7} />,
    'Commandes urgentes': <Truck size={20} strokeWidth={1.7} />,
    Ventes: <Wallet size={20} strokeWidth={1.7} />,
    HACCP: <Thermometer size={20} strokeWidth={1.7} />,
    Incidents: <AlertTriangle size={20} strokeWidth={1.7} />,
    Reporting: <BarChart2 size={20} strokeWidth={1.7} />,
    Admin: <Settings size={20} strokeWidth={1.7} />,
    'Stocks Boutique': <Package size={20} strokeWidth={1.7} />,
    Facturation: <FileText size={20} strokeWidth={1.7} />,
};

// Groupes de navigation pour la sidebar
const NAV_GROUPS = [
    {
        label: 'Général',
        items: ['Dashboard', 'Reporting'],
    },
    {
        label: 'Production & Stocks',
        items: ['Production', 'Produits', 'Stocks Labo', 'Stocks Boutique'],
    },
    {
        label: 'Logistique',
        items: ['Expéditions', 'Réceptions', 'Retours', 'Commandes urgentes'],
    },
    {
        label: 'Commerce',
        items: ['Ventes', 'Facturation'],
    },
    {
        label: 'Qualité & Sécurité',
        items: ['HACCP', 'Incidents'],
    },
    {
        label: 'Administration',
        items: ['Admin'],
    },
];

const MOBILE_VISIBLE = 4;

const navigationByRole: Record<
    string,
    { name: string; route: RouteObject; roles: Role[] }[]
> = {
    EMPLOYE_LABO: [
        { name: 'Production', route: productionIndex, roles: ['EMPLOYE_LABO'] },
        {
            name: 'Commandes urgentes',
            route: commandesUrgentes.index,
            roles: ['EMPLOYE_LABO'],
        },
    ],
    RESP_LABO: [
        { name: 'Dashboard', route: dashboard, roles: ['RESP_LABO'] },
        { name: 'Production', route: productionIndex, roles: ['RESP_LABO'] },
        { name: 'Stocks Labo', route: inventoryIndex, roles: ['RESP_LABO'] },
        { name: 'Produits', route: productsIndex, roles: ['RESP_LABO'] },
        { name: 'Expéditions', route: expeditionsIndex, roles: ['RESP_LABO'] },
        { name: 'Facturation', route: facturesIndex, roles: ['RESP_LABO'] },
        { name: 'Retours', route: returnsIndex, roles: ['RESP_LABO'] },
        {
            name: 'Commandes urgentes',
            route: commandesUrgentes.index,
            roles: ['RESP_LABO'],
        },
        { name: 'HACCP', route: haccpIndex, roles: ['RESP_LABO'] },
        {
            name: 'Incidents',
            route: nonconformitesIndex,
            roles: ['RESP_LABO'],
        },
    ],
    EMPLOYE_VENTE: [
        {
            name: 'Réceptions',
            route: receptionsIndex,
            roles: ['EMPLOYE_VENTE'],
        },
        {
            name: 'Commandes urgentes',
            route: commandesUrgentes.index,
            roles: ['EMPLOYE_VENTE'],
        },
        { name: 'Retours', route: returnsIndex, roles: ['EMPLOYE_VENTE'] },
        { name: 'Ventes', route: salesIndex, roles: ['EMPLOYE_VENTE'] },
        { name: 'HACCP', route: haccpIndex, roles: ['EMPLOYE_VENTE'] },
        {
            name: 'Stocks Boutique',
            route: stockIndex,
            roles: ['EMPLOYE_VENTE'],
        },
    ],
    RESP_BOUTIQUE: [
        { name: 'Dashboard', route: dashboard, roles: ['RESP_BOUTIQUE'] },
        {
            name: 'Réceptions',
            route: receptionsIndex,
            roles: ['RESP_BOUTIQUE'],
        },
        {
            name: 'Commandes urgentes',
            route: commandesUrgentes.index,
            roles: ['RESP_BOUTIQUE'],
        },
        { name: 'Retours', route: returnsIndex, roles: ['RESP_BOUTIQUE'] },
        { name: 'Ventes', route: salesIndex, roles: ['RESP_BOUTIQUE'] },
        { name: 'Facturation', route: facturesIndex, roles: ['RESP_BOUTIQUE'] },
        { name: 'HACCP', route: haccpIndex, roles: ['RESP_BOUTIQUE'] },
        {
            name: 'Incidents',
            route: nonconformitesIndex,
            roles: ['RESP_BOUTIQUE'],
        },
        {
            name: 'Stocks Boutique',
            route: stockIndex,
            roles: ['RESP_BOUTIQUE'],
        },
    ],
    DIRECTION: [
        { name: 'Dashboard', route: dashboard, roles: ['DIRECTION'] },
        {
            name: 'Commandes urgentes',
            route: commandesUrgentes.index,
            roles: ['DIRECTION'],
        },
        { name: 'Reporting', route: reportingIndex, roles: ['DIRECTION'] },
    ],
    ADMIN: [
        { name: 'Dashboard', route: dashboard, roles: ['ADMIN'] },
        { name: 'Production', route: productionIndex, roles: ['ADMIN'] },
        { name: 'Stocks Labo', route: inventoryIndex, roles: ['ADMIN'] },
        { name: 'Stocks Boutique', route: stockIndex, roles: ['ADMIN'] },
        { name: 'Produits', route: productsIndex, roles: ['ADMIN'] },
        { name: 'Expéditions', route: expeditionsIndex, roles: ['ADMIN'] },
        { name: 'Facturation', route: facturesIndex, roles: ['ADMIN'] },
        { name: 'Réceptions', route: receptionsIndex, roles: ['ADMIN'] },
        { name: 'Retours', route: returnsIndex, roles: ['ADMIN'] },
        { name: 'Ventes', route: salesIndex, roles: ['ADMIN'] },
        { name: 'HACCP', route: haccpIndex, roles: ['ADMIN'] },
        {
            name: 'Incidents',
            route: nonconformitesIndex,
            roles: ['ADMIN'],
        },
        { name: 'Reporting', route: reportingIndex, roles: ['ADMIN'] },
        { name: 'Admin', route: adminIndex, roles: ['ADMIN'] },
    ],
};

function initials(name?: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const hasRole = (...roles: Role[]): boolean =>
        roles.includes(user?.role ?? ('' as Role));
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const navigation = useMemo(() => {
        const seen = new Set<string>();

        return Object.values(navigationByRole)
            .flat()
            .filter((item) => {
                if (seen.has(item.name)) {
return false;
}

                if (!hasRole(...item.roles)) {
return false;
}

                seen.add(item.name);

                return true;
            });
    }, [user?.role]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen || moreOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen, moreOpen]);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSidebarOpen(false);
                setMoreOpen(false);
            }
        };
        document.addEventListener('keydown', fn);

        return () => document.removeEventListener('keydown', fn);
    }, []);

    const navigate = (url: string) => {
        setSidebarOpen(false);
        setMoreOpen(false);
        router.visit(url);
    };

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(logout.url());
    };

    const entityName = user?.entity?.nom ?? `Entité #${user?.entity_id}`;
    const visibleMobileItems = navigation.slice(0, MOBILE_VISIBLE);
    const overflowMobileItems = navigation.slice(MOBILE_VISIBLE);
    const hasOverflow = overflowMobileItems.length > 0;
    const activeInOverflow = overflowMobileItems.some(
        (item) => currentPath === item.route.url(),
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
            <ToastContainer />
            {/* <FlashMessage /> */}

            {/* HEADER */}
            <header className="al-header">
                <div className="al-header__left">
                    <button
                        type="button"
                        className="al-hamburger lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir la navigation"
                    >
                        <Menu size={20} strokeWidth={1.5} />
                    </button>
                    <span className="app-header-brand">
                        LE <em>MAEVA</em>
                    </span>
                </div>

                <div className="al-header__right">
                    <div
                        className="app-header-user"
                        id="header-user-pill"
                        style={{ display: 'none' }}
                    >
                        <div className="app-header-avatar">
                            {user ? initials(user.nom) : '?'}
                        </div>
                        <span className="app-header-name">{user?.nom}</span>
                        <span className="app-header-sep">·</span>
                        <span className="app-header-entity">{entityName}</span>
                        <span className="app-header-role">{user?.role}</span>
                    </div>
                    <form
                        method="post"
                        action={logout.url()}
                        onSubmit={handleLogout}
                    >
                        <button type="submit" className="btn-logout">
                            <Power size={18} strokeWidth={1.5} />
                            <span className="hidden sm:inline">
                                Déconnexion
                            </span>
                        </button>
                    </form>
                </div>
            </header>

            {/* SIDEBAR */}
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed top-16 bottom-0 left-0 z-40 flex w-72 transform flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
                aria-label="Sidebar"
            >
                {/* Close button - mobile only */}
                <button
                    type="button"
                    className="absolute top-3 right-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Fermer"
                >
                    <X size={18} />
                </button>

                {/* Navigation groupée */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <nav className="space-y-5">
                        {NAV_GROUPS.map((group) => {
                            const groupItems = navigation.filter((item) =>
                                group.items.includes(item.name),
                            );

                            if (groupItems.length === 0) {
return null;
}

                            return (
                                <div key={group.label}>
                                    <p className="mb-1 px-3 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                                        {group.label}
                                    </p>
                                    <div className="space-y-0.5">
                                        {groupItems.map((item) => {
                                            const isActive =
                                                currentPath ===
                                                item.route.url();

                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            item.route.url(),
                                                        )
                                                    }
                                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    } `}
                                                >
                                                    <span
                                                        className={
                                                            isActive
                                                                ? 'text-blue-600'
                                                                : 'text-gray-400'
                                                        }
                                                    >
                                                        {NAV_ICONS[
                                                            item.name
                                                        ] ?? (
                                                            <Circle size={18} />
                                                        )}
                                                    </span>
                                                    <span className="flex-1 text-left">
                                                        {item.name}
                                                    </span>
                                                    {isActive && (
                                                        <ChevronRight
                                                            size={14}
                                                            className="text-blue-400"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer */}
                <div className="mt-auto space-y-3 border-t border-gray-200 p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-2 py-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                            {user ? initials(user.nom) : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                                {user?.nom}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                                {entityName}
                            </p>
                        </div>
                    </div>
                    <form
                        method="post"
                        action={logout.url()}
                        onSubmit={handleLogout}
                    >
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-100"
                        >
                            <Power size={16} />
                            Déconnexion
                        </button>
                    </form>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="lg:pl-72">
                <main className="px-4 pt-20 pb-24 sm:px-6 lg:px-8">
                    <div className="">{children}</div>
                </main>
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white shadow-lg lg:hidden">
                <div className="flex h-16 items-stretch">
                    {visibleMobileItems.map((item) => {
                        const isActive = currentPath === item.route.url();

                        return (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => navigate(item.route.url())}
                                className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
                                    isActive
                                        ? 'text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                } `}
                                aria-label={item.name}
                            >
                                <span
                                    className={
                                        isActive
                                            ? 'text-blue-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    {NAV_ICONS[item.name] ?? (
                                        <Circle size={20} />
                                    )}
                                </span>
                                <span className="text-xs font-medium">
                                    {item.name}
                                </span>
                                {isActive && (
                                    <div className="absolute bottom-0 h-0.5 w-8 rounded-t-full bg-blue-600" />
                                )}
                            </button>
                        );
                    })}
                    {hasOverflow && (
                        <button
                            type="button"
                            onClick={() => setMoreOpen(true)}
                            className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 ${
                                activeInOverflow
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            } `}
                            aria-label="Plus de navigation"
                        >
                            <span className="relative">
                                <Menu
                                    size={20}
                                    className={
                                        activeInOverflow
                                            ? 'text-blue-600'
                                            : 'text-gray-400'
                                    }
                                />
                                {activeInOverflow && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
                                )}
                            </span>
                            <span className="text-xs font-medium">Plus</span>
                            {activeInOverflow && (
                                <div className="absolute bottom-0 h-0.5 w-8 rounded-t-full bg-blue-600" />
                            )}
                        </button>
                    )}
                </div>
            </nav>

            {/* MOBILE OVERFLOW DRAWER */}
            {moreOpen && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMoreOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="animate-slide-up fixed right-0 bottom-0 left-0 z-50 rounded-t-2xl bg-white shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Plus de navigation"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="h-1 w-12 rounded-full bg-gray-200" />
                        </div>
                        <div className="px-4 pt-2 pb-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Navigation
                                </h3>
                                <button
                                    type="button"
                                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100"
                                    onClick={() => setMoreOpen(false)}
                                    aria-label="Fermer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {NAV_GROUPS.map((group) => {
                                    const groupItems =
                                        overflowMobileItems.filter((item) =>
                                            group.items.includes(item.name),
                                        );

                                    if (groupItems.length === 0) {
return null;
}

                                    return (
                                        <div key={group.label}>
                                            <p className="mb-1 px-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                                                {group.label}
                                            </p>
                                            <div className="space-y-0.5">
                                                {groupItems.map((item) => {
                                                    const isActive =
                                                        currentPath ===
                                                        item.route.url();

                                                    return (
                                                        <button
                                                            key={item.name}
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    item.route.url(),
                                                                )
                                                            }
                                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                                                                isActive
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                            } `}
                                                        >
                                                            <span
                                                                className={
                                                                    isActive
                                                                        ? 'text-blue-600'
                                                                        : 'text-gray-400'
                                                                }
                                                            >
                                                                {NAV_ICONS[
                                                                    item.name
                                                                ] ?? (
                                                                    <Circle
                                                                        size={
                                                                            20
                                                                        }
                                                                    />
                                                                )}
                                                            </span>
                                                            <span className="flex-1 text-left">
                                                                {item.name}
                                                            </span>
                                                            {isActive && (
                                                                <ChevronRight
                                                                    size={16}
                                                                    className="text-blue-500"
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`

            /* HEADER - Original design with your colors */
                .al-header {
                    position: fixed; top: 0; left: 0; right: 0;
                    z-index: 50;
                    height: var(--header-h);
                    background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-2) 100%);
                    border-bottom: 1px solid rgba(255,255,255,0.055);
                    box-shadow: 0 2px 20px rgba(0,0,0,0.28);
                    display: flex; align-items: center;
                    justify-content: space-between;
                    padding: 0 1rem;
                    gap: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .al-header::after {
                    content: ''; position: absolute;
                    left: 0; top: 8px; bottom: 8px; width: 3px;
                    border-radius: 0 3px 3px 0;
                    background: linear-gradient(180deg, var(--blue-lt), var(--orange));
                    opacity: 0.7;
                }
                .al-header__left  { display: flex; align-items: center; gap: 0.75rem; }
                .al-header__right { display: flex; align-items: center; gap: 0.5rem; }

                .app-header-brand {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 700;
                    font-size: 1.4rem;
                    letter-spacing: 0.08em;
                    background: linear-gradient(135deg, #ffffff 0%, #d4d9ff 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .app-header-brand em {
                    font-style: normal;
                    font-weight: 800;
                    color: #f5924a;
                    background: none;
                    -webkit-background-clip: unset;
                    background-clip: unset;
                }

                .al-hamburger {
                    display: flex; align-items: center; justify-content: center;
                    width: 36px; height: 36px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: var(--radius-sm);
                    color: rgba(255,255,255,0.85);
                    cursor: pointer;
                    transition: background var(--transition-fast), transform var(--transition-fast);
                    -webkit-tap-highlight-color: transparent;
                }
                .al-hamburger:hover  { background: rgba(255,255,255,0.15); }
                .al-hamburger:active { transform: scale(0.9); }

                .app-header-user {
                    display: flex; align-items: center;
                    gap: 0.5rem;
                    background: rgba(255,255,255,0.07);
                    padding: 0.25rem 0.75rem 0.25rem 0.4rem;
                    border-radius: 40px;
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(4px);
                }
                .app-header-avatar {
                    width: 30px; height: 30px;
                    background: linear-gradient(135deg, var(--blue), var(--blue-lt));
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 0.7rem;
                    color: white;
                    box-shadow: var(--shadow-sm);
                }
                .app-header-name, .app-header-entity, .app-header-role {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.9);
                }
                .app-header-role {
                    background: rgba(255,255,255,0.12);
                    padding: 0.1rem 0.4rem;
                    border-radius: 20px;
                    font-size: 0.65rem;
                    font-weight: 600;
                }
                .app-header-sep { color: rgba(255,255,255,0.4); font-size: 0.75rem; }

                .btn-logout {
                    display: flex; align-items: center; gap: 0.45rem;
                    background: rgba(232,116,42,0.18);
                    border: 1px solid rgba(232,116,42,0.4);
                    padding: 0.3rem 0.85rem;
                    border-radius: 40px;
                    font-weight: 500;
                    font-size: 0.75rem;
                    color: #f5924a;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .btn-logout:hover {
                    background: var(--orange);
                    border-color: var(--orange);
                    color: white;
                    transform: translateY(-1px);
                }
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

export default AppLayout;
