// Types globaux pour l'application LE MAEVA
// Tous les types sont alignés sur les modèles Eloquent Laravel

export type Role =
    | 'ADMIN'
    | 'DIRECTION'
    | 'RESP_LABO'
    | 'EMPLOYE_LABO'
    | 'RESP_BOUTIQUE'
    | 'EMPLOYE_VENTE';

export type EntityType = 'LABO' | 'BOULANGERIE';

export type ExpeditionStatut = 'BROUILLON' | 'ENVOYEE' | 'RECUE';
export type ReceptionStatut = 'EN_ATTENTE' | 'CONFIRMEE';
export type NettoyageStatut = 'EN_COURS' | 'VALIDE';
export type NcStatut = 'OUVERTE' | 'RESOLUE';
export type CategorieControle = 'AMBIANT' | 'FRAIS' | 'SURGELE';
export type FactureStatut = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';
export type PeriodeType = 'SEMAINE' | 'MOIS' | 'ANNEE' | 'CUSTOM';

export interface Entity {
    id: number;
    type: EntityType;
    nom: string;
    adresse: string | null;
    logo?: string | null;
    logo_url?: string | null;
}

export interface AuthUser {
    id: number;
    nom: string;
    role: Role;
    entity_id: number;
    entity: Entity;
}

export interface Category {
    id: number;
    nom: string;
}

export interface Ingredient {
    id: number;
    nom: string;
    unite: string | null;
    prix_unitaire: number | null;
}

export interface Product {
    id: number;
    category_id: number;
    category: Category;
    nom: string;
    code: string | null;
    prix_vente: number | null;
    cout_revient: number | null;
    dlc: number | null; // Durée de vie en jours (DLC = production date + dlc)
}

export interface RecipeLine {
    id: number;
    product_id: number;
    ingredient_id: number;
    ingredient: Ingredient;
    quantite: number;
}

export interface StockBalance {
    // Clé composite: (entity_id, ingredient_id, dlc, lot_number) pour ingrédients
    // OU (entity_id, product_id, dlc, lot_number) pour produits
    entity_id: number;
    ingredient_id: number | null; // null pour produits finis
    product_id: number | null; // null pour ingrédients
    dlc: string | null; // Date DLC (YYYY-MM-DD)
    lot_number: string | null;
    quantite: number;
    ingredient?: Ingredient | null;
    product?: Product | null;
    entity: Entity;
    expedition_line_id?: number | null;
    production_id?: number | null; // traçabilité vers la production source
    notes?: string | null;
}

export type StockMovementType =
    | 'ENTREE'
    | 'SORTIE'
    | 'AJUSTEMENT'
    | 'ADJUSTMENT_IN'
    | 'WASTE';

export interface StockMovement {
    id: number;
    entity_id: number;
    ingredient_id: number | null; // pour ingrédients labo
    product_id: number | null; // pour produits finis boulangerie
    type: StockMovementType;
    quantite: number; // positif pour entrée, négatif pour sortie
    dlc: string | null; // Date DLC (YYYY-MM-DD)
    lot_number: string | null;
    provenance: string | null;
    reference: string | null;
    notes: string | null;
    created_by: number;
    production_id: number | null; // traçabilité vers la production source
    expedition_line_id: number | null; // traçabilité vers l'expédition d'origine
    reference_type: string | null; // 'vente_jour', 'adjustment', etc.
    reference_id: number | null;
    movement_date: string; // date du mouvement (YYYY-MM-DD)
    created_at: string;
    ingredient?: Ingredient | null;
    product?: Product | null;
    creator?: { id: number; nom: string } | null;
    production?: { id: number } | null;
    expeditionLine?: { id: number } | null;
}

export interface InventoryItem {
    id: number;
    entity_id: number;
    ingredient_id: number;
    ingredient: Ingredient;
    quantite: number;
    valid_quantity: number;    // quantité avec DLC > aujourd'hui
    expired_quantity: number;  // quantité avec DLC <= aujourd'hui
    seuil_minimum: number | null;
    stock_max: number | null;
    is_low_stock: boolean;
    is_high_stock: boolean;
}

/**
 * Ligne d'ajustement pour l'édition inline des stocks
 */
export interface StockAdjustmentRow {
    ingredient_id: number;
    adjustment: number;   // valeur signée (+ ou -)
    note?: string;        // note optionnelle
    isDirty: boolean;     // si l'utilisateur a modifié
}

export interface Production {
    id: number;
    entity_id: number;
    product_id: number;
    product: Product & { category: Category };
    quantite: number;
    quantite_pertes: number;
    lot: string | null;
    date: string;
    created_by: number;
    creator: { id: number; nom: string } | null;
}

// Type pour une ligne du tableau de production (avec infos de stock)
export interface ProductionRowData {
    product_id: number;
    quantite: number;
    quantite_pertes: number;
    lot: string;
    isModified: boolean;
    productionId?: number;
    stock_info: {
        disponible: number;
        ideal_min: number;
        commandes_urgentes: number;
        en_alerte: boolean;
        a_commander: number;
    };
}

// Type pour un item complet dans le tableau (produit + row data)
export interface ProduitComplet {
    product: Product & { category: Category };
    row: ProductionRowData;
}

export interface PlanProduction {
    id: number;
    entity_id: number;
    date: string;
    product_id: number;
    product?: Product & { category: Category };
    production_j_moins_1: number;
    total_stock_vendable: number;
    quantite_suggeree: number;
    quantite_objectif: number | null;
    statut_objectif: 'EN_ATTENTE' | 'OBJECTIF_VALIDE';
    id_responsable_validation: number | null;
    date_validation: string | null;
    avertissement: string | null;
    est_nouveau_produit: boolean;

    // Relations
    validateur?: { id: number; nom: string } | null;
    saisies?: Array<{
        id: number;
        product_id: number;
        quantite: number;
        heure_saisie: string;
        created_at: string;
    }>;
    dernieres_saisies?: Array<{
        id: number;
        product_id: number;
        quantite: number;
        heure_saisie: string;
        created_at: string;
        commentaire?: string | null;
        product?: Product;
        operateur?: { id: number; nom: string } | null;
        creator?: { id: number; nom: string } | null;
    }>;

    // Virtual/computed fields
    quantite_totale_produite?: number;
    reste_a_produire?: number;
    statut_progression?:
        | 'EN_ATTENTE'
        | 'A_PRODUIRE'
        | 'EN_COURS'
        | 'COMPLET'
        | 'SURPRODUCTION';
    ecart?: number;
    avertissement_badge?: string | null;
}

export interface ExpeditionLine {
    id: number;
    expedition_id: number;
    product_id: number;
    product: Product & { category: Category };
    production_id: number | null; // Lien vers le lot source (null = production implicite)
    quantite: number;
    dlc: string | null; // Date DLC calculée (YYYY-MM-DD)
    date_production: string | null; // Date de fabrication du lot
    lot_reference: string | null; // Référence du lot (source de production)
}

export interface Expedition {
    id: number;
    entity_id: number;
    boulangerie_id: number;
    boulangerie: Entity;
    date: string;
    statut: ExpeditionStatut;
    created_by: number;
    lines: ExpeditionLine[];
    reception?: Reception | null;
    entity?: Entity;
    creator?: { id: number; nom: string } | null;
}

export interface ReceptionLine {
    id: number;
    reception_id: number;
    expedition_line_id: number | null; // traçabilité vers la ligne d'expédition d'origine
    product_id: number;
    product: Product & { category: Category };
    qte_attendue: number;
    qte_recue: number | null;
    ecart: number | null;
    dlc: string | null; // DLC propagée depuis l'expédition (YYYY-MM-DD)
    date_production: string | null; // Date de fabrication du lot (traçabilité)
}

export interface Reception {
    id: number;
    expedition_id: number;
    expedition: Expedition & { lines: ExpeditionLine[]; entity: Entity };
    entity_id: number;
    date: string;
    statut: ReceptionStatut;
    lines: ReceptionLine[];
}

export interface VenteJour {
    id: number;
    entity_id: number;
    date: string;
    product_id: number;
    product: Product & { category: Category };
    qte_recue: number;
    qte_reste: number;
    qte_vendue: number;
}

export interface HaccpTemperature {
    id: number;
    entity_id: number;
    enceinte: string;
    temperature: number;
    date: string;
    created_by: number;
    creator: { id: number; nom: string } | null;
}

export type TacheNettoyage = {
    nom: string;
    fait: boolean;
};

export interface HaccpNettoyage {
    id: number;
    entity_id: number;
    date: string;
    taches_json: TacheNettoyage[];
    statut: NettoyageStatut;
    valide_par: number | null;
    validateur?: { id: number; nom: string } | null;
}

export interface HaccpControleReception {
    id: number;
    entity_id: number;
    fournisseur: string;
    bl_number: string | null;
    categorie: CategorieControle;
    temperature: number | null;
    conforme: boolean;
    commentaire: string | null;
    date: string;
    created_by: number;
    creator?: { id: number; nom: string } | null;
}

export interface HaccpNonConformite {
    id: number;
    entity_id: number;
    type: string;
    description: string;
    action: string | null;
    statut: NcStatut;
    date: string;
    created_by: number;
    creator?: { id: number; nom: string } | null;
}

export interface FactureLigne {
    id: number;
    facture_id: number;
    expedition_id: number;
    expedition_line_id: number;
    product_id: number;
    product: Product & { category: Category };
    quantite: number;
    prix_unitaire: number;
    montant: number;
    dlc: string | null;
    lot_reference: string | null;
}

export interface Facture {
    id: number;
    numero: string;
    entity_id: number;
    boulangerie_id: number;
    boulangerie: Entity;
    periode_type: PeriodeType;
    date_debut: string;
    date_fin: string;
    montant_total: number;
    statut: FactureStatut;
    generation_auto: boolean;
    generated_by: number | null;
    generator?: { id: number; nom: string } | null;
    validated_by: number | null;
    validator?: { id: number; nom: string } | null;
    paid_at: string | null;
    payer?: { id: number; nom: string } | null;
    notes: string | null;
    lignes: FactureLigne[];
    created_at: string;
}

export interface FactureSetting {
    key: string;
    value: string;
    description: string | null;
}

// ============================================
// TYPES POUR RETOURS PRODUITS
// ============================================

// Type de retour (Étape 1)
export type ReturnType = 'RECEPTION' | 'FIN_COMMERCE';
export type ReturnOrigine = 'auto' | 'manuel' | 'auto+manuel';

export type ReturnCause =
    | 'DEFECTUEUX'
    | 'INVENDU_EXPIRE'
    | 'erreur_livraison'
    | 'autre'
    | 'perime';
export type ReturnStatus =
    | 'BROUILLON'
    | 'ENVOYEE'
    | 'RECEUE_PAR_LABO'
    | 'TRAITEE'
    | 'CLOTUREE'
    | 'REJETEE';
export type TreatmentAction =
    | 'brule'
    | 'jete'
    | 'recyclage'
    | 'retour_stock'
    | 'autre';

export interface ReturnPhoto {
    id: number;
    return_id: number;
    return_line_id: number | null;
    photo_path: string;
    uploaded_by: number;
    created_at: string;
    url: string; // URL complète (asset)
    isPerLine: boolean; // photo liée à une ligne ou globale
    uploader?: { id: number; nom: string } | null;
}

export interface ReturnLine {
    id: number;
    return_id: number;
    reception_line_id: number | null;
    product_id: number;
    product: Product & { category: Category };
    quantite_attendue: number;
    quantite_retournee: number;
    dlc: string | null; // Date DLC (YYYY-MM-DD)
    lot_reference: string | null;
    cause: ReturnCause;
    causeLabel: string; // "Défectueux" / "DLC expiré"
    notes: string | null;
    photos?: ReturnPhoto[];
    dlcBadgeHtml: string; // HTML badge (rouge/vert)
    isDlcExpired(): boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductReturn {
    id: number;
    reference: string; // Ex: RET-2026-0001
    reception_id: number | null;
    expedition_line_id: number;
    entity_id: number; // boutique créatrice
    labo_entity_id: number; // labo destinataire
    type: ReturnType; // RECEPTION | FIN_COMMERCE (Étape 1)
    origine: ReturnOrigine; // auto | manuel | auto+manuel (Étape 1)
    typeLabel: string; // Libellé du type
    typeClass: string; // Classe CSS badge type
    cause: ReturnCause;
    bl_number: string | null;
    bl_fifo: string | null;
    dlc_display: string | null; // Date DLC (YYYY-MM-DD)
    product_id: number;
    product: Product & { category: Category };
    quantite_attendue: number;
    quantite_retournee: number;
    notes: string | null;
    status: ReturnStatus;
    statusLabel: string; // Libellé statut
    statusClass: string; // Classe CSS badge
    causeLabel: string; // Libellé cause
    causeClass: string; // Classe CSS badge cause
    labo_confirmed: boolean;
    confirmed_at: string | null;
    received_by: number | null;
    receiver?: { id: number; nom: string } | null;
    treatment_action: string | null;
    treatmentActionLabel: string | null; // "🔥 Brûlé", etc.
    treatment_notes: string | null;
    processed_by: number | null;
    processed_at: string | null;
    processor?: { id: number; nom: string } | null;
    created_by: number;
    creator?: { id: number; nom: string } | null;
    lines: ReturnLine[];
    photos: ReturnPhoto[];
    entity: Entity;
    laboEntity: Entity;
    expeditionLine?: {
        id: number;
        expedition_id: number;
        product_id: number;
        product: Product;
        dlc: string | null;
        lot_reference: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;

    // Helpers
    canBeConfirmed(): boolean;
    canBeProcessed(): boolean;
    canBeCancelled(): boolean;
}

// Props partagées via HandleInertiaRequests (disponibles dans toutes les pages)
export interface SharedProps {
    auth: { user: AuthUser | null };
    flash: { success: string | null; error: string | null };
    errors: Record<string, string[]>;
}

// Helper pour typer les props d'une page Inertia
export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & SharedProps;

// ============================================
// TYPES POUR STOCK BOULANGERIE
// ============================================

/**
 * Stock agrégé par produit (résumé)
 */
export interface StockByProduct {
    product_id: number;
    product_nom: string;
    product_code: string | null;
    category_nom: string;
    total_quantity: number;
    valid_quantity: number;    // quantité avec DLC > aujourd'hui
    expired_quantity: number;  // quantité avec DLC <= aujourd'hui
    earliest_dlc: string | null;
    latest_dlc: string | null;
    cout_revient: number | null; // coût de revient (jointure products)
}

/**
 * Lot détaillé (pour ajustement)
 */
export interface DetailedLot {
    id?: number | null;
    entity_id: number;
    product_id: number;
    product_nom: string;
    product_code: string;
    category_nom: string;
    quantite: number;
    dlc: string | null;
    lot_number: string | null;
}

/**
 * Alerte DLC (lots expirant bientôt ou expirés)
 */
export interface DlcAlert {
    id?: number | null;
    product_id: number;
    product_nom: string;
    quantite: number;
    dlc: string;
    lot_number: string | null;
    days_remaining?: number; // pour expiring_soon
    days_expired?: number; // pour expired
}

/**
 * Résumé stock boulangerie (pour dashboard)
 */
export interface StockSummary {
    total_quantity: number;
    total_value: number;
}

/**
 * Données boutique pour Dashboard
 */
export interface BoutiqueData {
    receptions_en_attente: number;
    expired_count: number;
    expiring_soon_count: number;
    stock_summary: StockSummary;
}

/**
 * Filtres pour mouvements stock
 */
export interface StockMovementsFilters {
    date_from: string;
    date_to: string;
    product_id?: number | null;
    type?:
        | 'ENTREE'
        | 'SORTIE'
        | 'AJUSTEMENT'
        | 'ADJUSTMENT_IN'
        | 'WASTE'
        | null;
}

/**
 * Alerte de stock (pour le tableau de production)
 * Correspond à un produit dont le stock disponible est insuffisant
 */
export interface StockAlert {
    product_id: number;
    nom: string;
    stock_disponible: number;
    commandes_attente: number;
    manque: number;
    // Optionnels selon le service
    brouillon?: number;
}

/**
 * Alerte de commandes urgentes non satisfaites
 * Produit pour lequel les commandes urgentes dépassent le stock disponible
 */
export interface CommandeUrgenteAlerte {
    product_id: number;
    nom: string;
    stock_disponible: number;
    commandes_urgentes: number;
    manque: number;
}

/**
 * Ligne de commande urgente (version simplifiée pour liste)
 */
export interface CommandeUrgenteLineSimple {
    id: number;
    product_id: number;
    product_nom: string;
    quantite: number;
}

/**
 * Commande urgente dans la liste (pour la page Production)
 */
export interface CommandeUrgenteListItem {
    id: number;
    reference: string;
    entity: string;
    date: string;
    statut: string;
    priorite: number;
    notes: string | null;
    lines: CommandeUrgenteLineSimple[];
    total_quantite: number;
    creator: string;
    stock_suffisant: boolean;
    shortages: Array<{
        product_nom: string;
        demande: number;
        disponible: number;
        manque: number;
    }>;
}
