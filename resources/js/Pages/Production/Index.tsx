import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import {
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    X,
    ArrowDown,
    Settings,
    TrendingUp,
    TrendingDown,
    Package as PackageIcon,
    AlertCircle,
    AlertTriangle,
    Save,
    RefreshCw,
    Pencil,
    PlusCircle,
    MapPin,
    ChevronUp,
    ChevronDown,
    Truck,
    CheckCircle,
    Eye,
    Calendar,
    Package,
    Search,
} from 'lucide-react';
import {
    batch as batchRoute,
    index,
    store,
    update,
    destroy,
} from '@/routes/production';
import commandesUrgentesRoutes from '@/routes/commandes-urgentes';
import type {
    Production,
    Product,
    StockAlert,
    CommandeUrgenteAlerte,
    CommandeUrgenteListItem,
} from '@/types';

interface ProductionIndexProps {
    produitsComplets: Array<{
        product: Product & { category: { id: number; nom: string } };
        row: {
            quantite: number;
            quantite_pertes: number;
            lot: string;
            isModified: boolean;
            stock_info: {
                disponible: number;
                ideal_min: number;
                commandes_urgentes: number;
                en_alerte: boolean;
                a_commander: number;
            };
            suggestion: number | null;
        };
        production?: Production | null;
    }>;
    summary: Array<{
        product: Product & { category: { id: number; nom: string } };
        total_produit: number;
        total_pertes: number;
        quantite_nette: number;
    }>;
    date: string;
    stockAlerts: StockAlert[];
    produitsEnAlerte?: CommandeUrgenteAlerte[];
    commandesUrgentes?: CommandeUrgenteListItem[];
    commandesEnAlerte?: CommandeUrgenteListItem[];
}

export default function ProductionIndex({
    produitsComplets: produitsCompletsProp,
    summary: summaryProp,
    date: initialDate,
    stockAlerts = [],
    produitsEnAlerte = [],
    commandesUrgentes = [],
    commandesEnAlerte = [],
}: ProductionIndexProps) {
    const { hasRole } = useAuth();
    // Initialiser Pusher pour le temps réel
    const { pusher } = useRealtime();
    const [date, setDate] = useState(initialDate);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteProduction, setDeleteProduction] = useState<Production | null>(
        null,
    );
    // Commandes urgentes: gestion expansion et modals
    const [expandedCommandeIds, setExpandedCommandeIds] = useState<Set<number>>(
        new Set(),
    );
    const [takeModalOpen, setTakeModalOpen] = useState<number | null>(null);
    const [isTaking, setIsTaking] = useState<number | null>(null);
    const [isCreatingBl, setIsCreatingBl] = useState<number | null>(null);
    // 🇵🇸 Quick production: quantité à produire et pertes pour chaque produit en alerte
    const [quickProdQuantities, setQuickProdQuantities] = useState<
        Record<number, number>
    >({});
    const [quickProdPertes, setQuickProdPertes] = useState<
        Record<number, number>
    >({});
    const [quickProducing, setQuickProducing] = useState<number | null>(null);

    // Initialiser les quantités et pertes à partir des alertes
    useEffect(() => {
        const qtyInit: Record<number, number> = {};
        const pertesInit: Record<number, number> = {};
        produitsEnAlerte.forEach((alert) => {
            qtyInit[alert.product_id] = alert.manque;
            pertesInit[alert.product_id] = 0; // pertes par défaut = 0
        });
        setQuickProdQuantities(qtyInit);
        setQuickProdPertes(pertesInit);
    }, [produitsEnAlerte]);

    // Écoute des événements temps réel (commandes urgentes)
    useEffect(() => {
        const handleCommandeCreated = () => {
            console.log('[Production] Nouvelle commande urgente détectée');
            router.reload({
                only: ['commandesUrgentes', 'produitsEnAlerte'],
                preserveState: true,
                preserveScroll: true,
            });
        };

        const handleCommandeStatusUpdated = () => {
            console.log('[Production] Statut de commande mis à jour');
            router.reload({
                only: ['commandesUrgentes'],
                preserveState: true,
                preserveScroll: true,
            });
        };

        window.addEventListener(
            'commande-urgente-created',
            handleCommandeCreated,
        );
        window.addEventListener(
            'commande-urgente-status-updated',
            handleCommandeStatusUpdated,
        );

        return () => {
            window.removeEventListener(
                'commande-urgente-created',
                handleCommandeCreated,
            );
            window.removeEventListener(
                'commande-urgente-status-updated',
                handleCommandeStatusUpdated,
            );
        };
    }, [router]);

    // Toggle expansion d'une commande
    const toggleCommandeExpand = (id: number) => {
        setExpandedCommandeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Handler "Prendre en charge"
    const handleTakeCommande = (commandeId: number) => {
        setIsTaking(commandeId);
        router.post(
            commandesUrgentesRoutes.take.url(commandeId),
            {},
            {
                onFinish: () => {
                    setIsTaking(null);
                    setTakeModalOpen(null);
                },
                onError: () => setIsTaking(null),
            },
        );
    };

    // Handler "Créer BL"
    const handleCreateBl = (commandeId: number) => {
        setIsCreatingBl(commandeId);
        router.visit(commandesUrgentesRoutes.createBl.url(commandeId), {
            onFinish: () => setIsCreatingBl(null),
        });
    };

    // Statut display helpers
    const getStatutInfo = (statut: string) => {
        switch (statut) {
            case 'ENVOYEE':
                return {
                    label: 'En attente',
                    color: '#3b82f6',
                    bg: 'rgba(59, 130, 246, 0.1)',
                };
            case 'PRISE_EN_CHARGE':
                return {
                    label: 'Prise en charge',
                    color: '#f59e0b',
                    bg: 'rgba(245, 158, 11, 0.1)',
                };
            case 'EXPEDIEE':
                return {
                    label: 'Expédiée',
                    color: '#10b981',
                    bg: 'rgba(16, 185, 129, 0.1)',
                };
            default:
                return {
                    label: statut,
                    color: '#6b7280',
                    bg: 'rgba(107, 114, 128, 0.1)',
                };
        }
    };

    const getPrioriteInfo = (priorite: number) => {
        if (priorite >= 4) {
            return {
                label: `P${priorite}`,
                color: '#dc2626',
                bg: 'rgba(220, 38, 38, 0.1)',
            };
        }
        if (priorite === 3) {
            return {
                label: `P${priorite}`,
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)',
            };
        }
        return {
            label: `P${priorite}`,
            color: '#6b7280',
            bg: 'rgba(107, 114, 128, 0.1)',
        };
    };

    // Handler pour changement quantité
    const handleQuickProdChange = (productId: number, value: string) => {
        const qty = parseInt(value) || 0;
        setQuickProdQuantities((prev) => ({
            ...prev,
            [productId]: qty,
        }));
    };

    // Handler pour changement pertes
    const handleQuickPertesChange = (productId: number, value: string) => {
        const pertes = parseInt(value) || 0;
        setQuickProdPertes((prev) => ({
            ...prev,
            [productId]: pertes,
        }));
    };

    // Handler pour valider la production rapide
    const handleQuickProduce = async (productId: number, manque: number) => {
        const qteAProduire = quickProdQuantities[productId] ?? manque;
        const pertes = quickProdPertes[productId] ?? 0;

        if (qteAProduire <= 0) {
            alert('Veuillez entrer une quantité valide.');
            return;
        }

        // Validation : pertes ne peut pas dépasser la quantité produite
        if (pertes > qteAProduire) {
            alert('Les pertes ne peuvent pas dépasser la quantité produite.');
            return;
        }

        // ✅ Récupérer la production existante depuis produitsComplets
        const existingRow = produitsComplets.find(
            (p) => p.product.id === productId,
        )?.row;

        const finalQuantite = (existingRow?.quantite ?? 0) + qteAProduire;
        const finalPertes = (existingRow?.quantite_pertes ?? 0) + pertes;

        setQuickProducing(productId);
        try {
            await router.post(
                store.url(),
                {
                    product_id: productId,
                    quantite: finalQuantite,
                    quantite_pertes: finalPertes,
                    lot: '',
                    date: date,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        // Réinitialiser les champs pour ce produit
                        setQuickProdQuantities((prev) => {
                            const next = { ...prev };
                            delete next[productId];
                            return next;
                        });
                        setQuickProdPertes((prev) => {
                            const next = { ...prev };
                            delete next[productId];
                            return next;
                        });
                        router.get(
                            index.url(),
                            { date: date },
                            { preserveState: true, preserveScroll: true },
                        );
                    },
                    onError: (errors) => {
                        console.error(errors);
                        alert(
                            'Erreur lors de la production : ' +
                                (errors.message || JSON.stringify(errors)),
                        );
                    },
                },
            );
        } finally {
            setQuickProducing(null);
        }
    };

    // Référence pour garder les valeurs originales venant du serveur (pour reset)
    const originalProduitsRef =
        useRef<ProductionIndexProps['produitsComplets']>(produitsCompletsProp);

    // État local étendu avec les champs de saisie incrémentale
    type RowExtended = ProductionIndexProps['produitsComplets'][0] & {
        inputQuantite: number;
        inputPertes: number;
        correctMode: boolean;
    };
    const [produitsComplets, setProduitsComplets] = useState<RowExtended[]>([]);

    // ── Search ──
    const [search, setSearch] = useState('');
    const filteredProduits = useMemo(
        () =>
            !search
                ? produitsComplets
                : produitsComplets.filter((item) =>
                      item.product.nom
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                  ),
        [produitsComplets, search],
    );

    // Modal pour ajouter un produit (hors tableau)
    const [addModalOpen, setAddModalOpen] = useState(false);
    const addForm = useForm({
        product_id: '',
        quantite: '',
        quantite_pertes: '',
        lot: '',
        date: date,
    });

    // Initialisation depuis les props + mise à jour de la référence originale
    useEffect(() => {
        setProduitsComplets(
            produitsCompletsProp.map((p) => ({
                ...p,
                inputQuantite: 0,
                inputPertes: 0,
                correctMode: false,
            })),
        );
        originalProduitsRef.current = produitsCompletsProp;
    }, [produitsCompletsProp]);

    // Date change → recharger page
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);
        router.get(
            index.url(),
            { date: newDate },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Appliquer la suggestion comme quantité d'input
    const applySuggestion = (productId: number, suggestion: number) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                return {
                    ...item,
                    inputQuantite: suggestion,
                    correctMode: false,
                    row: { ...item.row, isModified: true },
                };
            }),
        );
    };

    // Modification d'une ligne (lot uniquement via updateRow)
    const updateRow = (
        productId: number,
        updates: Partial<{ lot: string }>,
    ) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                return {
                    ...item,
                    row: { ...item.row, ...updates, isModified: true },
                };
            }),
        );
    };

    // Mise à jour de l'input quantite (saisie en cours)
    const updateInputQuantite = (productId: number, val: number) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                return {
                    ...item,
                    inputQuantite: val,
                    row: { ...item.row, isModified: true },
                };
            }),
        );
    };

    // Mise à jour de l'input pertes (saisie en cours)
    const updateInputPertes = (productId: number, val: number) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                return {
                    ...item,
                    inputPertes: val,
                    row: { ...item.row, isModified: true },
                };
            }),
        );
    };

    // Toggle mode corriger / ajouter
    const toggleCorrectMode = (productId: number) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                const newMode = !item.correctMode;
                return {
                    ...item,
                    correctMode: newMode,
                    // En mode corriger : pré-remplir avec valeur actuelle serveur
                    inputQuantite: newMode ? item.row.quantite : 0,
                    inputPertes: newMode ? item.row.quantite_pertes : 0,
                };
            }),
        );
    };

    // Calcul des valeurs finales selon le mode
    const getFinalQuantite = (item: RowExtended): number => {
        if (item.correctMode) return item.inputQuantite;
        return item.row.quantite + item.inputQuantite;
    };

    const getFinalPertes = (item: RowExtended): number => {
        if (item.correctMode) return item.inputPertes;
        return item.row.quantite_pertes + item.inputPertes;
    };

    // Ajuster la quantité (+/-) sur l'input en cours
    const adjustQuantity = (productId: number, delta: number) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                const newInput = Math.max(0, item.inputQuantite + delta);
                return {
                    ...item,
                    inputQuantite: newInput,
                    row: { ...item.row, isModified: true },
                };
            }),
        );
    };

    // Sauvegarder une ligne spécifique
    const saveRow = async (productId: number) => {
        const item = produitsComplets.find((p) => p.product.id === productId);
        if (!item || !item.row.isModified) return;

        const finalQuantite = getFinalQuantite(item);
        const finalPertes = getFinalPertes(item);

        await router.post(
            batchRoute.url(),
            {
                date: date,
                productions: [
                    {
                        product_id: productId,
                        quantite: finalQuantite,
                        quantite_pertes: finalPertes,
                        lot: item.row.lot,
                    },
                ],
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setProduitsComplets((prev) =>
                        prev.map((p) =>
                            p.product.id === productId
                                ? {
                                      ...p,
                                      inputQuantite: 0,
                                      inputPertes: 0,
                                      correctMode: false,
                                      row: { ...p.row, isModified: false },
                                  }
                                : p,
                        ),
                    );
                },
            },
        );
    };

    // Sauvegarder tout
    const saveAll = async () => {
        const modifications = produitsComplets.filter((p) => p.row.isModified);

        if (modifications.length === 0) {
            alert('Aucune modification à enregistrer.');
            return;
        }

        await router.post(
            batchRoute.url(),
            {
                date: date,
                productions: modifications.map((p) => ({
                    product_id: p.product.id,
                    quantite: getFinalQuantite(p),
                    quantite_pertes: getFinalPertes(p),
                    lot: p.row.lot,
                })),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setProduitsComplets((prev) =>
                        prev.map((item) => ({
                            ...item,
                            inputQuantite: 0,
                            inputPertes: 0,
                            correctMode: false,
                            row: { ...item.row, isModified: false },
                        })),
                    );
                },
            },
        );
    };

    // Réinitialiser une ligne
    const resetRow = (productId: number) => {
        setProduitsComplets((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                return {
                    ...item,
                    inputQuantite: 0,
                    inputPertes: 0,
                    correctMode: false,
                    row: { ...item.row, isModified: false },
                };
            }),
        );
    };

    // Gestion ajout modal
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(store.url(), {
            onSuccess: () => {
                addForm.reset(
                    'product_id',
                    'quantite',
                    'quantite_pertes',
                    'lot',
                );
                setAddModalOpen(false);
                // Recharger la page pour voir la nouvelle ligne
                router.get(
                    index.url(),
                    { date: date },
                    { preserveState: true },
                );
            },
        });
    };

    // Calculs totaux
    const totalProduit = useMemo(
        () => summaryProp.reduce((acc, s) => acc + s.total_produit, 0),
        [summaryProp],
    );
    const totalPertes = useMemo(
        () => summaryProp.reduce((acc, s) => acc + s.total_pertes, 0),
        [summaryProp],
    );
    const totalNet = useMemo(
        () => summaryProp.reduce((acc, s) => acc + s.quantite_nette, 0),
        [summaryProp],
    );
    const pourcentagePertes =
        totalProduit > 0 ? Math.round((totalPertes / totalProduit) * 100) : 0;

    // Compter les lignes modifiées
    const modificationsCount = useMemo(
        () => produitsComplets.filter((p) => p.row.isModified).length,
        [produitsComplets],
    );

    // Date formatée
    const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="prod-page">
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Production</h1>
                    <p className="page-subtitle prod-date-label">{dateLabel}</p>
                </div>
                <div className="prod-header-actions">
                    <div className="prod-date-picker">
                        <CalendarIcon size={16} strokeWidth={1.5} />
                        <input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="prod-date-input"
                        />
                    </div>
                    {hasRole('ADMIN', 'RESP_LABO', 'EMPLOYE_LABO') && (
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="btn-primary"
                        >
                            <Plus size={16} strokeWidth={1.5} />
                            <span>Nouvelle production</span>
                        </button>
                    )}
                </div>
            </div>
            {/* STATS GLOBALES */}
            {summaryProp.length > 0 && (
                <div className="prod-stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--orange">
                            <PackageIcon size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total produit</div>
                            <div className="stat-value">{totalProduit}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--danger">
                            <TrendingDown size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Pertes</div>
                            <div className="stat-value stat-value--danger">
                                {totalPertes}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--success">
                            <TrendingUp size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Net produit</div>
                            <div className="stat-value stat-value--success">
                                {totalNet}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-icon--orange">
                            <AlertCircle size={22} strokeWidth={1.5} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Rendement</div>
                            <div className="stat-value">
                                {100 - pourcentagePertes}%
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ALERTES STOCK */}
            {/* {stockAlerts && stockAlerts.length > 0 && (
                <div className="alerts-section">
                    <div className="alerts-header">
                        <div className="alerts-icon">
                            <AlertTriangle size={18} strokeWidth={1.5} />
                        </div>
                        <span className="alerts-title">
                            Alertes stock – {stockAlerts.length} produit
                            {stockAlerts.length > 1 ? 's' : ''} en tension
                        </span>
                    </div>
                    <div className="alerts-list">
                        {stockAlerts.map((alert) => (
                            <div key={alert.product_id} className="alert-item">
                                <div className="alert-product">{alert.nom}</div>
                                <div className="alert-details">
                                    <span className="alert-label">
                                        Disponible:
                                    </span>
                                    <span className="alert-value">
                                        {alert.stock_disponible}
                                    </span>
                                    <span className="alert-label">
                                        Commandes:
                                    </span>
                                    <span className="alert-value">
                                        {alert.commandes_attente}
                                    </span>
                                    {alert.manque > 0 && (
                                        <span className="alert-shortage">
                                            Manque: {alert.manque}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )} */}
            {/* ALERTES COMMANDES URGENTES NON SATISFAITES */}
            {produitsEnAlerte && produitsEnAlerte.length > 0 && (
                <div className="alerts-section-alertes">
                    <div className="alerts-header-alertes">
                        <AlertTriangle size={18} strokeWidth={1.5} />
                        <span>
                            Commandes urgentes non satisfaites —{' '}
                            {produitsEnAlerte.length} produit
                            {produitsEnAlerte.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="alerts-list-alertes">
                        {produitsEnAlerte.map((alert) => (
                            <div
                                key={alert.product_id}
                                className="alert-item-alerte"
                            >
                                <span className="alert-product">
                                    {alert.nom}
                                </span>
                                <span className="alert-label">
                                    Stock dispo: {alert.stock_disponible}
                                </span>
                                <span className="alert-label">
                                    Commandées: {alert.commandes_urgentes}
                                    <div className="alert-manque">
                                        À produire: {alert.manque}
                                    </div>
                                </span>

                                <div className="alert-quick-prod">
                                    <div className="alert-quick-group">
                                        <span className="alert-quick-label">
                                            Produite
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="alert-quick-input"
                                            value={
                                                quickProdQuantities[
                                                    alert.product_id
                                                ] ?? alert.manque
                                            }
                                            onChange={(e) =>
                                                handleQuickProdChange(
                                                    alert.product_id,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                quickProducing ===
                                                alert.product_id
                                            }
                                            title="Quantité à produire"
                                        />
                                        <span className="alert-quick-label">
                                            pertes
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="alert-quick-input alert-quick-input--small"
                                            value={
                                                quickProdPertes[
                                                    alert.product_id
                                                ] ?? 0
                                            }
                                            onChange={(e) =>
                                                handleQuickPertesChange(
                                                    alert.product_id,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                quickProducing ===
                                                alert.product_id
                                            }
                                            title="Quantité de pertes"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className={`btn-alert-produce ${quickProducing === alert.product_id ? 'btn-loading' : ''}`}
                                        onClick={() =>
                                            handleQuickProduce(
                                                alert.product_id,
                                                alert.manque,
                                            )
                                        }
                                        disabled={
                                            quickProducing === alert.product_id
                                        }
                                    >
                                        {quickProducing === alert.product_id ? (
                                            <span className="spinner-small" />
                                        ) : (
                                            'Valider'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* COMMANDES URGENTES PRISES EN CHARGE */}
            {commandesUrgentes && commandesUrgentes.length > 0 && (
                <div className="commandes-urgentes-section">
                    <div className="section-header">
                        <div className="section-title">
                            <div
                                className="section-dot"
                                style={{ background: '#f59e0b' }}
                            />
                            <span>Commandes prises en charge</span>
                            <span className="section-badge">
                                {commandesUrgentes.length}
                            </span>
                        </div>
                    </div>

                    {/* Alerte globale si certaines commandes ont un stock insuffisant */}
                    {commandesEnAlerte && commandesEnAlerte.length > 0 && (
                        <div className="alert-zone-stock">
                            <div className="alert-zone-header">
                                <AlertTriangle size={16} strokeWidth={1.5} />
                                <span>
                                    {commandesEnAlerte.length} commande
                                    {commandesEnAlerte.length > 1
                                        ? 's'
                                        : ''}{' '}
                                    avec stock insuffisant — veuillez produire
                                    avant d'expédier
                                </span>
                            </div>
                            <div className="alert-zone-list">
                                {commandesEnAlerte.map((commande) => (
                                    <div
                                        key={commande.id}
                                        className="alert-zone-item"
                                    >
                                        <span className="alert-zone-ref">
                                            #{commande.id}
                                        </span>
                                        <span className="alert-zone-entity">
                                            {commande.entity}
                                        </span>
                                        <span className="alert-zone-shortage">
                                            {commande.shortages?.length ?? 0}{' '}
                                            produit(s) en manque
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="commandes-list">
                        {commandesUrgentes.map((commande) => {
                            const statutInfo = getStatutInfo(commande.statut);
                            const prioriteInfo = getPrioriteInfo(
                                commande.priorite,
                            );
                            const isExpanded = expandedCommandeIds.has(
                                commande.id,
                            );
                            const isLabo = hasRole(
                                'ADMIN',
                                'RESP_LABO',
                                'EMPLOYE_LABO',
                            );
                            const stockSuffisant = commande.stock_suffisant;

                            return (
                                <div
                                    key={commande.id}
                                    className="commande-row-card"
                                    style={{ marginBottom: '0.75rem' }}
                                >
                                    {/* En-tête de la commande - toujours visible */}
                                    <div
                                        className="commande-row-header"
                                        onClick={() =>
                                            toggleCommandeExpand(commande.id)
                                        }
                                    >
                                        <div className="commande-row-info">
                                            <div className="commande-row-title">
                                                <span className="commande-reference">
                                                    #{commande.id}
                                                </span>
                                                <span className="badge badge--warning badge-lg">
                                                    {prioriteInfo.label}
                                                </span>
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        background:
                                                            statutInfo.bg,
                                                        color: statutInfo.color,
                                                    }}
                                                >
                                                    {statutInfo.label}
                                                </span>
                                                {!stockSuffisant && (
                                                    <span className="badge badge--danger badge-lg">
                                                        <AlertTriangle
                                                            size={10}
                                                            strokeWidth={1.5}
                                                        />
                                                        Stock insuffisant
                                                    </span>
                                                )}
                                            </div>
                                            <div className="commande-row-meta">
                                                <span className="meta-item">
                                                    <MapPin
                                                        size={12}
                                                        strokeWidth={1.5}
                                                    />
                                                    {commande.entity}
                                                </span>
                                                <span className="meta-item">
                                                    <Calendar
                                                        size={12}
                                                        strokeWidth={1.5}
                                                    />
                                                    {new Date(
                                                        commande.date,
                                                    ).toLocaleDateString(
                                                        'fr-FR',
                                                    )}
                                                </span>
                                                <span className="meta-item">
                                                    <Package
                                                        size={12}
                                                        strokeWidth={1.5}
                                                    />
                                                    {commande.lines.length}{' '}
                                                    produit(s)
                                                </span>
                                                <span className="meta-item meta-quantity">
                                                    Total:{' '}
                                                    <strong>
                                                        {
                                                            commande.total_quantite
                                                        }
                                                    </strong>{' '}
                                                    unité(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="commande-row-toggle">
                                            {expandedCommandeIds.has(
                                                commande.id,
                                            ) ? (
                                                <ChevronUp
                                                    size={18}
                                                    strokeWidth={1.5}
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={18}
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Détails expandables */}
                                    {isExpanded && (
                                        <div className="commande-row-details">
                                            <div className="details-products">
                                                <div className="details-label">
                                                    Produits
                                                </div>
                                                <div className="products-grid">
                                                    {commande.lines.map(
                                                        (line) => (
                                                            <div
                                                                key={line.id}
                                                                className="product-item"
                                                            >
                                                                <span className="product-name">
                                                                    {
                                                                        line.product_nom
                                                                    }
                                                                </span>
                                                                <span className="product-qty">
                                                                    {
                                                                        line.quantite
                                                                    }{' '}
                                                                    unités
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {commande.notes && (
                                                <div className="details-notes">
                                                    <div className="details-label">
                                                        Notes
                                                    </div>
                                                    <div className="notes-content">
                                                        {commande.notes}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="details-creator">
                                                <div className="details-label">
                                                    Créée par
                                                </div>
                                                <div className="creator-name">
                                                    {commande.creator}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="details-actions-row">
                                                {commande.statut ===
                                                    'PRISE_EN_CHARGE' &&
                                                    isLabo && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (
                                                                    stockSuffisant
                                                                ) {
                                                                    if (
                                                                        confirm(
                                                                            `Créer le BL et expédier la commande #${commande.id} ?`,
                                                                        )
                                                                    ) {
                                                                        handleCreateBl(
                                                                            commande.id,
                                                                        );
                                                                    }
                                                                } else {
                                                                    alert(
                                                                        'Stock insuffisant pour cette commande. Veuillez produire les manques avant de créer le BL.',
                                                                    );
                                                                }
                                                            }}
                                                            className="btn-primary"
                                                            disabled={
                                                                isCreatingBl ===
                                                                    commande.id ||
                                                                !stockSuffisant
                                                            }
                                                        >
                                                            {isCreatingBl ===
                                                            commande.id ? (
                                                                <span className="spinner-small" />
                                                            ) : (
                                                                <Truck
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                            )}
                                                            Créer BL & Expédier
                                                        </button>
                                                    )}

                                                {(commande.statut ===
                                                    'ENVOYEE' &&
                                                    !isLabo) ||
                                                (commande.statut ===
                                                    'PRISE_EN_CHARGE' &&
                                                    !isLabo) ||
                                                commande.statut ===
                                                    'EXPEDIEE' ? (
                                                    <Link
                                                        href={commandesUrgentesRoutes.show(
                                                            commande.id,
                                                        )}
                                                        className="btn-secondary"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Eye
                                                            size={14}
                                                            strokeWidth={1.5}
                                                        />
                                                        Voir détail
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* RÉSUMÉ PAR PRODUIT (cartes) */}
            {summaryProp.length > 0 && (
                <div className="summary-card">
                    <div className="summary-header">
                        <div className="summary-title">
                            <div className="summary-dot" />
                            <span>Résumé par produit</span>
                        </div>
                        <div className="summary-badge">
                            {summaryProp.length} produit
                            {summaryProp.length > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="summary-grid">
                        {summaryProp.map((s, i) => {
                            const pct =
                                s.total_produit > 0
                                    ? Math.round(
                                          (s.total_pertes / s.total_produit) *
                                              100,
                                      )
                                    : 0;
                            return (
                                <div
                                    key={s.product.id}
                                    className="product-stat-card"
                                    style={{ animationDelay: `${i * 0.06}s` }}
                                >
                                    <div className="product-stat-name">
                                        {s.product.nom}
                                    </div>
                                    <div className="product-stat-net">
                                        {s.quantite_nette}
                                    </div>
                                    <div className="product-stat-meta">
                                        <span className="badge badge--success badge-lg">
                                            ↑ {s.total_produit}
                                        </span>
                                        {s.total_pertes > 0 && (
                                            <span className="badge badge--danger badge-lg">
                                                <ArrowDown
                                                    size={10}
                                                    strokeWidth={1.5}
                                                />{' '}
                                                {s.total_pertes} ({pct}%)
                                            </span>
                                        )}
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${Math.max(4, 100 - pct)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* FEUILLE DE PRODUCTION COMPLète */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Feuille de production — Tous les produits</span>
                    </div>
                    <div style={{ padding: '0 1rem', marginTop: '0.5rem' }}>
                        <div className="search-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="finput finput--search"
                            />
                        </div>
                    </div>
                    <div className="table-actions">
                        {modificationsCount > 0 && (
                            <button onClick={saveAll} className="btn-primary">
                                <Save size={14} strokeWidth={1.5} />
                                <span>
                                    Enregistrer tout ({modificationsCount})
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {filteredProduits.length === 0 ? (
                    <div className="empty-state">
                        <Settings size={48} strokeWidth={1} />
                        <div className="empty-state-text">
                            {search
                                ? 'Aucun produit trouvé'
                                : 'Aucun produit configuré'}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile */}
                        <div className="mobile-list">
                            {filteredProduits.map((item, i) => (
                                <div
                                    key={item.product.id}
                                    className="mobile-row"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    <div className="mobile-row-top">
                                        <span className="mobile-name">
                                            {item.product.nom}
                                        </span>
                                        <span className="badge badge--info badge-lg">
                                            {item.product.category.nom}
                                        </span>
                                    </div>
                                    <div className="mobile-row-values">
                                        {/* Qté */}
                                        <div className="mobile-value-group">
                                            {item.row.suggestion !== null && (
                                                <button
                                                    type="button"
                                                    className="suggestion-badge"
                                                    onClick={() =>
                                                        applySuggestion(
                                                            item.product.id,
                                                            item.row
                                                                .suggestion as number,
                                                        )
                                                    }
                                                >
                                                    Idéal :{' '}
                                                    {item.row.suggestion}
                                                </button>
                                            )}
                                            <label>Qté</label>
                                            <div className="mobile-qty-control">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className={`mobile-input ${item.correctMode ? 'mobile-input--correct' : ''}`}
                                                    value={
                                                        item.inputQuantite === 0
                                                            ? ''
                                                            : item.inputQuantite
                                                    }
                                                    placeholder={
                                                        item.correctMode
                                                            ? String(
                                                                  item.row
                                                                      .quantite,
                                                              )
                                                            : '0'
                                                    }
                                                    onChange={(e) =>
                                                        updateInputQuantite(
                                                            item.product.id,
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <span className="mobile-total-hint">
                                                Total :{' '}
                                                <strong>
                                                    {getFinalQuantite(item)}
                                                </strong>
                                            </span>
                                        </div>
                                        {/* Pertes */}
                                        <div className="mobile-value-group">
                                            <label>Pertes</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className={`mobile-input ${item.correctMode ? 'mobile-input--correct' : ''}`}
                                                value={
                                                    item.inputPertes === 0
                                                        ? ''
                                                        : item.inputPertes
                                                }
                                                placeholder={
                                                    item.correctMode
                                                        ? String(
                                                              item.row
                                                                  .quantite_pertes,
                                                          )
                                                        : '0'
                                                }
                                                onChange={(e) =>
                                                    updateInputPertes(
                                                        item.product.id,
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                            />
                                            <span className="mobile-total-hint">
                                                Total :{' '}
                                                <strong>
                                                    {getFinalPertes(item)}
                                                </strong>
                                            </span>
                                        </div>
                                        {/* Net */}
                                        <div className="mobile-value-group">
                                            <label>Net</label>
                                            <span className="mobile-value">
                                                {getFinalQuantite(item) -
                                                    getFinalPertes(item)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mobile-row-meta">
                                        <div className="mobile-lot">
                                            <input
                                                type="text"
                                                placeholder="Lot"
                                                className="mobile-input-sm"
                                                value={item.row.lot}
                                                onChange={(e) =>
                                                    updateRow(item.product.id, {
                                                        lot: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mobile-stock">
                                            <span
                                                className={`badge ${item.row.stock_info.disponible > 0 ? 'badge--success' : 'badge--danger'}`}
                                            >
                                                {item.row.stock_info.disponible}{' '}
                                                dispo
                                            </span>
                                            {item.row.stock_info
                                                .commandes_urgentes > 0 && (
                                                <button
                                                    type="button"
                                                    className={`stock-commande-link-mobile ${item.row.stock_info.en_alerte ? 'en-alerte' : ''}`}
                                                    title={
                                                        item.row.stock_info
                                                            .en_alerte
                                                            ? 'Stock insuffisant'
                                                            : 'Voir commandes'
                                                    }
                                                >
                                                    cmd:{' '}
                                                    {
                                                        item.row.stock_info
                                                            .commandes_urgentes
                                                    }
                                                </button>
                                            )}
                                            {item.row.stock_info.a_commander >
                                                0 && (
                                                <div className="stock-suggestion-mobile">
                                                    Manque:{' '}
                                                    {
                                                        item.row.stock_info
                                                            .a_commander
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="mobile-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleCorrectMode(
                                                        item.product.id,
                                                    )
                                                }
                                                className={`btn-mode ${item.correctMode ? 'btn-mode--active' : ''}`}
                                                title="Corriger les valeurs de cette ligne"
                                            >
                                                <Pencil
                                                    size={11}
                                                    strokeWidth={2}
                                                />
                                                <span>Corriger</span>
                                            </button>
                                            {item.row.isModified && (
                                                <button
                                                    onClick={() =>
                                                        saveRow(item.product.id)
                                                    }
                                                    className="btn-ghost"
                                                >
                                                    <Save
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    resetRow(item.product.id)
                                                }
                                                className="btn-ghost"
                                            >
                                                <RefreshCw
                                                    size={14}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop */}
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th className="text-right">
                                            Qté à produire
                                        </th>
                                        <th className="text-right">Pertes</th>
                                        <th className="text-right">
                                            Qté nette
                                        </th>
                                        <th>Lot</th>
                                        <th>En stock (disp.)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProduits.map((item, i) => (
                                        <tr
                                            key={item.product.id}
                                            style={{
                                                animationDelay: `${i * 0.04}s`,
                                            }}
                                        >
                                            <td>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent:
                                                            'flex-start',
                                                        alignItems:
                                                            'flex-start',
                                                        gap: '5px',
                                                    }}
                                                >
                                                    <span className="product-name">
                                                        {item.product.nom}
                                                    </span>
                                                    <span className="badge badge--info badge-lg">
                                                        {
                                                            item.product
                                                                .category.nom
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="desktop-input-group">
                                                    {item.row.suggestion !==
                                                        null && (
                                                        <button
                                                            type="button"
                                                            className="suggestion-badge"
                                                            title="Cliquer pour appliquer la suggestion"
                                                            onClick={() =>
                                                                applySuggestion(
                                                                    item.product
                                                                        .id,
                                                                    item.row
                                                                        .suggestion as number,
                                                                )
                                                            }
                                                        >
                                                            Idéal :{' '}
                                                            {
                                                                item.row
                                                                    .suggestion
                                                            }
                                                        </button>
                                                    )}
                                                    <div className="quantity-with-buttons">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={`form-input-inline ${item.correctMode ? 'form-input-inline--correct' : ''}`}
                                                            value={
                                                                item.inputQuantite ===
                                                                0
                                                                    ? ''
                                                                    : item.inputQuantite
                                                            }
                                                            placeholder={
                                                                item.correctMode
                                                                    ? String(
                                                                          item
                                                                              .row
                                                                              .quantite,
                                                                      )
                                                                    : '0'
                                                            }
                                                            onChange={(e) =>
                                                                updateInputQuantite(
                                                                    item.product
                                                                        .id,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <span className="desktop-total-hint">
                                                        Total :{' '}
                                                        <strong>
                                                            {getFinalQuantite(
                                                                item,
                                                            )}
                                                        </strong>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="desktop-input-group">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className={`form-input-inline ${item.correctMode ? 'form-input-inline--correct' : ''}`}
                                                        value={
                                                            item.inputPertes ===
                                                            0
                                                                ? ''
                                                                : item.inputPertes
                                                        }
                                                        placeholder={
                                                            item.correctMode
                                                                ? String(
                                                                      item.row
                                                                          .quantite_pertes,
                                                                  )
                                                                : '0'
                                                        }
                                                        onChange={(e) =>
                                                            updateInputPertes(
                                                                item.product.id,
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                            )
                                                        }
                                                    />
                                                    <span className="desktop-total-hint">
                                                        Total :{' '}
                                                        <strong>
                                                            {getFinalPertes(
                                                                item,
                                                            )}
                                                        </strong>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <span className="badge badge--info badge-lg">
                                                    {getFinalQuantite(item) -
                                                        getFinalPertes(item)}
                                                </span>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input-inline"
                                                    value={item.row.lot}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            item.product.id,
                                                            {
                                                                lot: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="text-center">
                                                <div className="stock-cell">
                                                    <span
                                                        className={`badge ${item.row.stock_info.disponible > 0 ? 'badge--success' : 'badge--danger'}`}
                                                    >
                                                        {
                                                            item.row.stock_info
                                                                .disponible
                                                        }{' '}
                                                        dispo
                                                    </span>
                                                    {item.row.stock_info
                                                        .commandes_urgentes >
                                                        0 && (
                                                        <button
                                                            type="button"
                                                            className={`stock-commande-link ${item.row.stock_info.en_alerte ? 'en-alerte' : ''}`}
                                                            title={
                                                                item.row
                                                                    .stock_info
                                                                    .en_alerte
                                                                    ? 'Stock insuffisant pour les commandes en attente'
                                                                    : 'Voir les commandes'
                                                            }
                                                        >
                                                            Commandes:{' '}
                                                            {
                                                                item.row
                                                                    .stock_info
                                                                    .commandes_urgentes
                                                            }
                                                        </button>
                                                    )}
                                                    {item.row.stock_info
                                                        .a_commander > 0 && (
                                                        <div className="stock-suggestion">
                                                            Manque:{' '}
                                                            {
                                                                item.row
                                                                    .stock_info
                                                                    .a_commander
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleCorrectMode(
                                                                item.product.id,
                                                            )
                                                        }
                                                        className={`btn-mode ${item.correctMode ? 'btn-mode--active' : ''}`}
                                                        title="Corriger les valeurs de cette ligne"
                                                    >
                                                        <Pencil
                                                            size={11}
                                                            strokeWidth={2}
                                                        />
                                                        <span>Corriger</span>
                                                    </button>
                                                    {item.row.isModified && (
                                                        <button
                                                            onClick={() =>
                                                                saveRow(
                                                                    item.product
                                                                        .id,
                                                                )
                                                            }
                                                            className="btn-ghost"
                                                            title="Sauvegarder"
                                                        >
                                                            <Save
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            resetRow(
                                                                item.product.id,
                                                            )
                                                        }
                                                        className="btn-ghost"
                                                        title="Réinitialiser"
                                                    >
                                                        <RefreshCw
                                                            size={14}
                                                            strokeWidth={1.5}
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
            {/* MODAL AJOUT PRODUIT (complément) */}
            {addModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setAddModalOpen(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Nouvelle production
                                </h3>
                                <p className="modal-subtitle">
                                    Ajouter une production pour {dateLabel}
                                </p>
                            </div>
                            <button
                                onClick={() => setAddModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">
                                        Produit
                                    </label>
                                    <select
                                        value={addForm.data.product_id}
                                        onChange={(e) =>
                                            addForm.setData(
                                                'product_id',
                                                e.target.value,
                                            )
                                        }
                                        className={`form-select ${addForm.errors.product_id ? 'error' : ''}`}
                                        required
                                    >
                                        <option value="">
                                            Choisir un produit…
                                        </option>
                                        {produitsComplets.map((item) => (
                                            <option
                                                key={item.product.id}
                                                value={item.product.id}
                                            >
                                                {item.product.nom} (
                                                {item.product.category.nom})
                                            </option>
                                        ))}
                                    </select>
                                    {addForm.errors.product_id && (
                                        <span className="form-error">
                                            {addForm.errors.product_id}
                                        </span>
                                    )}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Quantité *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={addForm.data.quantite}
                                            onChange={(e) =>
                                                addForm.setData(
                                                    'quantite',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Pertes
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={addForm.data.quantite_pertes}
                                            onChange={(e) =>
                                                addForm.setData(
                                                    'quantite_pertes',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        N° de lot{' '}
                                        <span className="form-optional">
                                            (optionnel)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={addForm.data.lot}
                                        onChange={(e) =>
                                            addForm.setData(
                                                'lot',
                                                e.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="LOT-XXX"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="btn-secondary-outline"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="btn-primary"
                                >
                                    {addForm.processing ? (
                                        <span className="spinner" />
                                    ) : (
                                        <Plus size={16} strokeWidth={1.5} />
                                    )}
                                    {addForm.processing
                                        ? 'Enregistrement…'
                                        : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PRISE EN CHARGE COMMANDE */}
            {takeModalOpen !== null && (
                <div
                    className="modal-overlay"
                    onClick={() => setTakeModalOpen(null)}
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
                                onClick={() => setTakeModalOpen(null)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-success">
                                Prendre en charge
                            </h3>
                            <p className="modal-message">
                                Voulez-vous prendre en charge la commande{' '}
                                <strong>#{takeModalOpen}</strong> ?
                            </p>
                            <p className="modal-message-subtle">
                                Cette action vous assignera la commande et la
                                fera passer en statut "Prise en charge".
                            </p>
                        </div>
                        <div className="modal-footer-success">
                            <button
                                onClick={() => setTakeModalOpen(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() =>
                                    handleTakeCommande(takeModalOpen)
                                }
                                className="btn-primary"
                                disabled={isTaking === takeModalOpen}
                            >
                                {isTaking === takeModalOpen ? (
                                    <span className="spinner" />
                                ) : (
                                    <CheckCircle size={16} strokeWidth={1.5} />
                                )}
                                Prendre en charge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION SUPPRESSION */}
            {deleteId !== null && deleteProduction && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setDeleteId(null);
                        setDeleteProduction(null);
                    }}
                >
                    <div
                        className="modal modal-danger"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-danger">
                            <div className="modal-icon-danger">
                                <AlertTriangle size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => {
                                    setDeleteId(null);
                                    setDeleteProduction(null);
                                }}
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
                                Êtes-vous sûr de vouloir supprimer cette
                                production ?
                            </p>
                            <div className="delete-preview">
                                <div className="delete-preview-item">
                                    <span className="delete-preview-label">
                                        Produit :
                                    </span>
                                    <span className="delete-preview-value">
                                        {deleteProduction.product?.nom}
                                    </span>
                                </div>
                                <div className="delete-preview-item">
                                    <span className="delete-preview-label">
                                        Quantité :
                                    </span>
                                    <span className="delete-preview-value delete-preview-value--success">
                                        {deleteProduction.quantite}
                                    </span>
                                </div>
                                {deleteProduction.quantite_pertes > 0 && (
                                    <div className="delete-preview-item">
                                        <span className="delete-preview-label">
                                            Pertes :
                                        </span>
                                        <span className="delete-preview-value delete-preview-value--danger">
                                            {deleteProduction.quantite_pertes}
                                        </span>
                                    </div>
                                )}
                                {deleteProduction.lot && (
                                    <div className="delete-preview-item">
                                        <span className="delete-preview-label">
                                            Lot :
                                        </span>
                                        <span className="delete-preview-value delete-preview-value--orange">
                                            {deleteProduction.lot}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="modal-message-subtle">
                                Cette action est irréversible.
                            </p>
                        </div>
                        <div className="modal-footer-danger">
                            <button
                                onClick={() => {
                                    setDeleteId(null);
                                    setDeleteProduction(null);
                                }}
                                className="btn-secondary-outline"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteId) {
                                        router.delete(destroy.url(deleteId), {
                                            onSuccess: () => {
                                                setDeleteId(null);
                                                setDeleteProduction(null);
                                            },
                                        });
                                    }
                                }}
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

                .badge-lg{
                    font-size: 12px!important;
                }

                /* Suggestion badge */
                .suggestion-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    background: rgba(232, 116, 42, 0.1);
                    border: 1px dashed rgba(232, 116, 42, 0.5);
                    color: #e8742a;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 0.2rem 0.55rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                    margin-bottom: 0.3rem;
                }
                .suggestion-badge:hover {
                    background: rgba(232, 116, 42, 0.2);
                    border-color: #e8742a;
                }
                .prod-page { display: flex; flex-direction: column; gap: 1.5rem; }
                .prod-header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
                .prod-date-label { text-transform: capitalize; }

                /* Date picker */
                .prod-date-picker {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-card);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    padding: 0.45rem 0.85rem;
                    transition: all 0.2s ease;
                }
                .prod-date-picker:focus-within {
                    border-color: #e8742a;
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .prod-date-input {
                    border: none !important;
                    background: transparent !important;
                    padding: 0 !important;
                    font-size: 0.85rem !important;
                    font-weight: 500 !important;
                    color: var(--text-1) !important;
                    cursor: pointer;
                    outline: none !important;
                }

                /* Alerts */
                .alerts-section {
                    background: rgba(214, 59, 59, 0.05);
                    border: 1px solid rgba(214, 59, 59, 0.2);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }
                .alerts-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid rgba(214, 59, 59, 0.15);
                }
                .alerts-icon { color: #d63b3b; }
                .alerts-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #d63b3b;
                }
                .alerts-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .alert-item {
                    background: var(--bg-card);
                    border-radius: 10px;
                    padding: 0.75rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .alert-product { font-weight: 600; font-size: 0.85rem; min-width: 150px; }
                .alert-details { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; }
                .alert-label { color: var(--text-3); }
                .alert-value { font-weight: 600; }
                .alert-shortage {
                    color: #d63b3b;
                    font-weight: 700;
                    background: rgba(214, 59, 59, 0.1);
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                }

                /* Alertes commandes urgentes - nouveau style */
                .alerts-section-alertes {
                    background: rgba(232, 116, 42, 0.08);
                    border: 1px solid rgba(232, 116, 42, 0.25);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }
                .alerts-header-alertes {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid rgba(232, 116, 42, 0.15);
                }
                .alerts-header-alertes svg {
                    color: #e8742a;
                }
                .alerts-header-alertes span {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #e8742a;
                }
                .alerts-list-alertes {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .alert-item-alerte {
                    background: var(--bg-card);
                    border-radius: 10px;
                    padding: 0.75rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .alert-item-alerte .alert-manque {
                    color: #d63b3b;
                    font-weight: 700;
                    background: rgba(214, 59, 59, 0.1);
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                }

                /* Cellule stock enrichie */
                .stock-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: center;
                }
                .stock-commande-link {
                    background: none;
                    border: none;
                    color: var(--text-2);
                    font-size: 0.75rem;
                    cursor: pointer;
                    text-decoration: underline;
                    padding: 0;
                    margin-top: 2px;
                }
                .stock-commande-link.en-alerte {
                    color: #d63b3b;
                    font-weight: 600;
                }
                .stock-commande-link:hover {
                    color: #e8742a;
                }
                .stock-suggestion {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    font-weight: 600;
                }

                /* Mobile stock link */
                .stock-commande-link-mobile {
                    background: none;
                    border: none;
                    color: var(--text-2);
                    font-size: 0.7rem;
                    cursor: pointer;
                    text-decoration: underline;
                    padding: 0;
                    margin-top: 2px;
                    text-align: center;
                }
                .stock-commande-link-mobile.en-alerte {
                    color: #d63b3b;
                    font-weight: 600;
                }
                .stock-suggestion-mobile {
                    font-size: 0.65rem;
                    color: var(--text-3);
                    font-weight: 600;
                    margin-top: 2px;
                }

                /* Quick production in alerts */
                .alert-quick-prod {
                    display: flex;
                    gap: 0.4rem;
                    align-items: center;
                    margin-top: 0.5rem;
                }
                .alert-quick-group {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                .alert-quick-input {
                    width: 70px;
                    padding: 0.3rem 0.5rem;
                    border: 1.5px solid var(--border);
                    border-radius: 6px;
                    font-size: 0.8rem;
                    text-align: center;
                    background: var(--bg-card);
                    color: var(--text-1);
                }
                .alert-quick-input--small {
                    width: 55px;
                }
                .alert-quick-input:focus {
                    outline: none;
                    border-color: #e8742a;
                    box-shadow: 0 0 0 2px rgba(232, 116, 42, 0.15);
                }
                .alert-quick-label {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    font-weight: 600;
                }
                .btn-alert-produce {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    background: #1e9e6a;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 0.3rem 0.7rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-alert-produce:hover:not(:disabled) {
                    background: #158f5d;
                }
                .btn-alert-produce:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .btn-loading {
                    min-width: 60px;
                    justify-content: center;
                }
                .spinner-small {
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Stats grid */
                .prod-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (min-width: 640px) { .prod-stats-grid { grid-template-columns: repeat(4, 1fr); } }

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
                    flex-shrink: 0;
                }
                .stat-icon--orange { background: rgba(232, 116, 42, 0.1); color: #e8742a; }
                .stat-icon--success { background: rgba(30, 158, 106, 0.1); color: #1e9e6a; }
                .stat-icon--danger { background: rgba(214, 59, 59, 0.1); color: #d63b3b; }
                .stat-content { flex: 1; }
                .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.5rem; font-weight: 800; color: #e8742a; line-height: 1.2; }
                .stat-value--success { color: #1e9e6a; }
                .stat-value--danger { color: #d63b3b; }

                /* Summary card */
                .summary-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .summary-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .summary-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-2);
                }
                .summary-dot { width: 8px; height: 8px; background: #e8742a; border-radius: 50%; }
                .summary-badge {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
                    gap: 0.85rem;
                    padding: 1.25rem;
                }
                .product-stat-card {
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 0.9rem;
                    transition: all 0.2s ease;
                }
                .product-stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: #e8742a; }
                .product-stat-name { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); margin-bottom: 0.3rem; }
                .product-stat-net { font-size: 1.4rem; font-weight: 700; color: #e8742a; line-height: 1; margin-bottom: 0.5rem; }
                .product-stat-meta { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.6rem; }

                .badge {
                    font-size: 0.6rem;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 20px;
                }
                .badge--success { background: rgba(30, 158, 106, 0.1); color: #1e9e6a; }
                .badge--danger { background: rgba(214, 59, 59, 0.1); color: #d63b3b; }
                .badge--info { background: rgba(232, 116, 42, 0.1); color: #e8742a; }
                .badge--warning { background: rgba(255, 193, 7, 0.1); color: #ffc107; }

                .progress-bar { height: 3px; background: var(--border); border-radius: 99px; overflow: hidden; }
                .progress-fill { height: 100%; background: linear-gradient(90deg, #e8742a, #f5924a); border-radius: 99px; transition: width 0.6s ease; }

                /* Table card */
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
                    letter-spacing: 0.05em;
                    color: var(--text-2);
                }
                .table-dot { width: 8px; height: 8px; background: #e8742a; border-radius: 50%; }
                .table-actions { display: flex; gap: 0.5rem; }

                /* Mobile list */
                .mobile-list { display: flex; flex-direction: column; }
                .mobile-row {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s ease;
                }
                .mobile-row:hover { background: var(--bg-card-2); }
                .mobile-row-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.7rem;
                }
                .mobile-name { font-weight: 600; font-size: 0.9rem; }
                .mobile-row-values {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.7rem;
                    flex-wrap: wrap;
                }
                .mobile-value-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    align-items: center;
                    min-width: 60px;
                }
                .mobile-value-group label {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .mobile-input {
                    width: 70px;
                    text-align: center;
                    padding: 0.35rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    background: var(--bg-card);
                    color: var(--text-1);
                }
                .mobile-input-sm {
                    width: 80px;
                    padding: 0.35rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    background: var(--bg-card);
                    color: var(--text-1);
                }

                /* Mobile quantity controls */
                .mobile-qty-control {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .mobile-qty-btn {
                    width: 26px;
                    height: 26px;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: #e8742a;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }
                .mobile-qty-btn:hover:not(:disabled) {
                    background: rgba(232, 116, 42, 0.1);
                    border-color: #e8742a;
                }
                .mobile-qty-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .mobile-value {
                    font-weight: 700;
                    font-size: 1rem;
                    color: #e8742a;
                }
                .mobile-row-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                }
                .mobile-lot { flex: 1; }
                .mobile-stock { flex-shrink: 0; }
                .mobile-actions { display: flex; gap: 0.5rem; }

                /* Desktop table */
                @media (min-width: 768px) {
                    .mobile-list { display: none; }
                    .table-wrapper { display: block; overflow-x: auto; }
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .data-table thead tr { border-bottom: 2px solid var(--border); }
                .data-table th {
                    padding: 0.85rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                }
                .data-table th.text-right { text-align: right; }
                .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.2s ease; }
                .data-table tbody tr:hover { background: var(--bg-card-2); }
                .data-table td { padding: 0.85rem 1rem; }
                .data-table td.text-right { text-align: right; }
                .data-table td.text-center { text-align: center; }

                .form-input-inline {
                    width: 80px;
                    padding: 0.4rem 0.6rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    background: var(--bg-card);
                    color: var(--text-1);
                    text-align: center;
                    transition: all 0.2s ease;
                }
                .form-input-inline:focus {
                    outline: none;
                    border-color: #e8742a;
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }

                /* Quantity buttons */
                .quantity-with-buttons {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                }
                .qty-btn {
                    width: 28px;
                    height: 28px;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 1rem;
                    color: #e8742a;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    padding: 0;
                }
                .qty-btn:hover:not(:disabled) {
                    background: rgba(232, 116, 42, 0.1);
                    border-color: #e8742a;
                }
                .qty-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .product-name { font-weight: 600; color: var(--text-1); }
                .text-success { color: #1e9e6a; font-weight: 600; }
                .text-danger { color: #d63b3b; font-weight: 600; }
                .text-orange { color: #e8742a; font-weight: 700; }
                .text-muted { color: var(--text-3); }
                .table-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, #e8742a, #f5924a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35); }
                .btn-primary:active { transform: translateY(0); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .btn-secondary-outline {
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
                    transition: all 0.2s ease;
                }
                .btn-secondary-outline:hover { background: var(--bg-card-2); border-color: var(--text-3); }

                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, #d63b3b, #e05a5a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(214, 59, 59, 0.35); }

                .btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.7rem;
                    background: transparent;
                    color: #e8742a;
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-ghost:hover { background: rgba(232, 116, 42, 0.1); border-color: #e8742a; transform: translateY(-1px); }

                /* Form elements */
                .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .form-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); }
                .form-optional { font-weight: 400; text-transform: none; color: var(--text-3); font-size: 0.65rem; }
                .form-select, .form-input {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.9rem;
                    width: 100%;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    transition: all 0.2s ease;
                }
                .form-select:focus, .form-input:focus {
                    outline: none;
                    border-color: #e8742a;
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .form-select.error, .form-input.error { border-color: #d63b3b; }
                .form-error { font-size: 0.7rem; color: #d63b3b; }

                /* Empty state */
                .empty-state { text-align: center; padding: 3rem; color: var(--text-3); }
                .empty-state-text { margin-top: 1rem; font-size: 0.9rem; }

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
                @keyframes spin { to { transform: rotate(360deg); } }

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
                @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 520px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem 1.5rem 1rem; border-bottom: 1px solid var(--border); }
                .modal-title { font-size: 1.2rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.5rem; }
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
                    transition: all 0.2s ease;
                }
                .modal-close:hover { background: rgba(214, 59, 59, 0.1); color: #d63b3b; border-color: rgba(214, 59, 59, 0.3); }
                .modal-body { padding: 1.5rem; }
                .modal-footer { padding: 1rem 1.5rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-card-2); border-top: 1px solid var(--border); }

                /* Modal Danger */
                .modal-danger { max-width: 480px; border: 1px solid rgba(214, 59, 59, 0.2); }
                .modal-header-danger { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem 1.5rem 0.5rem; }
                .modal-icon-danger {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(214, 59, 59, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #d63b3b;
                    margin: 0 auto;
                }
                .modal-title-danger { font-size: 1.3rem; font-weight: 700; color: #d63b3b; margin-bottom: 0.5rem; }
                .modal-footer-danger { padding: 1rem 1.5rem 1.5rem; display: flex; justify-content: center; gap: 0.75rem; background: var(--bg-card-2); border-top: 1px solid var(--border); }

                .delete-preview {
                    background: var(--bg-card-2);
                    border-radius: 12px;
                    padding: 1rem;
                    margin: 1rem 0;
                    text-align: left;
                }
                .delete-preview-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid var(--border);
                }
                .delete-preview-item:last-child { border-bottom: none; }
                .delete-preview-label { font-size: 0.75rem; font-weight: 600; color: var(--text-3); }
                .delete-preview-value { font-size: 0.9rem; font-weight: 600; color: var(--text-1); }
                .delete-preview-value--success { color: #1e9e6a; }
                .delete-preview-value--danger { color: #d63b3b; }
                .delete-preview-value--orange { color: #e8742a; }

                .text-center { text-align: center; }

                /* ── Incremental input helpers ─────────────────────── */

                /* Small hint showing the running total */
                .mobile-total-hint,
                .desktop-total-hint {
                    font-size: 0.6rem;
                    color: var(--text-3);
                    margin-top: 2px;
                    white-space: nowrap;
                }
                .mobile-total-hint strong,
                .desktop-total-hint strong {
                    color: #e8742a;
                    font-weight: 700;
                }

                /* Desktop: stack input + hint vertically */
                .desktop-input-group {
                    display: inline-flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                }

                /* Input in correction mode → orange border + warm bg */
                .form-input-inline--correct,
                .mobile-input--correct {
                    border-color: #e8742a !important;
                    background: rgba(232, 116, 42, 0.06) !important;
                    color: #e8742a !important;
                }

                /* Corriger button in Actions column */
                .btn-mode {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.28rem 0.6rem;
                    border-radius: 7px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    color: var(--text-3);
                    font-size: 0.68rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .btn-mode:hover {
                    border-color: #e8742a;
                    color: #e8742a;
                    background: rgba(232, 116, 42, 0.07);
                }
                .btn-mode--active {
                    border-color: #e8742a;
                    background: rgba(232, 116, 42, 0.12);
                    color: #e8742a;
                }

                /* Commandes Urgentes Section */
                .commandes-urgentes-section {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                    margin-bottom: 1.5rem;
                }
                .section-header {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .section-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .section-badge {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                /* Alerte zone stock insuffisant */
                .alert-zone-stock {
                    background: rgba(214, 59, 59, 0.08);
                    border: 1px solid rgba(214, 59, 59, 0.2);
                    border-radius: 12px;
                    padding: 0.85rem;
                    margin: 16px;
                    margin-bottom: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                }
                .alert-zone-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #d63b3b;
                }
                .alert-zone-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .alert-zone-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.4rem 0.6rem;
                    background: rgba(214, 59, 59, 0.06);
                    border-radius: 8px;
                    font-size: 0.75rem;
                }
                .alert-zone-ref {
                    font-weight: 800;
                    color: #d63b3b;
                }
                .alert-zone-entity {
                    color: var(--text-2);
                }
                .alert-zone-shortage {
                    color: #d63b3b;
                    font-weight: 600;
                }

                .commandes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem;
                }

                .commande-row-card {
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.2s ease;
                }
                .commande-row-card:hover {
                    border-color: #e8742a;
                    box-shadow: 0 2px 8px rgba(232, 116, 42, 0.1);
                }

                .commande-row-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1rem 1.25rem;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .commande-row-header:hover {
                    background: var(--bg-card);
                }

                .commande-row-info {
                    flex: 1;
                }

                .commande-row-title {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.5rem;
                }

                .commande-reference {
                    font-size: 1rem;
                    font-weight: 800;
                    color: #e8742a;
                }

                .commande-row-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    align-items: center;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.75rem;
                    color: var(--text-3);
                }
                .meta-quantity {
                    color: var(--text-2);
                    font-weight: 600;
                }

                .commande-row-toggle {
                    color: var(--text-3);
                    display: flex;
                    align-items: center;
                    margin-left: 0.75rem;
                }

                .commande-row-details {
                    border-top: 1px solid var(--border);
                    padding: 1rem 1.25rem;
                    background: var(--bg-card);
                }

                .details-products {
                    margin-bottom: 1rem;
                }
                .details-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                    margin-bottom: 0.5rem;
                }
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.5rem;
                }
                .product-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.6rem 0.85rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .product-item:hover {
                    border-color: #e8742a;
                }
                .product-item .product-name {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-1);
                }
                .product-item .product-qty {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #e8742a;
                }

                .details-notes {
                    margin-bottom: 1rem;
                }
                .notes-content {
                    padding: 0.75rem;
                    background: var(--bg-card-2);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: var(--text-2);
                    line-height: 1.5;
                    border: 1px solid var(--border);
                }

                .details-creator {
                    margin-bottom: 1rem;
                }
                .creator-name {
                    font-size: 0.85rem;
                    color: var(--text-2);
                    font-weight: 500;
                }

                .details-actions-row {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border);
                }

                /* Status badge (inline) */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                /* Spinner small */
                .spinner-small {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Modal Success (prise en charge) */
                .modal-success {
                    border: 1px solid rgba(16, 185, 129, 0.2);
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
                    background: rgba(16, 185, 129, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--success);
                    margin: 0 auto;
                }
                .modal-title-success {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--success);
                }
                .modal-footer-success {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
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
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
                }

                /* Search input */
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 260px; }
            `}</style>
        </div>
    );
}
