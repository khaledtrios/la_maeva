import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm, router } from '@inertiajs/react';
import { X, Plus, Trash2, Loader2, Search, ChevronDown } from 'lucide-react';
import type { Product, Ingredient, RecipeLine } from '@/types';

interface RecipeModalProps {
    open: boolean;
    onClose: () => void;
    product: Product | null;
    ingredients: Ingredient[];
    initialRecipeLines?: RecipeLine[];
}

interface RecipeLineForm {
    id?: number;
    ingredient_id: string;
    quantite: string;
}

// Les visites Inertia sont préfixées automatiquement (slug du store ou /store)
// par l'intercepteur de app.tsx, mais PAS un `fetch` natif : on construit donc
// ici le préfixe de la zone courante pour que la lecture de la recette tombe
// sur la bonne route.
const RESERVED_SEGMENTS = ['store', 'super-admin', 'register', 'login'];

function areaPrefix(): string {
    const first = window.location.pathname.split('/').filter(Boolean)[0];
    if (!first) return '';
    if (first === 'store') return '/store';
    if (RESERVED_SEGMENTS.includes(first)) return '';
    return `/${first}`;
}

// ─── Searchable Select ────────────────────────────────────────────────────────

interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Ingredient[];
    placeholder?: string;
}

function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = 'Ingrédient...',
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.id.toString() === value);

    const filtered = options.filter((o) =>
        o.nom.toLowerCase().includes(query.toLowerCase()),
    );

    // Positionner le dropdown en fonction du trigger
    const computePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 280; // max estimé

        if (spaceBelow >= dropdownHeight || spaceBelow >= 160) {
            // Ouvre vers le bas
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 99999,
            });
        } else {
            // Ouvre vers le haut
            setDropdownStyle({
                position: 'fixed',
                bottom: window.innerHeight - rect.top + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 99999,
            });
        }
    };

    const handleOpen = () => {
        computePosition();
        setOpen(true);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelect = (id: string) => {
        onChange(id);
        setOpen(false);
        setQuery('');
    };

    // Fermer au clic extérieur
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            )
                return;
            setOpen(false);
            setQuery('');
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Recalculer si scroll/resize
    useEffect(() => {
        if (!open) return;
        const update = () => computePosition();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    const dropdown = open && (
        <div className="ss-dropdown" ref={dropdownRef} style={dropdownStyle}>
            <div className="ss-search-wrap">
                <Search
                    size={13}
                    strokeWidth={1.5}
                    className="ss-search-icon"
                />
                <input
                    ref={inputRef}
                    className="ss-search-input"
                    type="text"
                    placeholder="Rechercher..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setOpen(false);
                            setQuery('');
                        }
                        if (e.key === 'Enter' && filtered.length === 1) {
                            handleSelect(filtered[0].id.toString());
                        }
                    }}
                />
            </div>
            <ul className="ss-list" role="listbox">
                {filtered.length === 0 ? (
                    <li className="ss-empty">Aucun résultat</li>
                ) : (
                    filtered.map((ing) => (
                        <li
                            key={ing.id}
                            role="option"
                            aria-selected={ing.id.toString() === value}
                            className={`ss-option ${ing.id.toString() === value ? 'ss-option--selected' : ''}`}
                            onMouseDown={() => handleSelect(ing.id.toString())}
                        >
                            <span className="ss-option-name">
                                {ing.nom}
                                {ing.unite && (
                                    <span className="ss-option-unit">
                                        {' '}
                                        ({ing.unite})
                                    </span>
                                )}
                            </span>
                            {ing.prix_unitaire && (
                                <span className="ss-option-price">
                                    {ing.prix_unitaire.toFixed(2)} €
                                </span>
                            )}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );

    return (
        <div className="ss-root">
            <button
                ref={triggerRef}
                type="button"
                className={`ss-trigger ${open ? 'ss-trigger--open' : ''}`}
                onClick={handleOpen}
            >
                <span
                    className={`ss-trigger-label ${!selected ? 'ss-trigger-label--placeholder' : ''}`}
                >
                    {selected
                        ? selected.nom +
                          (selected.unite ? ` (${selected.unite})` : '')
                        : placeholder}
                </span>
                <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className={`ss-chevron ${open ? 'ss-chevron--up' : ''}`}
                />
            </button>

            {/* Portal : rendu directement dans <body>, hors de tout overflow hidden */}
            {typeof document !== 'undefined' &&
                createPortal(dropdown, document.body)}
        </div>
    );
}

// ─── RecipeModal ──────────────────────────────────────────────────────────────

export default function RecipeModal({
    open,
    onClose,
    product,
    ingredients,
    initialRecipeLines = [],
}: RecipeModalProps) {
    const [localLines, setLocalLines] = useState<RecipeLineForm[]>([]);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        lignes: [] as Array<{ ingredient_id: number; quantite: number }>,
    });

    useEffect(() => {
        if (open && product) {
            if (initialRecipeLines.length > 0) {
                setLocalLines(
                    initialRecipeLines.map((line) => ({
                        id: line.id,
                        ingredient_id: line.ingredient_id.toString(),
                        quantite: line.quantite.toString(),
                    })),
                );
            } else {
                setLocalLines([{ ingredient_id: '', quantite: '' }]);
            }
        }
    }, [open, product, initialRecipeLines]);

    useEffect(() => {
        if (open && product && initialRecipeLines.length === 0) {
            setLoading(true);
            fetch(`${areaPrefix()}/products/${product!.id}/recipe`)
                .then((res) => res.json())
                .then((data: RecipeLine[]) => {
                    setLocalLines(
                        data.map((line) => ({
                            id: line.id,
                            ingredient_id: line.ingredient_id.toString(),
                            quantite: line.quantite.toString(),
                        })),
                    );
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [open, product, initialRecipeLines.length]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    const addLine = () => {
        setLocalLines([...localLines, { ingredient_id: '', quantite: '' }]);
    };

    const removeLine = (index: number) => {
        if (localLines.length > 1) {
            setLocalLines(localLines.filter((_, i) => i !== index));
        }
    };

    const updateLine = (
        index: number,
        field: keyof RecipeLineForm,
        value: string,
    ) => {
        const newLines = [...localLines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLocalLines(newLines);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const validLines = localLines.filter(
            (l) => l.ingredient_id && l.quantite && Number(l.quantite) > 0,
        );
        if (validLines.length === 0) return;
        const payload = {
            lignes: validLines.map((l) => ({
                ingredient_id: Number(l.ingredient_id),
                quantite: Number(l.quantite),
            })),
        };
        router.put(`/products/${product!.id}/recipe`, payload, {
            onSuccess: () => onClose(),
            preserveScroll: true,
        });
    };

    const getLineCost = (line: RecipeLineForm): number => {
        const ing = ingredients.find(
            (i) => i.id.toString() === line.ingredient_id,
        );
        if (!ing || !ing.prix_unitaire) return 0;
        return (ing.prix_unitaire || 0) * Number(line.quantite || 0);
    };

    const totalCost = localLines.reduce(
        (sum, line) => sum + getLineCost(line),
        0,
    );

    if (!open || !product) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal modal-recipe"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-title-area">
                        <h3 className="modal-title">Recette : {product.nom}</h3>
                        {product.code && (
                            <span className="product-code">{product.code}</span>
                        )}
                    </div>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={16} strokeWidth={1.5} />
                    </button>
                </div>

                {loading ? (
                    <div className="modal-body loading-state">
                        <Loader2
                            className="animate-spin"
                            size={32}
                            strokeWidth={1.5}
                        />
                        <p>Chargement de la recette...</p>
                    </div>
                ) : (
                    <form onSubmit={submit}>
                        <div className="modal-body">
                            {localLines.some(
                                (l) => l.ingredient_id && l.quantite,
                            ) && (
                                <div className="recipe-summary">
                                    <span className="recipe-summary-label">
                                        Coût total estimé
                                    </span>
                                    <span className="recipe-summary-value">
                                        {totalCost.toFixed(2)} €
                                    </span>
                                </div>
                            )}

                            <div className="recipe-lines">
                                {localLines.map((line, index) => {
                                    const selectedIngredient = ingredients.find(
                                        (i) =>
                                            i.id.toString() ===
                                            line.ingredient_id,
                                    );
                                    return (
                                        <div
                                            key={index}
                                            className="recipe-line"
                                        >
                                            <div className="recipe-line-select">
                                                <SearchableSelect
                                                    value={line.ingredient_id}
                                                    onChange={(val) =>
                                                        updateLine(
                                                            index,
                                                            'ingredient_id',
                                                            val,
                                                        )
                                                    }
                                                    options={ingredients}
                                                />
                                            </div>

                                            <div className="recipe-line-quantity">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0.001"
                                                    className="form-input"
                                                    placeholder="Qté"
                                                    value={line.quantite}
                                                    onChange={(e) =>
                                                        updateLine(
                                                            index,
                                                            'quantite',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                <span className="quantity-unit">
                                                    {selectedIngredient?.unite ||
                                                        'unité'}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn-remove-line"
                                                onClick={() =>
                                                    removeLine(index)
                                                }
                                                disabled={
                                                    localLines.length === 1
                                                }
                                                title={
                                                    localLines.length === 1
                                                        ? 'Au moins une ligne requise'
                                                        : 'Supprimer'
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                className="btn-add-line"
                                onClick={addLine}
                            >
                                <Plus size={16} strokeWidth={1.5} />
                                <span>Ajouter un ingrédient</span>
                            </button>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-neutral"
                                onClick={onClose}
                                disabled={form.processing}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={
                                    form.processing || localLines.length === 0
                                }
                            >
                                {form.processing
                                    ? 'Enregistrement...'
                                    : 'Enregistrer la recette'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style>{`
        /* ── Modal ── */
        .modal-recipe { max-width: 520px; }
        .modal-title-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .product-code {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-3);
          background: var(--bg-card-2);
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
        }
        .recipe-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(232, 116, 42, 0.08), rgba(232, 116, 42, 0.04));
          border: 1px solid rgba(232, 116, 42, 0.15);
          border-radius: 10px;
          margin-bottom: 1rem;
        }
        .recipe-summary-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-2);
        }
        .recipe-summary-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--orange);
        }
        .recipe-lines {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .recipe-line {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .recipe-line-select { flex: 1; min-width: 0; }
        .recipe-line-quantity {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          width: 120px;
          flex-shrink: 0;
        }
        .recipe-line-quantity .form-input {
          width: 100%;
          height: 36px;
          text-align: right;
          box-sizing: border-box;
        }
        .quantity-unit {
          font-size: 0.75rem;
          color: var(--text-3);
          white-space: nowrap;
        }
        .btn-remove-line {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          background: transparent;
          border: 1px solid rgba(214, 59, 59, 0.3);
          border-radius: 8px;
          color: var(--danger);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-remove-line:hover:not(:disabled) { background: rgba(214, 59, 59, 0.1); }
        .btn-remove-line:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-add-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          padding: 0.6rem;
          background: transparent;
          border: 1px dashed var(--border);
          border-radius: 10px;
          color: var(--orange);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-line:hover {
          background: rgba(232, 116, 42, 0.05);
          border-color: var(--orange);
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          color: var(--text-3);
        }

        /* ── Searchable Select ── */
        .ss-root {
          position: relative;
          width: 100%;
        }
        .ss-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.4rem;
          width: 100%;
          height: 36px;
          min-height: 36px;
          padding: 0 0.65rem;
          box-sizing: border-box;
          background: var(--bg-input, var(--bg-card-2));
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          text-align: left;
        }
        .ss-trigger:hover { border-color: var(--orange); }
        .ss-trigger--open {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.12);
        }
        .ss-trigger-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.82rem;
          color: var(--text-1);
        }
        .ss-trigger-label--placeholder { color: var(--text-3); }
        .ss-chevron {
          color: var(--text-3);
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .ss-chevron--up { transform: rotate(180deg); }

        .ss-dropdown {
          background: var(--bg-card, var(--bg-card-2));
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          overflow: hidden;
        }
        .ss-search-wrap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.65rem;
          border-bottom: 1px solid var(--border);
        }
        .ss-search-icon { color: var(--text-3); flex-shrink: 0; }
        .ss-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.82rem;
          color: var(--text-1);
          outline: none;
        }
        .ss-search-input::placeholder { color: var(--text-3); }

        .ss-list {
          list-style: none;
          margin: 0;
          padding: 0.3rem;
          max-height: 220px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .ss-list::-webkit-scrollbar { width: 4px; }
        .ss-list::-webkit-scrollbar-track { background: transparent; }
        .ss-list::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        .ss-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.45rem 0.6rem;
          border-radius: 7px;
          cursor: pointer;
          transition: background 0.12s;
          font-size: 0.82rem;
        }
        .ss-option:hover { background: rgba(232, 116, 42, 0.07); }
        .ss-option--selected {
          background: rgba(232, 116, 42, 0.12);
          color: var(--orange);
        }
        .ss-option-name { color: var(--text-1); }
        .ss-option--selected .ss-option-name { color: var(--orange); }
        .ss-option-unit {
          color: var(--text-3);
          font-size: 0.75rem;
        }
        .ss-option-price {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-3);
          white-space: nowrap;
        }
        .ss-empty {
          padding: 0.75rem 0.6rem;
          font-size: 0.8rem;
          color: var(--text-3);
          text-align: center;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .recipe-line { flex-wrap: wrap; }
          .recipe-line-select { width: 100%; flex: unset; }
          .recipe-line-quantity { flex: 1; width: auto; }
        }
      `}</style>
        </div>
    );
}
