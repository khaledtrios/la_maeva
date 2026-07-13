import { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import returnsRoutes from '@/routes/returns';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Upload,
    AlertTriangle,
    Package,
    X,
    Save,
    Image,
    Sparkles,
    ChevronDown,
    PackagePlus,
    Info,
    AlertCircle,
} from 'lucide-react';

interface Line {
    reception_line_id: number | null;
    balance_id?: number | null; // pour tracer le lot stock balance (retours invendus expirés)
    product_id: number;
    product: any;
    quantite_attendue: number;
    quantite_retournee: number;
    dlc: string | null;
    lot_reference: string;
    cause: 'DEFECTUEUX' | 'INVENDU_EXPIRE' | 'AUTRE';
    notes: string;
    origine: 'auto' | 'manuel';
}

export default function ReturnCreate() {
    const page = usePage();
    const {
        receptions,
        products,
        reception: preselectedReception,
        expiredStock,
    } = page.props as any;
    const { user } = useAuth();

    const [selectedReceptionId, setSelectedReceptionId] = useState<
        number | null
    >(preselectedReception?.id || null);
    const [returnLines, setReturnLines] = useState<Line[]>(() => {
        if (preselectedReception) return buildAutoLines(preselectedReception);
        return [];
    });

    // Si on arrive avec une réception preselected, s'assurer que les lignes sont bien peuplées
    // (sécurité au cas où la liste receptions se charge après le state initial)
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (!initialized && preselectedReception && returnLines.length === 0) {
            setReturnLines(buildAutoLines(preselectedReception));
        }
        setInitialized(true);
    }, [preselectedReception]);

    // Formulaire ajout manuel
    const [newProductId, setNewProductId] = useState<number | ''>('');
    const [newQteRetour, setNewQteRetour] = useState<number>(1);
    const [newCause, setNewCause] = useState<
        'DEFECTUEUX' | 'INVENDU_EXPIRE' | 'AUTRE'
    >('DEFECTUEUX');
    const [newDlc, setNewDlc] = useState('');
    const [newLot, setNewLot] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [showManualForm, setShowManualForm] = useState(false);

    const [globalNotes, setGlobalNotes] = useState('');
    const [blReference, setBlReference] = useState('');
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Construire lignes auto depuis une réception
    function buildAutoLines(reception: any): Line[] {
        return reception.lines
            .filter((l: any) => (l.qte_recue ?? l.qte_attendue) > 0)
            .map((l: any) => {
                const qteRecue = l.qte_recue ?? l.qte_attendue ?? 0;
                return {
                    reception_line_id: l.id,
                    balance_id: null,
                    product_id: l.product_id,
                    product: l.product,
                    quantite_attendue: l.qte_attendue || 0,
                    quantite_retournee: qteRecue,
                    dlc: l.dlc || null,
                    lot_reference: l.expeditionLine?.lot_reference || '',
                    cause: 'DEFECTUEUX' as const,
                    notes: '',
                    origine: 'auto' as const,
                };
            });
    }

    const handleReceptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        if (id) {
            const reception = receptions.find((r: any) => r.id === id);
            setSelectedReceptionId(id);
            if (reception) {
                // Garder les lignes manuelles existantes, remplacer les auto
                const manualLines = returnLines.filter(
                    (l) => l.origine === 'manuel',
                );
                setReturnLines([...buildAutoLines(reception), ...manualLines]);
            }
        } else {
            setSelectedReceptionId(null);
            // Garder seulement les manuelles
            setReturnLines((prev) =>
                prev.filter((l) => l.origine === 'manuel'),
            );
        }
        setErrors({});
    };

    const addManualLine = () => {
        if (!newProductId) {
            setErrors({ product: 'Choisissez un produit' });
            return;
        }
        if (newQteRetour <= 0) {
            setErrors({ qte: 'La quantité doit être > 0' });
            return;
        }
        const product = products.find((p: any) => p.id === newProductId);
        if (!product) return;

        setReturnLines((prev) => [
            ...prev,
            {
                reception_line_id: null,
                product_id: newProductId as number,
                product,
                quantite_attendue: newQteRetour, // pour manuel = quantite_retournee
                quantite_retournee: newQteRetour,
                dlc: newDlc || null,
                lot_reference: newLot,
                cause: newCause,
                notes: newNotes,
                origine: 'manuel',
            },
        ]);

        setNewProductId('');
        setNewQteRetour(1);
        setNewCause('DEFECTUEUX');
        setNewDlc('');
        setNewLot('');
        setNewNotes('');
        setErrors({});
        setShowManualForm(false);
    };

    const removeLine = (index: number) => {
        setReturnLines((prev) => prev.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof Line, value: any) => {
        setReturnLines((prev) => {
            const updated = [...prev];
            (updated[index] as any)[field] = value;
            return updated;
        });
    };

    const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const valid = Array.from(e.target.files).filter(
                (f) =>
                    ['image/jpeg', 'image/png', 'image/webp'].includes(
                        f.type,
                    ) && f.size <= 5 * 1024 * 1024,
            );
            setPhotoFiles((prev) => [...prev, ...valid]);
        }
    };

    const validLines = useMemo(
        () => returnLines.filter((l) => l.quantite_retournee > 0),
        [returnLines],
    );
    const totalRetourne = useMemo(
        () => validLines.reduce((s, l) => s + l.quantite_retournee, 0),
        [validLines],
    );
    const autoCount = returnLines.filter((l) => l.origine === 'auto').length;
    const manualCount = returnLines.filter(
        (l) => l.origine === 'manuel',
    ).length;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validLines.length === 0) {
            setErrors({ lines: 'Aucune ligne avec quantité > 0' });
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        if (selectedReceptionId)
            formData.append('reception_id', selectedReceptionId.toString());
        if (blReference) formData.append('bl_number', blReference);
        if (globalNotes) formData.append('notes', globalNotes);

        validLines.forEach((line, idx) => {
            formData.append(
                `lines[${idx}][product_id]`,
                line.product_id.toString(),
            );
            formData.append(
                `lines[${idx}][quantite_attendue]`,
                line.quantite_attendue.toString(),
            );
            formData.append(
                `lines[${idx}][quantite_retournee]`,
                line.quantite_retournee.toString(),
            );
            formData.append(`lines[${idx}][cause]`, line.cause);
            formData.append(`lines[${idx}][origine]`, line.origine);
            if (line.reception_line_id)
                formData.append(
                    `lines[${idx}][reception_line_id]`,
                    line.reception_line_id.toString(),
                );
            if (line.dlc) formData.append(`lines[${idx}][dlc]`, line.dlc);
            if (line.lot_reference)
                formData.append(
                    `lines[${idx}][lot_reference]`,
                    line.lot_reference,
                );
            if (line.notes) formData.append(`lines[${idx}][notes]`, line.notes);
        });

        photoFiles.forEach((f) => formData.append('photos[]', f));

        router.post(returnsRoutes.store.url(), formData, {
            onFinish: () => setIsSubmitting(false),
            onError: (err) => setErrors(err as any),
        });
    };

    const isExpired = (dlc: string | null) =>
        dlc ? new Date(dlc) < new Date() : false;
    const fmtDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString('fr-FR') : '—';

    const causeLabel = (c: string) =>
        c === 'DEFECTUEUX'
            ? 'Défectueux'
            : c === 'INVENDU_EXPIRE'
              ? 'DLC expirée'
              : 'Autre';

    return (
        <>
            <Head title="Créer un retour" />
            <div className="rc-page">
                {/* ── HEADER ── */}
                <div className="rc-header">
                    <Link href={returnsRoutes.index()} className="rc-back">
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>Retours</span>
                    </Link>
                    <div className="rc-header-main">
                        <h1 className="rc-title">Nouveau retour</h1>
                        <p className="rc-subtitle">
                            Déclarer des produits défectueux ou invendus
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="rc-form">
                    {/* ── STEP 1 : RÉCEPTION ── */}
                    <div className="rc-card">
                        <div className="rc-card-head">
                            <div className="rc-step-num">1</div>
                            <div>
                                <div className="rc-card-title">
                                    Réception associée
                                </div>
                                <div className="rc-card-sub">
                                    Optionnel — pré-remplit les lignes
                                    automatiquement
                                </div>
                            </div>
                            <span className="rc-badge rc-badge--gray">
                                facultatif
                            </span>
                        </div>
                        <div className="rc-card-body">
                            <div className="rc-form-group">
                                <label className="rc-label">
                                    Sélectionner une réception confirmée
                                </label>
                                <div className="rc-select-wrap">
                                    <select
                                        value={selectedReceptionId || ''}
                                        onChange={handleReceptionChange}
                                        className="rc-select"
                                    >
                                        <option value="">
                                            Aucune (saisie manuelle uniquement)
                                        </option>
                                        {receptions.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                #{r.id} —{' '}
                                                {r.expedition?.entity?.nom} —{' '}
                                                {fmtDate(r.date)} (
                                                {r.lines?.length || 0} produits)
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="rc-select-icon"
                                    />
                                </div>
                                {selectedReceptionId && autoCount > 0 && (
                                    <div className="rc-info-banner">
                                        <Sparkles size={14} strokeWidth={1.5} />
                                        <span>
                                            <strong>
                                                {autoCount} ligne
                                                {autoCount > 1 ? 's' : ''}
                                            </strong>{' '}
                                            pré-remplie
                                            {autoCount > 1 ? 's' : ''} depuis la
                                            réception — les écarts (attendu −
                                            reçu) sont calculés automatiquement
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── STEP 2 : LIGNES ── */}
                    <div className="rc-card">
                        <div className="rc-card-head">
                            <div className="rc-step-num">2</div>
                            <div>
                                <div className="rc-card-title">
                                    Produits à retourner
                                </div>
                                <div className="rc-card-sub">
                                    {returnLines.length === 0
                                        ? 'Aucune ligne ajoutée'
                                        : `${returnLines.length} ligne${returnLines.length > 1 ? 's' : ''} — ${totalRetourne} unité${totalRetourne > 1 ? 's' : ''} à retourner`}
                                </div>
                            </div>
                            {totalRetourne > 0 && (
                                <span className="rc-badge rc-badge--orange">
                                    {totalRetourne} unité
                                    {totalRetourne > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Lignes existantes */}
                        {returnLines.length > 0 && (
                            <div className="rc-lines-list">
                                {returnLines.map((line, idx) => (
                                    <div
                                        key={idx}
                                        className={`rc-line ${line.origine === 'auto' ? 'rc-line--auto' : 'rc-line--manual'}`}
                                    >
                                        {/* Top row */}
                                        <div className="rc-line-top">
                                            <div className="rc-line-product">
                                                <span className="rc-line-name">
                                                    {line.product?.nom}
                                                </span>
                                                <span
                                                    className={`rc-badge ${line.origine === 'auto' ? 'rc-badge--auto' : 'rc-badge--manual'}`}
                                                >
                                                    {line.origine === 'auto' ? (
                                                        <>
                                                            <Sparkles
                                                                size={9}
                                                                strokeWidth={2}
                                                            />{' '}
                                                            auto
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PackagePlus
                                                                size={9}
                                                                strokeWidth={2}
                                                            />{' '}
                                                            manuel
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeLine(idx)}
                                                className="rc-line-remove"
                                            >
                                                <X size={14} strokeWidth={2} />
                                            </button>
                                        </div>

                                        {/* DLC + lot */}
                                        {(line.dlc || line.lot_reference) && (
                                            <div className="rc-line-meta">
                                                {line.dlc && (
                                                    <span
                                                        className={`rc-meta-item ${isExpired(line.dlc) ? 'rc-meta-item--expired' : ''}`}
                                                    >
                                                        DLC {fmtDate(line.dlc)}
                                                        {isExpired(line.dlc) &&
                                                            ' ⚠ expirée'}
                                                    </span>
                                                )}
                                                {line.lot_reference && (
                                                    <span className="rc-meta-item">
                                                        Lot {line.lot_reference}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Controls row */}
                                        <div className="rc-line-controls">
                                            {/* Attendu */}
                                            <div className="rc-ctrl-group">
                                                <label className="rc-ctrl-label">
                                                    Attendu
                                                </label>
                                                <div className="rc-ctrl-value">
                                                    {line.quantite_attendue}
                                                </div>
                                            </div>

                                            {/* À retourner */}
                                            <div className="rc-ctrl-group">
                                                <label className="rc-ctrl-label">
                                                    À retourner
                                                    {line.origine ===
                                                        'auto' && (
                                                        <span
                                                            className="rc-auto-hint"
                                                            title="Calculé auto : attendu − reçu"
                                                        >
                                                            ⚡
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        line.quantite_retournee ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        updateLine(
                                                            idx,
                                                            'quantite_retournee',
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                    className={`rc-qty-input ${line.quantite_retournee > 0 ? 'rc-qty-input--active' : ''}`}
                                                    placeholder="0"
                                                />
                                            </div>

                                            {/* Cause */}
                                            <div className="rc-ctrl-group rc-ctrl-group--wide">
                                                <label className="rc-ctrl-label">
                                                    Cause
                                                </label>
                                                <div className="rc-select-wrap rc-select-wrap--sm">
                                                    <select
                                                        value={line.cause}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                idx,
                                                                'cause',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="rc-select rc-select--sm"
                                                    >
                                                        <option value="DEFECTUEUX">
                                                            Défectueux
                                                        </option>
                                                        <option value="INVENDU_EXPIRE">
                                                            DLC expirée
                                                        </option>
                                                        <option value="AUTRE">
                                                            Autre
                                                        </option>
                                                    </select>
                                                    <ChevronDown
                                                        size={12}
                                                        className="rc-select-icon"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes inline */}
                                        <input
                                            type="text"
                                            value={line.notes}
                                            onChange={(e) =>
                                                updateLine(
                                                    idx,
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            className="rc-notes-input"
                                            placeholder="Note (optionnel)..."
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.lines && (
                            <div className="rc-error-banner">
                                <AlertCircle size={14} strokeWidth={1.5} />
                                {errors.lines}
                            </div>
                        )}

                        {/* Bouton ajouter manuel */}
                        <div className="rc-card-footer">
                            {/* Expired Stock Section */}
                            {expiredStock && expiredStock.length > 0 && (
                                <div className="rc-expired-section">
                                    <div className="rc-expired-header">
                                        <AlertTriangle
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        <span>Produits avec DLC expirée</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newLines: Line[] = [
                                                    ...returnLines,
                                                ];
                                                expiredStock.forEach(
                                                    (item: any) => {
                                                        const exists =
                                                            newLines.some(
                                                                (l) =>
                                                                    l.balance_id ===
                                                                    item.balance_id,
                                                            );
                                                        if (!exists) {
                                                            newLines.push({
                                                                reception_line_id:
                                                                    null,
                                                                balance_id:
                                                                    item.balance_id,
                                                                product_id:
                                                                    item.product_id,
                                                                product: item,
                                                                quantite_attendue:
                                                                    item.quantite,
                                                                quantite_retournee:
                                                                    item.quantite,
                                                                dlc: item.dlc,
                                                                lot_reference:
                                                                    item.lot_reference ||
                                                                    '',
                                                                cause: 'INVENDU_EXPIRE',
                                                                notes: 'DLC expirée',
                                                                origine:
                                                                    'manuel',
                                                            });
                                                        }
                                                    },
                                                );
                                                setReturnLines(newLines);
                                            }}
                                            className="rc-btn-add-all"
                                        >
                                            <Plus size={14} strokeWidth={2} />
                                            Ajouter tous les{' '}
                                            {expiredStock.length} produits
                                            expirés
                                        </button>
                                    </div>
                                    <div className="rc-expired-list">
                                        {expiredStock
                                            .filter(
                                                (item: any) =>
                                                    !returnLines.some(
                                                        (l) =>
                                                            l.balance_id ===
                                                            item.balance_id,
                                                    ),
                                            )
                                            .map((item: any) => (
                                                <div
                                                    key={`expired-${item.balance_id}`}
                                                    className="rc-expired-item"
                                                >
                                                    <div className="rc-expired-info">
                                                        <span className="rc-expired-name">
                                                            {item.nom}
                                                        </span>
                                                        <span className="rc-expired-meta">
                                                            {item.quantite}{' '}
                                                            unité(s) • DLC:{' '}
                                                            {new Date(
                                                                item.dlc,
                                                            ).toLocaleDateString(
                                                                'fr-FR',
                                                            )}
                                                            {item.lot_reference &&
                                                                ` • Lot: ${item.lot_reference}`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const exists =
                                                                returnLines.some(
                                                                    (l) =>
                                                                        l.balance_id ===
                                                                        item.balance_id,
                                                                );
                                                            if (!exists) {
                                                                setReturnLines(
                                                                    (prev) => [
                                                                        ...prev,
                                                                        {
                                                                            reception_line_id:
                                                                                null,
                                                                            balance_id:
                                                                                item.balance_id,
                                                                            product_id:
                                                                                item.product_id,
                                                                            product:
                                                                                item,
                                                                            quantite_attendue:
                                                                                item.quantite,
                                                                            quantite_retournee:
                                                                                item.quantite,
                                                                            dlc: item.dlc,
                                                                            lot_reference:
                                                                                item.lot_reference ||
                                                                                '',
                                                                            cause: 'INVENDU_EXPIRE',
                                                                            notes: 'DLC expirée',
                                                                            origine:
                                                                                'manuel',
                                                                        },
                                                                    ],
                                                                );
                                                            }
                                                        }}
                                                        className="rc-btn-add-item"
                                                    >
                                                        <Plus
                                                            size={12}
                                                            strokeWidth={2}
                                                        />
                                                        Ajouter
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {!showManualForm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowManualForm(true)}
                                    className="rc-btn-add"
                                >
                                    <Plus size={15} strokeWidth={2} />
                                    Ajouter un produit manuellement
                                </button>
                            ) : (
                                <div className="rc-manual-form">
                                    <div className="rc-manual-form-title">
                                        <PackagePlus
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        <span>Nouveau produit</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowManualForm(false)
                                            }
                                            className="rc-manual-close"
                                        >
                                            <X size={14} strokeWidth={2} />
                                        </button>
                                    </div>

                                    <div className="rc-manual-grid">
                                        <div className="rc-form-group rc-form-group--full">
                                            <label className="rc-label">
                                                Produit *
                                            </label>
                                            <div className="rc-select-wrap">
                                                <select
                                                    value={newProductId}
                                                    onChange={(e) =>
                                                        setNewProductId(
                                                            e.target.value
                                                                ? parseInt(
                                                                      e.target
                                                                          .value,
                                                                  )
                                                                : '',
                                                        )
                                                    }
                                                    className={`rc-select ${errors.product ? 'rc-select--error' : ''}`}
                                                >
                                                    <option value="">
                                                        Choisir un produit…
                                                    </option>
                                                    {products.map((p: any) => (
                                                        <option
                                                            key={p.id}
                                                            value={p.id}
                                                        >
                                                            {p.nom}
                                                            {p.category?.nom
                                                                ? ` — ${p.category.nom}`
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    size={16}
                                                    className="rc-select-icon"
                                                />
                                            </div>
                                            {errors.product && (
                                                <span className="rc-error">
                                                    {errors.product}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rc-form-group">
                                            <label className="rc-label">
                                                À retourner *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newQteRetour}
                                                onChange={(e) =>
                                                    setNewQteRetour(
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1,
                                                    )
                                                }
                                                className={`rc-input ${errors.qte ? 'rc-input--error' : ''}`}
                                            />
                                            {errors.qte && (
                                                <span className="rc-error">
                                                    {errors.qte}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rc-form-group">
                                            <label className="rc-label">
                                                Cause
                                            </label>
                                            <div className="rc-select-wrap">
                                                <select
                                                    value={newCause}
                                                    onChange={(e) =>
                                                        setNewCause(
                                                            e.target
                                                                .value as any,
                                                        )
                                                    }
                                                    className="rc-select"
                                                >
                                                    <option value="DEFECTUEUX">
                                                        Défectueux
                                                    </option>
                                                    <option value="INVENDU_EXPIRE">
                                                        DLC expirée
                                                    </option>
                                                    <option value="AUTRE">
                                                        Autre
                                                    </option>
                                                </select>
                                                <ChevronDown
                                                    size={16}
                                                    className="rc-select-icon"
                                                />
                                            </div>
                                        </div>

                                        <div className="rc-form-group">
                                            <label className="rc-label">
                                                DLC
                                            </label>
                                            <input
                                                type="date"
                                                value={newDlc}
                                                onChange={(e) =>
                                                    setNewDlc(e.target.value)
                                                }
                                                className="rc-input"
                                            />
                                        </div>

                                        <div className="rc-form-group">
                                            <label className="rc-label">
                                                Lot / BL
                                            </label>
                                            <input
                                                type="text"
                                                value={newLot}
                                                onChange={(e) =>
                                                    setNewLot(e.target.value)
                                                }
                                                className="rc-input"
                                                placeholder="N° lot"
                                            />
                                        </div>

                                        <div className="rc-form-group rc-form-group--full">
                                            <label className="rc-label">
                                                Note
                                            </label>
                                            <input
                                                type="text"
                                                value={newNotes}
                                                onChange={(e) =>
                                                    setNewNotes(e.target.value)
                                                }
                                                className="rc-input"
                                                placeholder="Optionnel…"
                                            />
                                        </div>
                                    </div>

                                    <div className="rc-manual-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowManualForm(false)
                                            }
                                            className="rc-btn-ghost"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addManualLine}
                                            className="rc-btn-confirm"
                                        >
                                            <Plus size={14} strokeWidth={2} />
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── STEP 3 : INFOS COMPLÉMENTAIRES ── */}
                    <div className="rc-card">
                        <div className="rc-card-head">
                            <div className="rc-step-num">3</div>
                            <div>
                                <div className="rc-card-title">
                                    Informations complémentaires
                                </div>
                                <div className="rc-card-sub">
                                    BL d'origine, notes globales
                                </div>
                            </div>
                            <span className="rc-badge rc-badge--gray">
                                optionnel
                            </span>
                        </div>
                        <div className="rc-card-body">
                            <div className="rc-form-group">
                                <label className="rc-label">
                                    N° BL d'origine
                                </label>
                                <input
                                    type="text"
                                    value={blReference}
                                    onChange={(e) =>
                                        setBlReference(e.target.value)
                                    }
                                    className="rc-input"
                                    placeholder="BL-XXXX"
                                />
                            </div>
                            <div
                                className="rc-form-group"
                                style={{ marginTop: '0.75rem' }}
                            >
                                <label className="rc-label">
                                    Notes générales
                                </label>
                                <textarea
                                    value={globalNotes}
                                    onChange={(e) =>
                                        setGlobalNotes(e.target.value)
                                    }
                                    className="rc-textarea"
                                    rows={3}
                                    placeholder="Informations complémentaires…"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── STEP 4 : PHOTOS ── */}
                    <div className="rc-card">
                        <div className="rc-card-head">
                            <div className="rc-step-num">4</div>
                            <div>
                                <div className="rc-card-title">Photos</div>
                                <div className="rc-card-sub">
                                    JPG, PNG, WebP — 5 Mo max par fichier
                                </div>
                            </div>
                            <span className="rc-badge rc-badge--gray">
                                optionnel
                            </span>
                        </div>
                        <div className="rc-card-body">
                            <input
                                type="file"
                                id="rc-photo-input"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={addPhoto}
                                style={{ display: 'none' }}
                            />
                            <label
                                htmlFor="rc-photo-input"
                                className="rc-upload-zone"
                            >
                                <Image size={28} strokeWidth={1.5} />
                                <span>Appuyez pour ajouter des photos</span>
                            </label>
                            {photoFiles.length > 0 && (
                                <div className="rc-photo-grid">
                                    {photoFiles.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="rc-photo-item"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt=""
                                                className="rc-photo-thumb"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPhotoFiles((prev) =>
                                                        prev.filter(
                                                            (_, i) => i !== idx,
                                                        ),
                                                    )
                                                }
                                                className="rc-photo-remove"
                                            >
                                                <X size={12} strokeWidth={2} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ACTIONS ── */}
                    <div className="rc-actions">
                        {validLines.length > 0 && (
                            <div className="rc-summary-pill">
                                <span>
                                    {validLines.length} produit
                                    {validLines.length > 1 ? 's' : ''}
                                </span>
                                <span className="rc-summary-sep">·</span>
                                <span>
                                    {totalRetourne} unité
                                    {totalRetourne > 1 ? 's' : ''}
                                </span>
                                {autoCount > 0 && manualCount > 0 && (
                                    <>
                                        <span className="rc-summary-sep">
                                            ·
                                        </span>
                                        <span>auto + manuel</span>
                                    </>
                                )}
                            </div>
                        )}
                        <div className="rc-actions-btns">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(returnsRoutes.index())
                                }
                                className="rc-btn-ghost"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || validLines.length === 0
                                }
                                className="rc-btn-primary"
                            >
                                {isSubmitting ? (
                                    <span className="rc-spinner" />
                                ) : (
                                    <Save size={15} strokeWidth={2} />
                                )}
                                {isSubmitting ? 'Création…' : 'Créer le retour'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                /* ── Base ── */
                .rc-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-width: 720px;
                    margin: 0 auto;
                    padding: 0.75rem;
                }

                /* ── Header ── */
                .rc-back {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.75rem;
                    color: var(--text-3);
                    text-decoration: none;
                    margin-bottom: 0.5rem;
                    transition: color 0.2s;
                }
                .rc-back:hover { color: #e8742a; }
                .rc-title {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--text-1);
                    line-height: 1.1;
                    margin-bottom: 0.2rem;
                }
                .rc-subtitle { font-size: 0.78rem; color: var(--text-3); }

                /* ── Card ── */
                .rc-card {
                    background: var(--bg-card);
                    border-radius: 16px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .rc-card-head {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 1rem 1rem 0.85rem;
                    border-bottom: 1px solid var(--border);
                }
                .rc-step-num {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #e8742a, #f5924a);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .rc-card-title {
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: var(--text-1);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .rc-card-sub { font-size: 0.72rem; color: var(--text-3); margin-top: 2px; }
                .rc-card-head > .rc-badge { margin-left: auto; flex-shrink: 0; }
                .rc-card-body { padding: 1rem; display: flex; flex-direction: column; }
                .rc-card-footer {
                    padding: 0.85rem 1rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }

                /* ── Badges ── */
                .rc-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.6rem;
                    font-weight: 700;
                    padding: 0.2rem 0.55rem;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .rc-badge--gray   { background: var(--bg-card-2); color: var(--text-3); border: 1px solid var(--border); }
                .rc-badge--orange { background: rgba(232,116,42,0.12); color: #e8742a; }
                .rc-badge--auto   { background: rgba(30,158,106,0.1); color: #1e9e6a; }
                .rc-badge--manual { background: rgba(232,116,42,0.1); color: #e8742a; }

                /* ── Form elements ── */
                .rc-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
                .rc-form-group--full { grid-column: 1 / -1; }
                .rc-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-3);
                }
                .rc-select-wrap { position: relative; }
                .rc-select-wrap--sm { display: inline-block; }
                .rc-select-icon {
                    position: absolute;
                    right: 0.6rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-3);
                    pointer-events: none;
                }
                .rc-select, .rc-input, .rc-textarea {
                    width: 100%;
                    padding: 0.6rem 0.85rem;
                    font-size: 0.85rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    color: var(--text-1);
                    transition: all 0.2s;
                    appearance: none;
                }
                .rc-select { padding-right: 2rem; }
                .rc-select--sm {
                    padding: 0.4rem 1.8rem 0.4rem 0.6rem;
                    font-size: 0.75rem;
                    border-radius: 8px;
                    width: auto;
                }
                .rc-select:focus, .rc-input:focus, .rc-textarea:focus {
                    outline: none;
                    border-color: #e8742a;
                    box-shadow: 0 0 0 3px rgba(232,116,42,0.1);
                }
                .rc-select--error, .rc-input--error { border-color: #d63b3b; }
                .rc-error { font-size: 0.68rem; color: #d63b3b; }

                /* ── Info banner ── */
                .rc-info-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    background: rgba(30,158,106,0.07);
                    border: 1px solid rgba(30,158,106,0.2);
                    border-radius: 8px;
                    padding: 0.6rem 0.75rem;
                    font-size: 0.75rem;
                    color: #1e9e6a;
                    margin-top: 0.6rem;
                }
                .rc-info-banner svg { flex-shrink: 0; margin-top: 1px; }
                .rc-error-banner {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(214,59,59,0.07);
                    border: 1px solid rgba(214,59,59,0.2);
                    border-radius: 8px;
                    padding: 0.6rem 0.75rem;
                    font-size: 0.75rem;
                    color: #d63b3b;
                    margin: 0.5rem 1rem;
                }

                /* ── Lines list ── */
                .rc-lines-list { display: flex; flex-direction: column; }
                .rc-line {
                    padding: 0.85rem 1rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                    transition: background 0.15s;
                }
                .rc-line--auto   { border-left: 3px solid #1e9e6a; }
                .rc-line--manual { border-left: 3px solid #e8742a; }
                .rc-line:hover   { background: var(--bg-card-2); }

                .rc-line-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                }
                .rc-line-product { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
                .rc-line-name { font-weight: 600; font-size: 0.88rem; color: var(--text-1); }
                .rc-line-remove {
                    width: 26px; height: 26px;
                    display: flex; align-items: center; justify-content: center;
                    background: transparent; border: none;
                    color: var(--text-3); cursor: pointer; border-radius: 6px;
                    transition: all 0.15s; flex-shrink: 0;
                }
                .rc-line-remove:hover { background: rgba(214,59,59,0.1); color: #d63b3b; }

                .rc-line-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; }
                .rc-meta-item {
                    font-size: 0.68rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 0.15rem 0.5rem;
                    color: var(--text-3);
                }
                .rc-meta-item--expired { background: rgba(214,59,59,0.08); border-color: rgba(214,59,59,0.25); color: #d63b3b; }

                .rc-line-controls {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }
                .rc-ctrl-group { display: flex; flex-direction: column; gap: 0.25rem; }
                .rc-ctrl-group--wide { flex: 1; min-width: 130px; }
                .rc-ctrl-label {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-3);
                }
                .rc-auto-hint { margin-left: 0.2rem; cursor: help; }
                .rc-ctrl-value {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-2);
                    padding: 0.4rem 0;
                }
                .rc-qty-input {
                    width: 72px;
                    padding: 0.45rem 0.5rem;
                    text-align: center;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    background: var(--bg-card);
                    color: var(--text-1);
                    transition: all 0.2s;
                }
                .rc-qty-input:focus { outline: none; border-color: #e8742a; box-shadow: 0 0 0 3px rgba(232,116,42,0.1); }
                .rc-qty-input--active { border-color: #e8742a; color: #e8742a; font-weight: 700; }

                .rc-notes-input {
                    padding: 0.45rem 0.75rem;
                    font-size: 0.78rem;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    background: transparent;
                    color: var(--text-2);
                    width: 100%;
                    transition: all 0.2s;
                }
                .rc-notes-input:focus { outline: none; border-color: var(--border); background: var(--bg-card); }
                .rc-notes-input::placeholder { color: var(--text-3); font-style: italic; }

                /* ── Add button ── */
                .rc-btn-add {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1rem;
                    border: 1.5px dashed rgba(232,116,42,0.4);
                    background: transparent;
                    color: #e8742a;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .rc-btn-add:hover {
                    border-color: #e8742a;
                    background: rgba(232,116,42,0.05);
                }

                /* ── Manual form ── */
                .rc-manual-form {
                    background: var(--bg-card);
                    border: 1.5px solid rgba(232,116,42,0.2);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .rc-manual-form-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: rgba(232,116,42,0.05);
                    border-bottom: 1px solid rgba(232,116,42,0.15);
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: #e8742a;
                }
                .rc-manual-close {
                    margin-left: auto;
                    background: transparent;
                    border: none;
                    color: var(--text-3);
                    cursor: pointer;
                    padding: 0.2rem;
                    border-radius: 4px;
                    display: flex;
                }
                .rc-manual-close:hover { color: #d63b3b; }
                .rc-manual-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    padding: 0.85rem;
                }
                .rc-manual-actions {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                    padding: 0.75rem 0.85rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }

                /* ── Upload ── */
                .rc-upload-zone {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1.5rem;
                    border: 2px dashed var(--border);
                    border-radius: 12px;
                    cursor: pointer;
                    color: var(--text-3);
                    font-size: 0.8rem;
                    transition: all 0.2s;
                }
                .rc-upload-zone:hover { border-color: #e8742a; color: #e8742a; background: rgba(232,116,42,0.02); }
                .rc-upload-zone svg { color: #e8742a; }
                .rc-photo-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }
                .rc-photo-item { position: relative; }
                .rc-photo-thumb {
                    width: 64px; height: 64px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                }
                .rc-photo-remove {
                    position: absolute;
                    top: -6px; right: -6px;
                    width: 18px; height: 18px;
                    background: #d63b3b; color: white;
                    border: none; border-radius: 50%;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0;
                }

                /* ── Summary + Actions ── */
                .rc-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding-bottom: 2rem;
                }
                .rc-summary-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    padding: 0.4rem 1rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-2);
                    align-self: center;
                }
                .rc-summary-sep { color: var(--text-3); }
                .rc-actions-btns {
                    display: flex;
                    gap: 0.75rem;
                }
                .rc-btn-ghost {
                    flex: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1.5px solid var(--border);
                    border-radius: 12px;
                    font-size: 0.82rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rc-btn-ghost:hover { background: var(--bg-card-2); }
                .rc-btn-primary {
                    flex: 2;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: linear-gradient(135deg, #e8742a, #f5924a);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.82rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.25s;
                    box-shadow: 0 4px 12px rgba(232,116,42,0.25);
                }
                .rc-btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(232,116,42,0.35);
                }
                .rc-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
                .rc-btn-confirm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #e8742a, #f5924a);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rc-btn-confirm:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(232,116,42,0.3); }

                .rc-spinner {
                    width: 15px; height: 15px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: rc-spin 0.7s linear infinite;
                }
                @keyframes rc-spin { to { transform: rotate(360deg); } }

                /* ── Desktop ── */
                @media (min-width: 640px) {
                    .rc-page { padding: 1.5rem; }
                    .rc-manual-grid { grid-template-columns: 1fr 1fr 1fr; }
                    .rc-line-controls { flex-wrap: nowrap; }
                    .rc-actions { flex-direction: row; align-items: center; justify-content: space-between; }
                    .rc-actions-btns { flex: 0 0 auto; }
                    .rc-btn-ghost, .rc-btn-primary { flex: none; }
                }

                /* Expired Stock Section */
                .rc-expired-section {
                    border-top: 1px solid var(--border);
                    padding-top: 1rem;
                    margin-bottom: 1rem;
                }
                .rc-expired-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    color: #d63b3b;
                    font-weight: 700;
                    font-size: 0.85rem;
                }
                .rc-btn-add-all {
                    margin-left: auto;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.75rem;
                    background: rgba(214, 59, 59, 0.08);
                    color: #d63b3b;
                    border: 1px solid rgba(214, 59, 59, 0.2);
                    border-radius: 8px;
                    font-size: 0.72rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rc-btn-add-all:hover {
                    background: rgba(214, 59, 59, 0.12);
                    border-color: #d63b3b;
                }
                .rc-expired-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 0.5rem;
                    background: rgba(214, 59, 59, 0.03);
                    border-radius: 8px;
                }
                .rc-expired-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                }
                .rc-expired-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                    flex: 1;
                }
                .rc-expired-name {
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: var(--text-1);
                }
                .rc-expired-meta {
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .rc-btn-add-item {
                    flex-shrink: 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.35rem 0.6rem;
                    background: rgba(214, 59, 59, 0.1);
                    color: #d63b3b;
                    border: 1px solid rgba(214, 59, 59, 0.2);
                    border-radius: 6px;
                    font-size: 0.68rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rc-btn-add-item:hover {
                    background: rgba(214, 59, 59, 0.15);
                }
            `}</style>
        </>
    );
}
