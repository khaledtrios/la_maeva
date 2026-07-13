// Types pour le système multi-tenant Boutique (auto-inscription + validation Super Admin)
// Alignés sur App\Enums\StoreStatus et les payloads Inertia des contrôleurs Store/SuperAdmin

export type StoreStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface StoreOwner {
    name: string;
    email: string;
}

/**
 * Boutique telle que renvoyée par SuperAdmin\StoreManagementController::index
 */
export interface Store {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    siret: string | null;
    status: StoreStatus;
    status_label: string;
    status_color: string;
    status_reason: string | null;
    status_changed_at: string | null; // ISO8601
    created_at: string; // ISO8601
    owner: StoreOwner | null;
}

/**
 * Super Admin connecté (prop partagée superAdminAuth.superAdmin)
 */
export interface SuperAdmin {
    id: number;
    name: string;
    email: string;
}

/**
 * Résumé boutique utilisé par Store/Dashboard (Phase 1 placeholder)
 */
export interface StoreSummary {
    id: number;
    name: string;
}

/**
 * Utilisateur boutique connecté (prop partagée storeAuth.storeUser)
 */
export interface StoreUser {
    id: number;
    name: string;
    email: string;
    role: string; // 'STORE_ADMIN'
    store: {
        id: number;
        name: string;
        status: StoreStatus;
    };
}
