import { Link, router } from '@inertiajs/react';

import { useAuth } from '@/hooks/useAuth';

import inventory from '@/routes/inventory';

import {
    AlertCircle,
    FlaskConical,
    CheckCircle,
    Plus,
    Package,
    TrendingUp,
    AlertTriangle,
    XCircle,
    Calendar,
    Layers,
    FileText,
    Save,
    RefreshCw,
    Check,
    ArrowUpCircle,
    ArrowDownCircle,
    ShieldAlert,
    Euro,
    Ruler,
    SlidersHorizontal,
    ChevronRight,
    Search,
} from 'lucide-react';

import type { InventoryItem, Ingredient } from '@/types';

import InventoryIngredientModal from '@/Components/Forms/InventoryIngredientModal';

import StockEntryModal from '@/Components/Forms/StockEntryModal';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface InventoryIndexProps {
    items: (InventoryItem & { ingredient: Ingredient })[];

    alerts: (InventoryItem & { ingredient: Ingredient })[];

    high_stock_alerts: (InventoryItem & { ingredient: Ingredient })[];

    ingredients: Ingredient[];

    entity: { id: number; type: string };

    expired_lots: any[];

    expiring_soon_lots: any[];

    has_dlc_alerts: boolean;
}

export default function InventoryIndex({
    items,

    alerts,

    high_stock_alerts,

    ingredients,

    entity,

    expired_lots,

    expiring_soon_lots,

    has_dlc_alerts,
}: InventoryIndexProps) {
    const { hasRole } = useAuth();

    // Le Store Admin (guard "store") porte le role STORE_ADMIN, absent des
    // gardes historiques ecrites pour l'espace Employe : sur /store/inventory
    // la colonne Actions, le bouton « Sauver tout » et les entrees de stock
    // disparaissaient donc entierement, rendant la page lisible mais NON
    // modifiable. Il est le proprietaire de sa boutique : il gere son stock au
    // moins autant qu'un RESP_LABO, et le back-office l'autorise deja
    // (routes /store/inventory/*, cloisonnees par store).
    const canManageStock = hasRole('ADMIN', 'RESP_LABO', 'STORE_ADMIN');

    const [ingredientModalOpen, setIngredientModalOpen] = useState(false);

    const [stockEntryModalOpen, setStockEntryModalOpen] = useState(false);

    const [adjustmentsMap, setAdjustmentsMap] = useState<
        Record<number, { adjustment: number; isDirty: boolean }>
    >({});

    const [thresholdsMap, setThresholdsMap] = useState<
        Record<
            number,
            {
                seuil_minimum: number | null;

                stock_max: number | null;

                dirty: boolean;
            }
        >
    >({});

    // ── Search ──
    const [search, setSearch] = useState('');
    const filteredItems = useMemo(
        () =>
            !search
                ? items
                : items.filter((item) =>
                      item.ingredient.nom
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                  ),
        [items, search],
    );

    // Raw string values for threshold inputs — avoids .toFixed(2) reformatting cursor during typing

    const [thresholdRaw, setThresholdRaw] = useState<
        Record<number, { seuil_minimum: string; stock_max: string }>
    >({});

    useEffect(() => {
        const initialAdj: Record<
            number,
            { adjustment: number; isDirty: boolean }
        > = {};

        const initialThresh: Record<
            number,
            {
                seuil_minimum: number | null;

                stock_max: number | null;

                dirty: boolean;
            }
        > = {};

        const initialRaw: Record<
            number,
            { seuil_minimum: string; stock_max: string }
        > = {};

        items.forEach((item) => {
            initialAdj[item.ingredient_id] = { adjustment: 0, isDirty: false };

            initialThresh[item.ingredient_id] = {
                seuil_minimum: item.seuil_minimum,

                stock_max: item.stock_max,

                dirty: false,
            };

            initialRaw[item.ingredient_id] = {
                seuil_minimum:
                    item.seuil_minimum !== null
                        ? String(item.seuil_minimum)
                        : '',

                stock_max:
                    item.stock_max !== null ? String(item.stock_max) : '',
            };
        });

        setAdjustmentsMap(initialAdj);

        setThresholdsMap(initialThresh);

        setThresholdRaw(initialRaw);
    }, [items]);

    const totalItems = items.length;

    const lowStockCount = items.filter((i) => i.is_low_stock).length;

    const highStockCount = items.filter((i) => i.is_high_stock).length;

    const healthyCount = totalItems - lowStockCount - highStockCount;

    const dirtyRowsCount = useMemo(() => {
        let count = 0;

        items.forEach((item) => {
            const adjDirty =
                adjustmentsMap[item.ingredient_id]?.isDirty ?? false;

            const threshDirty =
                thresholdsMap[item.ingredient_id]?.dirty ?? false;

            if (adjDirty || threshDirty) count++;
        });

        return count;
    }, [adjustmentsMap, thresholdsMap, items]);

    const totalValue = items.reduce((sum, item) => {
        return (
            sum +
            (Number(item.ingredient.prix_unitaire) || 0) * Number(item.quantite)
        );
    }, 0);

    const normalizeDecimal = (value: string) => value.replace(',', '.');

    const handleAdjustmentChange = (ingredientId: number, value: string) => {
        const normalized = normalizeDecimal(value);

        const numValue = normalized === '' ? 0 : parseFloat(normalized);

        if (isNaN(numValue)) {
            setAdjustmentsMap((prev) => ({
                ...prev,

                [ingredientId]: { adjustment: 0, isDirty: false },
            }));

            return;
        }

        setAdjustmentsMap((prev) => ({
            ...prev,

            [ingredientId]: { adjustment: numValue, isDirty: numValue !== 0 },
        }));
    };

    const resetAdjustment = (ingredientId: number) => {
        setAdjustmentsMap((prev) => ({
            ...prev,

            [ingredientId]: { adjustment: 0, isDirty: false },
        }));
    };

    const handleThresholdChange = (
        ingredientId: number,

        field: 'seuil_minimum' | 'stock_max',

        value: string,
    ) => {
        // Store raw string — lets user type freely without .toFixed() reformatting the cursor

        setThresholdRaw((prev) => ({
            ...prev,

            [ingredientId]: {
                ...(prev[ingredientId] || { seuil_minimum: '', stock_max: '' }),

                [field]: value,
            },
        }));

        // Parse numeric value for save logic

        const normalized = value.replace(',', '.');

        const numValue = normalized === '' ? null : parseFloat(normalized);

        if (numValue !== null && isNaN(numValue)) return;

        setThresholdsMap((prev) => {
            const current = prev[ingredientId] || {
                seuil_minimum: null,

                stock_max: null,

                dirty: false,
            };

            return {
                ...prev,

                [ingredientId]: { ...current, [field]: numValue, dirty: true },
            };
        });
    };

    const resetThreshold = (ingredientId: number) => {
        const item = items.find((i) => i.ingredient_id === ingredientId);

        if (!item) return;

        setThresholdsMap((prev) => ({
            ...prev,

            [ingredientId]: {
                seuil_minimum: item.seuil_minimum,

                stock_max: item.stock_max,

                dirty: false,
            },
        }));

        setThresholdRaw((prev) => ({
            ...prev,

            [ingredientId]: {
                seuil_minimum:
                    item.seuil_minimum !== null
                        ? String(item.seuil_minimum)
                        : '',

                stock_max:
                    item.stock_max !== null ? String(item.stock_max) : '',
            },
        }));
    };

    const saveRow = async (ingredientId: number) => {
        const adj = adjustmentsMap[ingredientId];

        const thresh = thresholdsMap[ingredientId];

        const hasAdjDirty = adj?.isDirty && adj.adjustment !== 0;

        const hasThreshDirty = thresh?.dirty;

        if (!hasAdjDirty && !hasThreshDirty) return;

        try {
            const requests: Promise<any>[] = [];

            if (hasAdjDirty)
                requests.push(
                    router.put(
                        '/inventory/adjust-batch',

                        {
                            adjustments: [
                                {
                                    ingredient_id: ingredientId,

                                    adjustment: adj.adjustment,
                                },
                            ],
                        },

                        { preserveState: true, preserveScroll: true },
                    ) as any,
                );

            if (hasThreshDirty)
                requests.push(
                    router.put(
                        `/inventory/${String(ingredientId)}`,

                        {
                            seuil_minimum: thresh.seuil_minimum,

                            stock_max: thresh.stock_max,
                        },

                        { preserveState: true, preserveScroll: true },
                    ) as any,
                );

            await Promise.all(requests);

            if (hasAdjDirty)
                setAdjustmentsMap((prev) => ({
                    ...prev,

                    [ingredientId]: { adjustment: 0, isDirty: false },
                }));

            if (hasThreshDirty)
                setThresholdsMap((prev) => ({
                    ...prev,

                    [ingredientId]: { ...prev[ingredientId], dirty: false },
                }));
        } catch (e) {
            console.error(e);
        }
    };

    const saveAll = async () => {
        const dirtyAdj = Object.entries(adjustmentsMap)

            .filter(([, a]) => a.isDirty && a.adjustment !== 0)

            .map(([id, a]) => ({
                ingredient_id: Number(id),

                adjustment: a.adjustment,
            }));

        const dirtyThr = Object.entries(thresholdsMap)

            .filter(([, t]) => t.dirty)

            .map(([id, t]) => ({
                ingredient_id: Number(id),

                seuil_minimum: t.seuil_minimum,

                stock_max: t.stock_max,
            }));

        if (!dirtyAdj.length && !dirtyThr.length) return;

        try {
            const reqs: Promise<any>[] = [];

            if (dirtyAdj.length)
                reqs.push(
                    router.put(
                        '/inventory/adjust-batch',

                        { adjustments: dirtyAdj },

                        { preserveState: true, preserveScroll: true },
                    ) as any,
                );

            dirtyThr.forEach((t) =>
                reqs.push(
                    router.put(
                        `/inventory/${t.ingredient_id}`,

                        {
                            seuil_minimum: t.seuil_minimum,

                            stock_max: t.stock_max,
                        },

                        { preserveState: true, preserveScroll: true },
                    ) as any,
                ),
            );

            await Promise.all(reqs);

            setAdjustmentsMap((prev) => {
                const m = { ...prev };

                Object.keys(m).forEach((k) => {
                    m[+k] = { ...m[+k], isDirty: false, adjustment: 0 };
                });

                return m;
            });

            setThresholdsMap((prev) => {
                const m = { ...prev };

                Object.keys(m).forEach((k) => {
                    m[+k] = { ...m[+k], dirty: false };
                });

                return m;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const getAdj = (id: number) => adjustmentsMap[id]?.adjustment ?? 0;

    const isAdjDirty = (id: number) => adjustmentsMap[id]?.isDirty ?? false;

    const isThrDirty = (id: number) => thresholdsMap[id]?.dirty ?? false;

    const isRowDirty = (id: number) => isAdjDirty(id) || isThrDirty(id);

    const getNewStock = (item: InventoryItem) =>
        Number(item.quantite) + getAdj(item.ingredient_id);

    const adjBadgeCls = (adj: number) =>
        adj > 0 ? 'delta--pos' : adj < 0 ? 'delta--neg' : 'delta--muted';

    const adjSign = (adj: number) =>
        adj === 0 ? '' : adj > 0 ? `+${adj.toFixed(2)}` : adj.toFixed(2);

    return (
        <div className="inv-page">
            {/* ── HEADER ── */}

            <div className="inv-header">
                <div>
                    <h1 className="inv-title">Gestion des Stocks</h1>

                    <p className="inv-subtitle">
                        {totalItems} ingrédient{totalItems > 1 ? 's' : ''} ·{' '}
                        {totalValue.toFixed(2)} €
                    </p>
                </div>

                <div className="inv-actions">
                    <Link href={inventory.lots.index()} className="btn-sec">
                        <Layers size={15} strokeWidth={1.5} />

                        <span className="btn-sec__label">Lots (FIFO)</span>
                    </Link>

                    <Link href="/inventory/movements" className="btn-sec">
                        <FileText size={15} strokeWidth={1.5} />

                        <span className="btn-sec__label">Mouvements</span>
                    </Link>

                    {canManageStock && (
                        <>
                            <button
                                className="btn-sec"
                                onClick={() => setStockEntryModalOpen(true)}
                            >
                                <ArrowDownCircle size={15} strokeWidth={1.5} />

                                <span className="btn-sec__label">
                                    Entrée stock
                                </span>
                            </button>

                            <button
                                className="btn-pri"
                                onClick={() => setIngredientModalOpen(true)}
                            >
                                <Plus size={15} strokeWidth={1.5} />

                                <span className="btn-pri__label">
                                    Ingrédient
                                </span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── STATS ── */}

            <div className="stats-grid">
                {(
                    [
                        {
                            icon: <Package size={18} strokeWidth={1.5} />,

                            label: 'Total',

                            value: totalItems,

                            mod: 'orange',
                        },

                        {
                            icon: <CheckCircle size={18} strokeWidth={1.5} />,

                            label: 'Sain',

                            value: healthyCount,

                            mod: 'success',
                        },

                        {
                            icon: <AlertTriangle size={18} strokeWidth={1.5} />,

                            label: 'Stock bas',

                            value: lowStockCount,

                            mod: 'danger',
                        },

                        {
                            icon: <TrendingUp size={18} strokeWidth={1.5} />,

                            label: 'Sur-stock',

                            value: highStockCount,

                            mod: 'warning',
                        },

                        {
                            icon: <Euro size={18} strokeWidth={1.5} />,

                            label: 'Valeur',

                            value: `${totalValue.toFixed(2)} €`,

                            mod: 'orange',
                        },
                    ] as const
                ).map((s, i) => (
                    <div
                        key={i}
                        className="stat-card"
                        style={{ animationDelay: `${i * 0.06}s` }}
                    >
                        <div className={`stat-icon stat-icon--${s.mod}`}>
                            {s.icon}
                        </div>

                        <div>
                            <div className="stat-label">{s.label}</div>

                            <div className={`stat-val stat-val--${s.mod}`}>
                                {s.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── ALERTES ── */}

            <div className="alerts-wrap">
                {alerts.length > 0 && (
                    <div className="alert alert--danger">
                        <AlertCircle size={15} className="alert__icon" />

                        <span className="alert__text">
                            <strong>{alerts.length} en stock bas :</strong>{' '}
                            {alerts.map((a) => a.ingredient.nom).join(', ')}
                        </span>
                    </div>
                )}

                {high_stock_alerts.length > 0 && (
                    <div className="alert alert--warning">
                        <TrendingUp size={15} className="alert__icon" />

                        <span className="alert__text">
                            <strong>
                                {high_stock_alerts.length} en sur-stock :
                            </strong>{' '}
                            {high_stock_alerts

                                .map((a) => a.ingredient.nom)

                                .join(', ')}
                        </span>
                    </div>
                )}

                {has_dlc_alerts && expired_lots.length > 0 && (
                    <div className="alert alert--danger">
                        <XCircle size={15} className="alert__icon" />

                        <span className="alert__text">
                            <strong>
                                {expired_lots.length} lot(s) expiré(s) :
                            </strong>{' '}
                            {expired_lots

                                .slice(0, 3)

                                .map(
                                    (l: any) =>
                                        `${l.ingredient.nom} (${l.lot_number || 'N/A'})`,
                                )

                                .join(', ')}
                            {expired_lots.length > 3 &&
                                ` +${expired_lots.length - 3} autres`}
                        </span>

                        <Link
                            href={inventory.lots.index({
                                query: { dlc_status: 'expired' },
                            })}
                            className="alert__link"
                        >
                            Voir <ChevronRight size={11} />
                        </Link>
                    </div>
                )}

                {has_dlc_alerts && expiring_soon_lots.length > 0 && (
                    <div className="alert alert--warning">
                        <Calendar size={15} className="alert__icon" />

                        <span className="alert__text">
                            <strong>
                                {expiring_soon_lots.length} lot(s) expire(nt)
                                sous 3j :
                            </strong>{' '}
                            {expiring_soon_lots

                                .slice(0, 3)

                                .map(
                                    (l: any) =>
                                        `${l.ingredient.nom} (DLC: ${l.dlc})`,
                                )

                                .join(', ')}
                            {expiring_soon_lots.length > 3 &&
                                ` +${expiring_soon_lots.length - 3} autres`}
                        </span>

                        <Link
                            href={inventory.lots.index({
                                query: { dlc_status: 'expiring_soon' },
                            })}
                            className="alert__link"
                        >
                            Voir <ChevronRight size={11} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ── TABLE CARD ── */}

            <div className="tcard">
                <div className="tcard__header">
                    <div className="tcard__title">
                        <span className="tcard__dot" />
                        Inventaire
                        {dirtyRowsCount > 0 && (
                            <span className="dirty-pill">
                                {dirtyRowsCount} modifié
                                {dirtyRowsCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div style={{ padding: '0 1rem', marginTop: '0.5rem' }}>
                        <div className="search-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un ingrédient..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="finput finput--search"
                            />
                        </div>
                    </div>

                    {dirtyRowsCount > 0 && canManageStock && (
                        <button onClick={saveAll} className="btn-save-all">
                            <Save size={13} strokeWidth={1.5} />
                            Sauver tout ({dirtyRowsCount})
                        </button>
                    )}
                </div>

                {filteredItems.length === 0 ? (
                    <>
                        <div className="empty-state">
                            <FlaskConical size={44} strokeWidth={1} />

                            <p>Aucun stock enregistré pour cette entité</p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* ── MOBILE CARDS ── */}

                        <div className="mob-list">
                            {filteredItems.map((item, i) => {
                                const adj = getAdj(item.ingredient_id);

                                const dirty = isRowDirty(item.ingredient_id);

                                const newStock = getNewStock(item);

                                const thresh = thresholdsMap[
                                    item.ingredient_id
                                ] || {
                                    seuil_minimum: item.seuil_minimum,

                                    stock_max: item.stock_max,

                                    dirty: false,
                                };

                                const isLow = item.is_low_stock;

                                const isHigh = item.is_high_stock;

                                return (
                                    <div
                                        key={item.id}
                                        className={[
                                            'mob-row',

                                            dirty ? 'mob-row--dirty' : '',

                                            isLow
                                                ? 'mob-row--low'
                                                : isHigh
                                                  ? 'mob-row--high'
                                                  : '',
                                        ]

                                            .filter(Boolean)

                                            .join(' ')}
                                        style={{
                                            animationDelay: `${i * 0.04}s`,
                                        }}
                                    >
                                        {/* Top row: name + status */}

                                        <div className="mob-top">
                                            <div className="mob-name-block">
                                                <span className="mob-name">
                                                    {item.ingredient.nom}
                                                </span>

                                                {/* Chips: unité + prix */}

                                                <div className="mob-chips">
                                                    <span className="chip chip--unit">
                                                        <Ruler
                                                            size={9}
                                                            strokeWidth={2}
                                                        />

                                                        {item.ingredient
                                                            .unite || '—'}
                                                    </span>

                                                    <span className="chip chip--price">
                                                        <Euro
                                                            size={9}
                                                            strokeWidth={2}
                                                        />

                                                        {Number(
                                                            item.ingredient
                                                                .prix_unitaire ||
                                                                0,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className={`spill spill--${isLow ? 'danger' : isHigh ? 'warning' : 'success'}`}
                                            >
                                                {isLow ? (
                                                    <>
                                                        <AlertTriangle
                                                            size={9}
                                                        />{' '}
                                                        Bas
                                                    </>
                                                ) : isHigh ? (
                                                    <>
                                                        <TrendingUp size={9} />{' '}
                                                        Élevé
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={9} />{' '}
                                                        OK
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        {/* Stock numbers */}

                                        <div className="mob-nums">
                                            <div className="mob-num">
                                                <span className="mob-num__lbl">
                                                    Valide
                                                </span>

                                                <span className="mob-num__val c-success">
                                                    {Number(
                                                        item.valid_quantity ||
                                                            0,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="mob-divider" />

                                            <div className="mob-num">
                                                <span className="mob-num__lbl">
                                                    Expiré
                                                </span>

                                                <span className="mob-num__val c-danger">
                                                    {Number(
                                                        item.expired_quantity ||
                                                            0,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="mob-divider" />

                                            <div className="mob-num">
                                                <span className="mob-num__lbl">
                                                    Total
                                                </span>

                                                <span
                                                    className={`mob-num__val mob-num__val--lg ${isLow ? 'c-danger' : isHigh ? 'c-warning' : 'c-orange'}`}
                                                >
                                                    {Number(
                                                        item.quantite,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="mob-divider" />

                                            <div className="mob-num">
                                                <span className="mob-num__lbl">
                                                    Min
                                                </span>

                                                <span className="mob-num__val c-muted">
                                                    {item.seuil_minimum !== null
                                                        ? Number(
                                                              item.seuil_minimum,
                                                          ).toFixed(2)
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ajustement */}

                                        <div className="mob-section">
                                            <div className="mob-section__lbl">
                                                <SlidersHorizontal
                                                    size={11}
                                                    strokeWidth={2}
                                                />
                                                Ajustement
                                            </div>

                                            <div className="mob-adj-row">
                                                <div className="mob-adj-input-wrap">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            adj === 0 ? '' : adj
                                                        }
                                                        onChange={(e) =>
                                                            handleAdjustmentChange(
                                                                item.ingredient_id,

                                                                e.target.value,
                                                            )
                                                        }
                                                        className={`finput finput--adj${adj > 0 ? 'finput--pos' : adj < 0 ? 'finput--neg' : ''}`}
                                                        placeholder="0"
                                                    />

                                                    {adj !== 0 && (
                                                        <span
                                                            className={`delta ${adjBadgeCls(adj)}`}
                                                        >
                                                            {adj > 0 ? (
                                                                <ArrowUpCircle
                                                                    size={9}
                                                                />
                                                            ) : (
                                                                <ArrowDownCircle
                                                                    size={9}
                                                                />
                                                            )}

                                                            {adjSign(adj)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mob-new-stock">
                                                    <span
                                                        className="c-muted"
                                                        style={{
                                                            fontSize: '1rem',
                                                        }}
                                                    >
                                                        →
                                                    </span>

                                                    <span
                                                        className={`mob-new-stock__val${dirty ? 'mob-new-stock__val--dirty' : ''}`}
                                                    >
                                                        {newStock.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seuils */}

                                        <div className="mob-section">
                                            <div className="mob-section__lbl">
                                                <ShieldAlert
                                                    size={11}
                                                    strokeWidth={2}
                                                />
                                                Seuils
                                            </div>

                                            <div className="mob-seuils">
                                                <div className="mob-seuil">
                                                    <label className="mob-seuil__lbl">
                                                        Min.
                                                    </label>

                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            thresh.seuil_minimum !==
                                                            null
                                                                ? Number(
                                                                      thresh.seuil_minimum,
                                                                  ).toFixed(2)
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            handleThresholdChange(
                                                                item.ingredient_id,

                                                                'seuil_minimum',

                                                                e.target.value,
                                                            )
                                                        }
                                                        className="finput finput--seuil"
                                                        placeholder="—"
                                                    />
                                                </div>

                                                <div className="mob-seuil">
                                                    <label className="mob-seuil__lbl">
                                                        Max.
                                                    </label>

                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            thresh.stock_max !==
                                                            null
                                                                ? Number(
                                                                      thresh.stock_max,
                                                                  ).toFixed(2)
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            handleThresholdChange(
                                                                item.ingredient_id,

                                                                'stock_max',

                                                                e.target.value,
                                                            )
                                                        }
                                                        className="finput finput--seuil"
                                                        placeholder="—"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}

                                        {dirty && (
                                            <div className="mob-actions">
                                                <button
                                                    onClick={() => {
                                                        resetAdjustment(
                                                            item.ingredient_id,
                                                        );

                                                        resetThreshold(
                                                            item.ingredient_id,
                                                        );
                                                    }}
                                                    className="btn-reset"
                                                >
                                                    <RefreshCw
                                                        size={12}
                                                        strokeWidth={1.5}
                                                    />{' '}
                                                    Reset
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        saveRow(
                                                            item.ingredient_id,
                                                        )
                                                    }
                                                    className="btn-save-row"
                                                >
                                                    <Check
                                                        size={12}
                                                        strokeWidth={2}
                                                    />{' '}
                                                    Sauver
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── DESKTOP TABLE ── */}

                        <div className="desk-wrap">
                            <table className="dtable">
                                <thead>
                                    <tr>
                                        <th>Ingrédient</th>

                                        <th className="ta-r">
                                            <span className="th-i">
                                                <CheckCircle size={11} />
                                                Valide
                                            </span>
                                        </th>

                                        <th className="ta-r">
                                            <span className="th-i">
                                                <XCircle size={11} />
                                                Expiré
                                            </span>
                                        </th>

                                        <th className="ta-r">
                                            <span className="th-i">
                                                <Package size={11} />
                                                Total
                                            </span>
                                        </th>

                                        <th className="ta-c">
                                            <span className="th-i">
                                                <SlidersHorizontal size={11} />
                                                Ajustement
                                            </span>
                                        </th>

                                        <th className="ta-r">
                                            <span className="th-i">
                                                <ArrowUpCircle size={11} />
                                                Nouveau stock
                                            </span>
                                        </th>

                                        <th className="ta-r">
                                            <span className="th-i">
                                                <ShieldAlert size={11} />
                                                Seuil min.
                                            </span>
                                        </th>

                                        <th className="ta-r">
                                            <span className="th-i">
                                                <TrendingUp size={11} />
                                                Stock max
                                            </span>
                                        </th>

                                        <th className="ta-c">Statut</th>

                                        {canManageStock && (
                                            <th className="ta-c">Actions</th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredItems.map((item, i) => {
                                        const isLow = item.is_low_stock;

                                        const isHigh = item.is_high_stock;

                                        const adj = getAdj(item.ingredient_id);

                                        const dirty = isRowDirty(
                                            item.ingredient_id,
                                        );

                                        const newStock = getNewStock(item);

                                        const thresh = thresholdsMap[
                                            item.ingredient_id
                                        ] || {
                                            seuil_minimum: item.seuil_minimum,

                                            stock_max: item.stock_max,

                                            dirty: false,
                                        };

                                        const rowCls = isLow
                                            ? 'tr--low'
                                            : isHigh
                                              ? 'tr--high'
                                              : dirty
                                                ? 'tr--dirty'
                                                : '';

                                        return (
                                            <tr
                                                key={item.id}
                                                className={rowCls}
                                                style={{
                                                    animationDelay: `${i * 0.03}s`,
                                                }}
                                            >
                                                <td>
                                                    <span className="d-name">
                                                        {item.ingredient.nom}
                                                    </span>

                                                    <div className="d-chips">
                                                        <span className="chip chip--unit">
                                                            <Ruler
                                                                size={9}
                                                                strokeWidth={2}
                                                            />

                                                            {item.ingredient
                                                                .unite || '—'}
                                                        </span>

                                                        <span className="chip chip--price">
                                                            <Euro
                                                                size={9}
                                                                strokeWidth={2}
                                                            />

                                                            {Number(
                                                                item.ingredient
                                                                    .prix_unitaire ||
                                                                    0,
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="ta-r">
                                                    <span className="num c-success">
                                                        {Number(
                                                            item.valid_quantity ||
                                                                0,
                                                        ).toFixed(2)}
                                                    </span>
                                                </td>

                                                <td className="ta-r">
                                                    <span className="num c-danger">
                                                        {Number(
                                                            item.expired_quantity ||
                                                                0,
                                                        ).toFixed(2)}
                                                    </span>
                                                </td>

                                                <td className="ta-r">
                                                    <span
                                                        className={`num num--bold ${isLow ? 'c-danger' : isHigh ? 'c-warning' : 'c-orange'}`}
                                                    >
                                                        {Number(
                                                            item.quantite,
                                                        ).toFixed(2)}
                                                    </span>
                                                </td>

                                                <td className="ta-c">
                                                    <div className="adj-cell">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className={`finput finput--inline${adj > 0 ? 'finput--pos' : adj < 0 ? 'finput--neg' : ''}`}
                                                            value={
                                                                adj === 0
                                                                    ? ''
                                                                    : adj
                                                            }
                                                            onChange={(e) =>
                                                                handleAdjustmentChange(
                                                                    item.ingredient_id,

                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="0"
                                                        />

                                                        {adj !== 0 && (
                                                            <span
                                                                className={`delta delta--sm ${adjBadgeCls(adj)}`}
                                                            >
                                                                {adjSign(adj)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="ta-r">
                                                    <span
                                                        className={`num${dirty ? 'num--highlight' : ''}`}
                                                    >
                                                        {newStock.toFixed(2)}
                                                    </span>
                                                </td>

                                                <td className="ta-r">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="finput finput--inline finput--sm"
                                                        value={
                                                            thresh.seuil_minimum !==
                                                            null
                                                                ? Number(
                                                                      thresh.seuil_minimum,
                                                                  ).toFixed(2)
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            handleThresholdChange(
                                                                item.ingredient_id,

                                                                'seuil_minimum',

                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="—"
                                                    />
                                                </td>

                                                <td className="ta-r">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="finput finput--inline finput--sm"
                                                        value={
                                                            parseFloat(
                                                                thresh.stock_max?.toString() ||
                                                                    '',
                                                            ).toFixed(2) ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            handleThresholdChange(
                                                                item.ingredient_id,

                                                                'stock_max',

                                                                parseFloat(
                                                                    e.target
                                                                        .value ||
                                                                        '',
                                                                ).toFixed(2),
                                                            )
                                                        }
                                                        placeholder="—"
                                                    />
                                                </td>

                                                <td className="ta-c">
                                                    <span
                                                        className={`spill spill--${isLow ? 'danger' : isHigh ? 'warning' : 'success'}`}
                                                    >
                                                        {isLow ? (
                                                            <>
                                                                <AlertTriangle
                                                                    size={9}
                                                                />{' '}
                                                                Bas
                                                            </>
                                                        ) : isHigh ? (
                                                            <>
                                                                <TrendingUp
                                                                    size={9}
                                                                />{' '}
                                                                Élevé
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle
                                                                    size={9}
                                                                />{' '}
                                                                OK
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                {canManageStock && (
                                                    <td className="ta-c">
                                                        <div className="d-actions">
                                                            {dirty && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            resetAdjustment(
                                                                                item.ingredient_id,
                                                                            );

                                                                            resetThreshold(
                                                                                item.ingredient_id,
                                                                            );
                                                                        }}
                                                                        className="ibtn ibtn--muted"
                                                                        title="Réinitialiser"
                                                                    >
                                                                        <RefreshCw
                                                                            size={
                                                                                12
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            saveRow(
                                                                                item.ingredient_id,
                                                                            )
                                                                        }
                                                                        className="ibtn ibtn--success"
                                                                        title="Sauver"
                                                                    >
                                                                        <Check
                                                                            size={
                                                                                12
                                                                            }
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                        />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── MODALS ── */}

            <InventoryIngredientModal
                open={ingredientModalOpen}
                onClose={() => setIngredientModalOpen(false)}
            />

            <StockEntryModal
                open={stockEntryModalOpen}
                onClose={() => setStockEntryModalOpen(false)}
                ingredients={ingredients}
            />

            <style>{`

                /* ─── Keyframes ─── */

                @keyframes fadeUp {

                    from { opacity: 0; transform: translateY(8px); }

                    to   { opacity: 1; transform: translateY(0); }

                }

                @keyframes fadein {

                    from { opacity: 0; } to { opacity: 1; }

                }

                @keyframes pulse-orange {

                    0%,100% { background: rgba(232,116,42,0.08); }

                    50%     { background: rgba(232,116,42,0.18); }

                }



                /* ─── Page ─── */

                .inv-page { display: flex; flex-direction: column; gap: 1.1rem; animation: fadein .3s ease; }



                /* ─── Header ─── */

                .inv-header {

                    display: flex;

                    align-items: flex-start;

                    justify-content: space-between;

                    gap: .75rem;

                    flex-wrap: wrap;

                }

                .inv-title  { font-size: 1.35rem; font-weight: 800; color: var(--text-1); margin: 0 0 .15rem; }

                .inv-subtitle { font-size: .75rem; color: var(--text-3); margin: 0; }



                /* Actions row — wraps on small screens */

                .inv-actions {

                    display: flex;

                    flex-wrap: wrap;

                    gap: .35rem;

                    align-items: center;

                }



                /* Primary button */

                .btn-pri {

                    display: inline-flex; align-items: center; gap: .35rem;

                    padding: .45rem .9rem;

                    background: linear-gradient(135deg, var(--orange), #f08040);

                    color: #fff; border: none; border-radius: 9px;

                    font-size: .78rem; font-weight: 700; cursor: pointer;

                    transition: transform .2s, box-shadow .2s;

                    white-space: nowrap;

                }

                .btn-pri:hover { transform: translateY(-2px); box-shadow: 0 5px 14px rgba(232,116,42,.38); }



                /* Secondary button */

                .btn-sec {

                    display: inline-flex; align-items: center; gap: .35rem;

                    padding: .45rem .9rem;

                    background: var(--bg-card-2); color: var(--text-2);

                    border: 1px solid var(--border); border-radius: 9px;

                    font-size: .78rem; font-weight: 600; cursor: pointer;

                    transition: all .2s; text-decoration: none;

                    white-space: nowrap;

                }

                .btn-sec:hover { border-color: var(--orange); color: var(--orange); }



                /* Hide text on very small screens — keep icon only */

                @media (max-width: 420px) {

                    .btn-sec__label, .btn-pri__label { display: none; }

                    .btn-sec, .btn-pri { padding: .45rem .55rem; }

                }



                /* ─── Stats ─── */

                .stats-grid {

                    display: grid;

                    grid-template-columns: repeat(2, 1fr);

                    gap: .65rem;

                }

                @media (min-width: 540px)  { .stats-grid { grid-template-columns: repeat(3,1fr); } }

                @media (min-width: 900px)  { .stats-grid { grid-template-columns: repeat(5,1fr); } }



                .stat-card {

                    background: var(--bg-card);

                    border-radius: 13px;

                    padding: .8rem;

                    display: flex; align-items: center; gap: .65rem;

                    border: 1px solid var(--border);

                    transition: transform .2s, box-shadow .2s;

                    animation: fadeUp .4s ease both;

                }

                .stat-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,.08); }

                .stat-icon {

                    width: 40px; height: 40px; border-radius: 10px;

                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;

                }

                .stat-icon--orange  { background: rgba(232,116,42,.12); color: var(--orange); }

                .stat-icon--success { background: rgba(30,158,106,.12); color: var(--success); }

                .stat-icon--danger  { background: rgba(214,59,59,.12);  color: var(--danger); }

                .stat-icon--warning { background: rgba(232,116,42,.12); color: var(--orange); }

                .stat-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-3); margin-bottom: .15rem; }

                .stat-val   { font-size: 1.35rem; font-weight: 800; line-height: 1.1; color: var(--orange); }

                .stat-val--success { color: var(--success); }

                .stat-val--danger  { color: var(--danger); }

                .stat-val--warning { color: var(--orange); }

                .stat-val--orange  { color: var(--orange); }



                /* ─── Alerts ─── */

                .alerts-wrap { display: flex; flex-direction: column; gap: .45rem; }

                .alert {

                    display: flex; align-items: center; gap: .55rem;

                    padding: .6rem .85rem; border-radius: 10px;

                    font-size: .8rem; animation: fadeUp .35s ease both;

                }

                .alert__icon { flex-shrink: 0; }

                .alert--danger  { background: rgba(214,59,59,.08); border-left: 3px solid var(--danger); }

                .alert--warning { background: rgba(232,116,42,.08); border-left: 3px solid var(--orange); }

                .alert__text { flex: 1; color: var(--text-2); font-weight: 500; font-size: .8rem; }

                .alert__text strong { font-weight: 700; }

                .alert__link {

                    display: inline-flex; align-items: center; gap: 2px;

                    flex-shrink: 0; font-size: .72rem; font-weight: 600;

                    color: var(--orange); text-decoration: none;

                    padding: .18rem .5rem; border-radius: 6px;

                    border: 1px solid rgba(232,116,42,.3); transition: background .15s;

                }

                .alert__link:hover { background: rgba(232,116,42,.12); }



                /* ─── Table card ─── */

                .tcard { background: var(--bg-card); border-radius: 13px; border: 1px solid var(--border); overflow: hidden; }

                .tcard__header {

                    display: flex; align-items: center; justify-content: space-between;

                    padding: .8rem 1rem; border-bottom: 1px solid var(--border); gap: .5rem;

                }

                .tcard__title {

                    display: flex; align-items: center; gap: .45rem;

                    font-size: .75rem; font-weight: 700; text-transform: uppercase;

                    letter-spacing: .05em; color: var(--text-2);

                }

                .tcard__dot { width: 7px; height: 7px; background: var(--orange); border-radius: 50%; flex-shrink: 0; }

                .dirty-pill {

                    font-size: .62rem; font-weight: 700;

                    padding: .12rem .45rem; border-radius: 20px;

                    background: rgba(232,116,42,.15); color: var(--orange);

                    animation: pulse-orange 2s ease infinite;

                }

                .btn-save-all {

                    display: inline-flex; align-items: center; gap: .35rem;

                    padding: .4rem .85rem;

                    background: linear-gradient(135deg, var(--success), #1a9e6e);

                    color: #fff; border: none; border-radius: 8px;

                    font-size: .75rem; font-weight: 700; cursor: pointer;

                    transition: all .2s; white-space: nowrap;

                }

                .btn-save-all:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30,158,106,.35); }



                /* ─── Empty state ─── */

                .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-3); }

                .empty-state p { margin-top: .65rem; font-size: .875rem; }



                /* ─── Chip (unité / prix) ─── */

                /*

                 * IMPORTANT: display:inline-flex + align-items:center

                 * ensures the icon and text are on the same baseline.

                 * gap:3px spaces them without relying on &nbsp;

                 */

                .chip {

                    display: inline-flex;

                    align-items: center;

                    gap: 3px;

                    padding: .13rem .42rem;

                    border-radius: 5px;

                    font-size: .67rem;

                    font-weight: 600;

                    line-height: 1.4;

                    white-space: nowrap;

                    vertical-align: middle;

                }

                .chip--unit  { background: rgba(99,102,241,.12); color: #6366f1; }

                .chip--price { background: rgba(30,158,106,.12);  color: var(--success); }



                /* ─── Status pill (spill) ─── */

                .spill {

                    display: inline-flex;

                    align-items: center;

                    gap: 3px;

                    font-size: .67rem;

                    font-weight: 700;

                    padding: .18rem .52rem;

                    border-radius: 20px;

                    white-space: nowrap;

                    flex-shrink: 0;

                    vertical-align: middle;

                }

                .spill--success { background: rgba(30,158,106,.1);  color: var(--success); }

                .spill--danger  { background: rgba(214,59,59,.1);   color: var(--danger); }

                .spill--warning { background: rgba(232,116,42,.1);  color: var(--orange); }



                /* ─── Delta badge ─── */

                .delta {

                    display: inline-flex; align-items: center; gap: 2px;

                    font-size: .67rem; font-weight: 700;

                    padding: .12rem .38rem; border-radius: 5px;

                    white-space: nowrap; flex-shrink: 0;

                }

                .delta--sm { font-size: .63rem; padding: .1rem .32rem; }

                .delta--pos   { background: rgba(30,158,106,.15); color: var(--success); }

                .delta--neg   { background: rgba(214,59,59,.15);  color: var(--danger); }

                .delta--muted { background: var(--bg-card-2); color: var(--text-3); }



                /* ─── Row states ─── */

                .tr--dirty { background: rgba(232,116,42,.03); }

                .tr--dirty:hover { background: rgba(232,116,42,.07); }

                .tr--low   { background: rgba(214,59,59,.03); }

                .tr--low:hover   { background: rgba(214,59,59,.06); }

                .tr--high  { background: rgba(232,116,42,.03); }

                .tr--high:hover  { background: rgba(232,116,42,.07); }



                /* ─── Field inputs ─── */

                .finput {

                    padding: .38rem .6rem;

                    background: var(--bg-card-2);

                    border: 1.5px solid var(--border);

                    border-radius: 8px;

                    font-size: .83rem;

                    color: var(--text-1);

                    transition: border-color .18s, box-shadow .18s;

                }

                .finput:focus { outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px rgba(232,116,42,.15); }

                .finput--pos { border-color: rgba(30,158,106,.5);  color: var(--success); }

                .finput--neg { border-color: rgba(214,59,59,.5);   color: var(--danger); }



                /* Ajustement mobile — taille fixe, ne s'étire pas */

                .finput--adj   { width: 110px; text-align: center; flex-shrink: 0; }

                /* Seuil mobile */

                .finput--seuil { width: 100%; text-align: right; font-size: .8rem; }

                /* Desktop inline */

                .finput--inline { width: 74px; text-align: center; padding: .32rem .45rem; font-size: .8rem; }

                .finput--sm     { width: 80px; }



                /* ─── Num cells (desktop) ─── */

                .num       { font-size: .85rem; font-weight: 600; }

                .num--bold { font-weight: 800; }

                .num--highlight {

                    color: var(--orange); font-weight: 800;

                    padding: .08rem .28rem; border-radius: 4px;

                    animation: pulse-orange 2s ease infinite;

                }



                /* ─── Adjust cell (desktop) ─── */

                .adj-cell { display: flex; align-items: center; justify-content: center; gap: .35rem; }



                /* ─── Desktop icon buttons ─── */

                .d-actions { display: flex; align-items: center; justify-content: center; gap: .3rem; min-height: 26px; }

                .ibtn {

                    display: inline-flex; align-items: center; justify-content: center;

                    width: 26px; height: 26px; border: none; border-radius: 6px;

                    cursor: pointer; transition: all .18s;

                }

                .ibtn--success { background: var(--success); color: #fff; }

                .ibtn--success:hover { background: #1a9e6e; transform: scale(1.1); }

                .ibtn--muted { background: var(--bg-card-2); color: var(--text-3); border: 1px solid var(--border); }

                .ibtn--muted:hover { border-color: var(--orange); color: var(--orange); }



                /* th inner */

                .th-i { display: inline-flex; align-items: center; gap: 3px; }



                /* ─── MOBILE LIST ─── */

                .mob-list { display: flex; flex-direction: column; }

                .desk-wrap { display: none; overflow-x: auto; }

                @media (min-width: 1024px) {

                    .mob-list  { display: none; }

                    .desk-wrap { display: block; }

                }



                .mob-row {

                    padding: .85rem .95rem;

                    border-bottom: 1px solid var(--border);

                    transition: background .18s;

                    animation: fadeUp .35s ease both;

                }

                .mob-row:last-child { border-bottom: none; }

                .mob-row:hover { background: var(--bg-card-2); }

                .mob-row--dirty { background: rgba(232,116,42,.03); }

                .mob-row--low   { background: rgba(214,59,59,.03); }

                .mob-row--high  { background: rgba(232,116,42,.03); }



                /* Top row */

                .mob-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; margin-bottom: .6rem; }

                .mob-name-block { display: flex; flex-direction: column; gap: 5px; min-width: 0; }

                .mob-name { font-weight: 700; font-size: .88rem; color: var(--text-1); }



                /* Chips row on mobile */

                .mob-chips { display: flex; gap: 5px; flex-wrap: wrap; }



                /* Numbers strip */

                .mob-nums {

                    display: flex; align-items: center;

                    padding: .5rem 0; margin-bottom: .6rem;

                    border-top: 1px solid var(--border);

                    border-bottom: 1px solid var(--border);

                    overflow-x: auto;

                }

                .mob-num { display: flex; flex-direction: column; gap: 2px; padding: 0 .7rem; flex-shrink: 0; }

                .mob-num:first-child { padding-left: 0; }

                .mob-num__lbl { font-size: .57rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-3); }

                .mob-num__val { font-size: .9rem; font-weight: 700; }

                .mob-num__val--lg { font-size: 1rem; }

                .mob-divider { width: 1px; height: 26px; background: var(--border); flex-shrink: 0; }



                /* Section (ajustement / seuils) */

                .mob-section { margin-bottom: .55rem; }

                .mob-section__lbl {

                    display: inline-flex; align-items: center; gap: 4px;

                    font-size: .62rem; font-weight: 700; text-transform: uppercase;

                    letter-spacing: .05em; color: var(--text-3); margin-bottom: .3rem;

                }



                /* Ajustement row — input fixe à gauche, nouveau stock à droite */

                .mob-adj-row {

                    display: flex;

                    align-items: center;

                    justify-content: space-between;

                    gap: .6rem;

                }

                .mob-adj-input-wrap {

                    display: flex;

                    align-items: center;

                    gap: .4rem;

                    /* ← flex: 0 0 auto so it does NOT stretch */

                    flex: 0 0 auto;

                }

                .mob-new-stock {

                    display: flex; align-items: center; gap: .3rem;

                    font-size: .85rem; flex-shrink: 0;

                }

                .mob-new-stock__val { font-weight: 700; color: var(--text-2); }

                .mob-new-stock__val--dirty { color: var(--orange); font-weight: 800; }



                /* Seuils row — two fields side by side */

                .mob-seuils { display: flex; gap: .75rem; }

                .mob-seuil  { display: flex; flex-direction: column; gap: 3px; flex: 1; max-width: 160px; }

                .mob-seuil__lbl { font-size: .63rem; font-weight: 600; color: var(--text-3); }



                /* Mobile action buttons */

                .mob-actions {

                    display: flex; justify-content: flex-end; gap: .4rem;

                    margin-top: .5rem; padding-top: .5rem;

                    border-top: 1px dashed var(--border);

                }

                .btn-save-row {

                    display: inline-flex; align-items: center; gap: .3rem;

                    padding: .33rem .7rem;

                    background: var(--success); color: #fff;

                    border: none; border-radius: 7px;

                    font-size: .73rem; font-weight: 700; cursor: pointer;

                    transition: all .18s;

                }

                .btn-save-row:hover { background: #1a9e6e; transform: translateY(-1px); }

                .btn-reset {

                    display: inline-flex; align-items: center; gap: .3rem;

                    padding: .33rem .6rem;

                    background: var(--bg-card-2); color: var(--text-3);

                    border: 1px solid var(--border); border-radius: 7px;

                    font-size: .73rem; font-weight: 600; cursor: pointer;

                    transition: all .18s;

                }

                .btn-reset:hover { border-color: var(--orange); color: var(--orange); }



                /* ─── Desktop table ─── */

                .dtable { width: 100%; border-collapse: collapse; font-size: .845rem; }

                .dtable thead tr { border-bottom: 2px solid var(--border); background: var(--bg-card-2); }

                .dtable th {

                    padding: .7rem .85rem;

                    font-size: .62rem; font-weight: 700;

                    text-transform: uppercase; letter-spacing: .05em;

                    color: var(--text-3); text-align: left;

                }

                .dtable th.ta-r { text-align: right; }

                .dtable th.ta-c { text-align: center; }

                .dtable tbody tr {

                    border-bottom: 1px solid var(--border);

                    transition: background .15s;

                    animation: fadeUp .3s ease both;

                }

                .dtable tbody tr:last-child { border-bottom: none; }

                .dtable tbody tr:hover { background: var(--bg-card-2); }

                .dtable td { padding: .65rem .85rem; vertical-align: middle; }

                .dtable td.ta-r { text-align: right; }

                .dtable td.ta-c { text-align: center; }



                .d-name { font-weight: 600; font-size: .86rem; color: var(--text-1); display: block; margin-bottom: 4px; }

                .d-chips { display: flex; gap: 4px; flex-wrap: wrap; }



                /* ─── Color utilities ─── */

                .c-success { color: var(--success); }

                .c-danger  { color: var(--danger);  }

                .c-warning { color: var(--orange);  }

                .c-orange  { color: var(--orange);  }

                .c-muted   { color: var(--text-3);  }



                /* Search input */

                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 260px; }

                /* text alignment */

                .ta-r { text-align: right; }

                .ta-c { text-align: center; }

            `}</style>
        </div>
    );
}
