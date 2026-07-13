import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { StatusBadge } from '@/Components/UI';
import { useAuth } from '@/hooks/useAuth';
import {
    Truck,
    Plus,
    X,
    ChevronDown,
    ChevronUp,
    Package,
    Calendar as CalendarIcon,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Search,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { store, status } from '@/routes/expeditions';
import type { Expedition, Entity, ProductWithStock } from '@/types';

interface ProductWithStock extends Product {
    category: Category;
    disponible: number; // Quantité disponible en stock
}

interface ExpeditionsIndexProps {
    expeditions: Expedition[];
    boulangeries: Entity[];
    availableProducts: ProductWithStock[]; // Produits disponibles (stock > 0)
    filters?: {
        date?: string;
        boulangerie_id?: string;
        statut?: string;
    };
}

export default function ExpeditionsIndex({
    expeditions,
    boulangeries,
    availableProducts,
    filters: initialFilters = {},
}: ExpeditionsIndexProps) {
    const { hasRole } = useAuth();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [selectedExpedition, setSelectedExpedition] =
        useState<Expedition | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        date: initialFilters.date || '',
        boulangerie_id: initialFilters.boulangerie_id || '',
        statut: initialFilters.statut || '',
    });
    const [search, setSearch] = useState('');

    const filteredExpeditions = expeditions.filter((exp) => {
        if (filters.date && exp.date !== filters.date) return false;
        if (
            filters.boulangerie_id &&
            exp.boulangerie_id !== parseInt(filters.boulangerie_id)
        )
            return false;
        if (filters.statut && exp.statut !== filters.statut) return false;
        return true;
    });

    const searchFiltered = useMemo(
        () =>
            !search
                ? filteredExpeditions
                : filteredExpeditions.filter((exp) =>
                      (exp.boulangerie?.nom || '')
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                  ),
        [filteredExpeditions, search],
    );

    const form = useForm({
        boulangerie_id: '',
        date: new Date().toISOString().split('T')[0],
        lines: [] as Array<{
            product_id: number;
            quantite: number;
            error?: string;
        }>,
    });

    const addLine = () => {
        form.setData('lines', [
            ...form.data.lines,
            { product_id: 0, quantite: 1, error: '' },
        ]);
    };

    const removeLine = (index: number) => {
        form.setData(
            'lines',
            form.data.lines.filter((_, i) => i !== index),
        );
    };

    const updateLine = (
        index: number,
        field: 'product_id' | 'quantite',
        value: number | string,
    ) => {
        const newLines = [...form.data.lines];
        const numValue = Number(value);
        newLines[index] = {
            ...newLines[index],
            [field]: numValue,
        };

        // Validation temps réel: vérifier stock disponible
        if (field === 'product_id' || field === 'quantite') {
            const productId = newLines[index].product_id;
            const quantite = newLines[index].quantite;
            if (productId > 0 && quantite > 0) {
                const product = getProduct(productId);
                if (product && quantite > product.disponible) {
                    newLines[index].error =
                        `Stock insuffisant. Disponible: ${product.disponible}`;
                } else {
                    newLines[index].error = '';
                }
            } else {
                newLines[index].error = '';
            }
        }

        form.setData('lines', newLines);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.boulangerie_id || form.data.lines.length === 0) return;

        // Vérifier les erreurs de stock (validation temps réel)
        const hasErrors = form.data.lines.some(
            (l) => l.product_id > 0 && l.error,
        );
        if (hasErrors) {
            setServerError(
                'Veuillez corriger les erreurs de stock avant de continuer.',
            );
            return;
        }

        setServerError(null);
        const validLines = form.data.lines.filter(
            (l) => l.product_id > 0 && l.quantite > 0,
        );
        if (validLines.length === 0) return;
        form.setData('lines', validLines);
        form.post(store.url(), {
            onSuccess: () => {
                form.reset('boulangerie_id', 'lines');
                form.setData('lines', []);
                setAddModalOpen(false);
                setServerError(null);
            },
            onError: (errors) => {
                // Les erreurs viennent du serveur (ValidationException)
                // Format attendu: { lines: { 0: { quantite: ["message"] } } } ou errors.global
                console.error('Erreurs serveur:', errors);

                // Mapper les erreurs vers les lignes
                if (errors.lines) {
                    const newLines = [...form.data.lines];
                    Object.keys(errors.lines).forEach((idxStr) => {
                        const idx = parseInt(idxStr, 10);
                        const lineErrors = errors.lines[idx];
                        if (lineErrors && newLines[idx]) {
                            newLines[idx] = {
                                ...newLines[idx],
                                error:
                                    lineErrors.quantite?.[0] ||
                                    lineErrors[Object.keys(lineErrors)[0]] ||
                                    'Erreur',
                            };
                        }
                    });
                    form.setData('lines', newLines);
                }

                // Erreur globale?
                if (errors.error || errors.message) {
                    setServerError(
                        errors.error ||
                            errors.message ||
                            'Une erreur est survenue.',
                    );
                }
            },
        });
    };

    const openSendModal = (expedition: Expedition) => {
        setSelectedExpedition(expedition);
        setSendModalOpen(true);
    };

    const confirmSendExpedition = () => {
        if (!selectedExpedition) return;
        router.put(
            status.url(selectedExpedition.id),
            { statut: 'ENVOYEE' },
            {
                onSuccess: () => {
                    setSendModalOpen(false);
                    setSelectedExpedition(null);
                    setExpandedId(null);
                },
            },
        );
    };

    const applyFilters = () => {
        const queryParams = new URLSearchParams();
        if (filters.date) queryParams.append('date', filters.date);
        if (filters.boulangerie_id)
            queryParams.append('boulangerie_id', filters.boulangerie_id);
        if (filters.statut) queryParams.append('statut', filters.statut);

        router.get(window.location.pathname, Object.fromEntries(queryParams), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilters({ date: '', boulangerie_id: '', statut: '' });
        router.get(
            window.location.pathname,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const totalLines = (exp: Expedition): number => {
        return (exp.lines || []).reduce((sum, l) => sum + (l.quantite || 0), 0);
    };

    const toggleDetail = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getProduct = (productId: number): ProductWithStock | undefined => {
        return availableProducts.find((p) => p.id === productId);
    };

    const productName = (productId: number): string => {
        const p = getProduct(productId);
        return p ? p.nom : `Produit #${productId}`;
    };

    // Obtenir la DLC calculée pour une ligne
    const getDLCForProduct = (productId: number): string => {
        const p = getProduct(productId);
        if (!p?.dlc) return '-';
        const date = new Date();
        date.setDate(date.getDate() + p.dlc);
        return date.toLocaleDateString('fr-FR');
    };

    // Calcule la DLC : date de l'expédition + dlc du produit (en jours)
    const calculateDLC = (dateStr: string, dlc: number | null): string => {
        if (!dateStr || dlc === null) return '-';
        const date = new Date(dateStr);
        date.setDate(date.getDate() + dlc);
        return date.toLocaleDateString('fr-FR');
    };

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case 'BROUILLON':
                return 'var(--orange)';
            case 'ENVOYEE':
                return 'var(--blue)';
            case 'RECUE':
                return 'var(--success)';
            default:
                return 'var(--text-3)';
        }
    };

    const getStatusLabel = (statut: string) => {
        switch (statut) {
            case 'BROUILLON':
                return 'Brouillon';
            case 'ENVOYEE':
                return 'Envoyée';
            case 'RECUE':
                return 'Reçue';
            default:
                return statut;
        }
    };

    return (
        <div className="expeditions-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expéditions</h1>
                    <p className="page-subtitle">
                        Gestion des bons de livraison vers les boulangeries
                    </p>
                </div>
                {hasRole('ADMIN', 'RESP_LABO') && (
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={16} strokeWidth={1.5} />
                        <span>Nouvelle expédition</span>
                    </button>
                )}
            </div>

            {/* ── FILTRES ── */}
            <div className="filters-section">
                <div className="filters-header">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-secondary"
                    >
                        <Filter size={14} strokeWidth={1.5} />
                        Filtrer
                        <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            className={`filter-chevron ${showFilters ? 'rotate' : ''}`}
                        />
                    </button>
                    <div className="search-wrap">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="finput finput--search"
                        />
                    </div>
                    {(filters.date ||
                        filters.boulangerie_id ||
                        filters.statut) && (
                        <button onClick={resetFilters} className="btn-ghost-sm">
                            <RefreshCw size={12} strokeWidth={1.5} />
                            Réinitialiser
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label className="filter-label">Date</label>
                                <div className="date-input-wrapper">
                                    <CalendarIcon size={14} strokeWidth={1.5} />
                                    <input
                                        type="date"
                                        value={filters.date}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                date: e.target.value,
                                            })
                                        }
                                        className="filter-input"
                                    />
                                </div>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">
                                    Boulangerie
                                </label>
                                <select
                                    value={filters.boulangerie_id}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            boulangerie_id: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">
                                        Toutes les boulangeries
                                    </option>
                                    {boulangeries.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">Statut</label>
                                <select
                                    value={filters.statut}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            statut: e.target.value,
                                        })
                                    }
                                    className="filter-select"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="BROUILLON">Brouillon</option>
                                    <option value="ENVOYEE">Envoyée</option>
                                    <option value="RECUE">Reçue</option>
                                </select>
                            </div>
                            <div className="filter-actions">
                                <button
                                    onClick={applyFilters}
                                    className="btn-primary"
                                >
                                    <Search size={14} strokeWidth={1.5} />
                                    Appliquer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── LISTE DES EXPÉDITIONS ── */}
            {searchFiltered.length === 0 ? (
                <div className="empty-state-card">
                    <Truck size={48} strokeWidth={1} />
                    <div className="empty-state-text">
                        {expeditions.length === 0
                            ? 'Aucune expédition enregistrée'
                            : search
                              ? 'Aucune expédition ne correspond à la recherche'
                              : 'Aucune expédition ne correspond aux filtres'}
                    </div>
                </div>
            ) : (
                <div className="expeditions-list">
                    {searchFiltered.map((exp) => (
                        <div key={exp.id} className="expedition-card">
                            {/* En-tête cliquable */}
                            <div
                                className="expedition-header"
                                onClick={() => toggleDetail(exp.id)}
                            >
                                <div className="expedition-info">
                                    <div className="expedition-title-row">
                                        <h3 className="expedition-title">
                                            {exp.boulangerie?.nom ||
                                                `Boulangerie #${exp.boulangerie_id}`}
                                        </h3>
                                        <span
                                            className="status-badge"
                                            style={{
                                                background: `${getStatusColor(exp.statut)}15`,
                                                color: getStatusColor(
                                                    exp.statut,
                                                ),
                                            }}
                                        >
                                            {getStatusLabel(exp.statut)}
                                        </span>
                                    </div>
                                    <div className="expedition-meta">
                                        <span className="meta-item">
                                            <CalendarIcon
                                                size={14}
                                                strokeWidth={1}
                                            />
                                            {new Date(
                                                exp.date,
                                            ).toLocaleDateString('fr-FR')}
                                        </span>
                                        <span className="meta-item">
                                            <Package
                                                size={14}
                                                strokeWidth={1}
                                            />
                                            {exp.lines?.length || 0}{' '}
                                            référence(s)
                                        </span>
                                        <span className="meta-item">
                                            {totalLines(exp)} unités
                                        </span>
                                    </div>
                                </div>
                                <div className="expedition-toggle">
                                    {expandedId === exp.id ? (
                                        <ChevronUp
                                            size={20}
                                            strokeWidth={1.5}
                                        />
                                    ) : (
                                        <ChevronDown
                                            size={20}
                                            strokeWidth={1.5}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Détail des lignes */}
                            {expandedId === exp.id && (
                                <div className="expedition-details">
                                    <div className="details-section">
                                        <div className="details-title">
                                            Détail du bon de livraison
                                        </div>
                                        {exp.lines && exp.lines.length > 0 ? (
                                            <table className="details-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produit</th>
                                                        <th className="text-right">
                                                            Quantité
                                                        </th>
                                                        <th className="text-right">
                                                            DLC
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {exp.lines.map((line) => {
                                                        // La DLC est déjà stockée dans line.dlc (propagée depuis production)
                                                        const dlcDate = line.dlc
                                                            ? new Date(
                                                                  line.dlc,
                                                              ).toLocaleDateString(
                                                                  'fr-FR',
                                                              )
                                                            : '-';
                                                        return (
                                                            <tr key={line.id}>
                                                                <td className="product-name">
                                                                    {line
                                                                        .product
                                                                        ?.nom ||
                                                                        productName(
                                                                            line.product_id,
                                                                        )}
                                                                </td>
                                                                <td className="quantity-value text-right">
                                                                    {
                                                                        line.quantite
                                                                    }{' '}
                                                                    u.
                                                                </td>
                                                                <td className="text-right">
                                                                    <span
                                                                        className={`tag ${
                                                                            line.dlc
                                                                                ? 'tag-success'
                                                                                : 'tag-muted'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            dlcDate
                                                                        }
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="no-lines">
                                                Aucune ligne
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions selon statut */}
                                    {exp.statut === 'BROUILLON' && (
                                        <div className="details-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSendModal(exp);
                                                }}
                                                className="btn-primary w-full"
                                            >
                                                <Truck
                                                    size={16}
                                                    strokeWidth={1.5}
                                                />
                                                Envoyer le bon de livraison
                                            </button>
                                        </div>
                                    )}

                                    {exp.statut === 'ENVOYEE' && (
                                        <div className="details-message info">
                                            <span>
                                                En attente de réception par la
                                                boulangerie
                                            </span>
                                        </div>
                                    )}

                                    {exp.statut === 'RECUE' && (
                                        <div className="details-message success">
                                            <CheckCircle
                                                size={16}
                                                strokeWidth={1.5}
                                            />
                                            <span>Réception confirmée</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action rapide si fermé et brouillon */}
                            {exp.statut === 'BROUILLON' &&
                                expandedId !== exp.id && (
                                    <div className="expedition-footer">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openSendModal(exp);
                                            }}
                                            className="btn-secondary w-full"
                                        >
                                            <Truck
                                                size={16}
                                                strokeWidth={1.5}
                                            />
                                            Envoyer le bon de livraison
                                        </button>
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL AJOUT EXPÉDITION ── */}
            {addModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setAddModalOpen(false)}
                >
                    <div
                        className="modal modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Nouvelle expédition
                                </h3>
                                <p className="modal-subtitle">
                                    Créer un bon de livraison pour une
                                    boulangerie
                                </p>
                            </div>
                            <button
                                onClick={() => setAddModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={submit}>
                            {serverError && (
                                <div className="modal-error-banner">
                                    {serverError}
                                </div>
                            )}
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Boulangerie destinataire{' '}
                                            <span className="text-orange">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={form.data.boulangerie_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    'boulangerie_id',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-select"
                                            required
                                        >
                                            <option value="">
                                                -- Choisir --
                                            </option>
                                            {boulangeries.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Date de livraison{' '}
                                            <span className="text-orange">
                                                *
                                            </span>
                                        </label>
                                        <div className="date-input-wrapper">
                                            <CalendarIcon
                                                size={16}
                                                strokeWidth={1.5}
                                            />
                                            <input
                                                type="date"
                                                value={form.data.date}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'date',
                                                        e.target.value,
                                                    )
                                                }
                                                className="date-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lines-section">
                                    <div className="lines-header">
                                        <span className="lines-title">
                                            Produits à expédier
                                        </span>
                                        <button
                                            type="button"
                                            onClick={addLine}
                                            className="btn-ghost-sm"
                                        >
                                            <Plus size={14} strokeWidth={1.5} />
                                            Ajouter un produit
                                        </button>
                                    </div>

                                    <div className="lines-list">
                                        {form.data.lines.map((line, i) => (
                                            <div key={i} className="line-row">
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) =>
                                                        updateLine(
                                                            i,
                                                            'product_id',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="form-select-sm"
                                                >
                                                    <option value="">
                                                        -- Produit --
                                                    </option>
                                                    {availableProducts.map(
                                                        (p) => (
                                                            <option
                                                                key={p.id}
                                                                value={p.id}
                                                            >
                                                                {p.nom} (
                                                                {p.disponible}{' '}
                                                                dispo.
                                                                {p.dlc
                                                                    ? ` — DLC: +${p.dlc}j`
                                                                    : ''}
                                                                )
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={line.quantite}
                                                    onChange={(e) =>
                                                        updateLine(
                                                            i,
                                                            'quantite',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="qty-input"
                                                    placeholder="Qté"
                                                />
                                                {line.error && (
                                                    <span className="line-error">
                                                        {line.error}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeLine(i)
                                                    }
                                                    className="btn-icon-danger"
                                                >
                                                    <X
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {form.data.lines.length === 0 && (
                                        <p className="lines-empty">
                                            Aucun produit ajouté
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="btn-neutral"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        !form.data.boulangerie_id ||
                                        form.data.lines.length === 0 ||
                                        form.data.lines.some(
                                            (l) => l.product_id > 0 && l.error,
                                        )
                                    }
                                    className="btn-primary"
                                >
                                    {form.processing ? (
                                        <span className="spinner" />
                                    ) : (
                                        <Truck size={16} strokeWidth={1.5} />
                                    )}
                                    {form.processing
                                        ? 'Création en cours…'
                                        : 'Créer le bon de livraison'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL CONFIRMATION ENVOI ── */}
            {sendModalOpen && selectedExpedition && (
                <div
                    className="modal-overlay"
                    onClick={() => setSendModalOpen(false)}
                >
                    <div
                        className="modal modal-success"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-success">
                            <div className="modal-icon-success">
                                <Truck size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => setSendModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <h3 className="modal-title-success">
                                Confirmer l'envoi
                            </h3>
                            <p className="modal-message">
                                Voulez-vous envoyer ce bon de livraison ?
                            </p>
                            <div className="send-preview">
                                <div className="send-preview-item">
                                    <span className="send-preview-label">
                                        Boulangerie :
                                    </span>
                                    <span className="send-preview-value">
                                        {selectedExpedition.boulangerie?.nom ||
                                            `Boulangerie #${selectedExpedition.boulangerie_id}`}
                                    </span>
                                </div>
                                <div className="send-preview-item">
                                    <span className="send-preview-label">
                                        Date :
                                    </span>
                                    <span className="send-preview-value">
                                        {new Date(
                                            selectedExpedition.date,
                                        ).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                <div className="send-preview-item">
                                    <span className="send-preview-label">
                                        Produits :
                                    </span>
                                    <span className="send-preview-value">
                                        {selectedExpedition.lines?.length || 0}{' '}
                                        référence(s) -{' '}
                                        {totalLines(selectedExpedition)} unités
                                    </span>
                                </div>
                            </div>
                            <p className="modal-message-subtle">
                                Une fois envoyé, la boulangerie pourra confirmer
                                la réception.
                            </p>
                        </div>
                        <div className="modal-footer-success">
                            <button
                                onClick={() => setSendModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmSendExpedition}
                                className="btn-primary"
                            >
                                <Truck size={16} strokeWidth={1.5} />
                                Confirmer l'envoi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .expeditions-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                /* Header */
                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.25rem;
                }
                .page-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-3);
                }

                /* Filters */
                .filters-section {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                }
                .filters-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .filter-chevron {
                    transition: transform 0.2s ease;
                }
                .filter-chevron.rotate {
                    transform: rotate(180deg);
                }
                .filters-panel {
                    padding: 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .filters-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    align-items: flex-end;
                }
                @media (min-width: 768px) {
                    .filters-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .filter-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                }
                .filter-input, .filter-select {
                    padding: 0.6rem 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                }
                .filter-input:focus, .filter-select:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .filter-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                @media (min-width: 768px) {
                    .filter-actions {
                        justify-content: flex-end;
                    }
                }

                /* Expedition cards */
                .expeditions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .expedition-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    overflow: hidden;
                    transition: all 0.25s ease;
                }
                .expedition-card:hover {
                    box-shadow: var(--shadow-sm);
                }
                .expedition-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1rem 1.25rem;
                    cursor: pointer;
                }
                .expedition-info {
                    flex: 1;
                }
                .expedition-title-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.5rem;
                }
                .expedition-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin: 0;
                }
                .status-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                }
                .expedition-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.75rem;
                    color: var(--text-3);
                }
                .expedition-toggle {
                    color: var(--text-3);
                    display: flex;
                    align-items: center;
                    margin-left: 0.75rem;
                }
                .expedition-details {
                    border-top: 1px solid var(--border);
                    padding: 1rem 1.25rem;
                    background: var(--bg-card-2);
                }
                .details-section {
                    margin-bottom: 1rem;
                }
                .details-title {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                    margin-bottom: 0.75rem;
                }
                .details-table {
                    width: 100%;
                    font-size: 0.85rem;
                }
                .details-table th {
                    text-align: left;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    padding: 0.5rem;
                    border-bottom: 1.5px solid var(--border);
                }
                .details-table th.text-right {
                    text-align: right;
                }
                .details-table td {
                    padding: 0.5rem;
                    border-bottom: 1px solid var(--border);
                }
                .details-table tr:last-child td {
                    border-bottom: none;
                }
                .product-name {
                    font-weight: 500;
                    color: var(--text-1);
                }
                .quantity-value {
                    font-weight: 600;
                    color: var(--orange);
                }
                .no-lines {
                    text-align: center;
                    color: var(--text-3);
                    font-size: 0.8rem;
                    padding: 0.5rem;
                }
                .details-actions {
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border);
                }
                .details-message {
                    padding: 0.75rem;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                }
                .details-message.info {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .details-message.success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .expedition-footer {
                    padding: 0.75rem 1.25rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-card-2);
                }

                /* Tags */
                .tag {
                    display: inline-block;
                    padding: 0.15rem 0.5rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .tag-success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .tag-muted {
                    background: var(--bg-card-2);
                    color: var(--text-3);
                }

                /* Empty state */
                .empty-state-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-3);
                }
                .empty-state-text {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                }
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                    border: 1.5px solid var(--orange);
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-secondary:hover {
                    background: var(--orange);
                    color: white;
                    transform: translateY(-2px);
                }
                .btn-ghost-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.4rem 0.8rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-ghost-sm:hover {
                    background: rgba(232, 116, 42, 0.1);
                }
                .btn-neutral {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
                }
                .btn-icon-danger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.4rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-icon-danger:hover {
                    background: rgba(214, 59, 59, 0.1);
                    transform: translateY(-1px);
                }
                .w-full {
                    width: 100%;
                }

                /* Form elements */
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                }
                @media (min-width: 640px) {
                    .form-row {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .form-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                }
                .form-select {
                    padding: 0.65rem 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                }
                .form-select:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .date-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0 0.75rem;
                    background: var(--bg-card);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .date-input-wrapper:focus-within {
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .date-input {
                    border: none;
                    background: transparent;
                    padding: 0.6rem 0;
                    font-size: 0.85rem;
                    width: 100%;
                    outline: none;
                }

                /* Lines section */
                .lines-section {
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1rem;
                }
                .lines-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }
                .lines-title {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--text-3);
                }
                .lines-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .line-row {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .line-error {
                    font-size: 0.7rem;
                    color: var(--danger);
                    width: 100%;
                    padding-left: 0.5rem;
                    margin-top: -0.25rem;
                }
                .form-select-sm {
                    flex: 1;
                    padding: 0.5rem 0.7rem;
                    border-radius: 8px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    font-size: 0.8rem;
                }
                .qty-input {
                    width: 80px;
                    padding: 0.5rem 0.5rem;
                    border-radius: 8px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    text-align: center;
                    font-size: 0.8rem;
                }
                .lines-empty {
                    text-align: center;
                    color: var(--text-3);
                    font-size: 0.8rem;
                    padding: 0.75rem;
                }

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
                    width: 100%;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .modal-lg {
                    max-width: 680px;
                }
                .modal-success {
                    max-width: 460px;
                    border: 1px solid rgba(232, 116, 42, 0.2);
                }
                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .modal-header-success {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 0.5rem;
                }
                .modal-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .modal-title-success {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--orange);
                    margin-bottom: 0.5rem;
                }
                .modal-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-3);
                    margin-top: 4px;
                }
                .modal-icon-success {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(232, 116, 42, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--orange);
                    margin: 0 auto;
                }
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
                .modal-close:hover {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-footer-success {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-message {
                    font-size: 0.95rem;
                    color: var(--text-2);
                    margin-bottom: 1rem;
                }
                .modal-message-subtle {
                    font-size: 0.75rem;
                    color: var(--text-3);
                    margin-top: 0.5rem;
                }

                /* Send preview */
                .send-preview {
                    background: var(--bg-card-2);
                    border-radius: 12px;
                    padding: 1rem;
                    margin: 1rem 0;
                    text-align: left;
                }
                .send-preview-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid var(--border);
                }
                .send-preview-item:last-child {
                    border-bottom: none;
                }
                .send-preview-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: var(--text-3);
                }
                .send-preview-value {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-1);
                }

                /* Utilities */
                .text-center {
                    text-align: center;
                }
                .text-right {
                    text-align: right;
                }
                .text-orange {
                    color: var(--orange);
                }

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
                /* Search input */
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 240px; }

                /* Error banner in modal */
                .modal-error-banner {
                    background: rgba(214, 59, 59, 0.1);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    color: #d63b3b;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

            `}</style>
        </div>
    );
}
