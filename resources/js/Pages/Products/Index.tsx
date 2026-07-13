import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { ConfirmDelete } from '@/Components/UI';
import { useAuth } from '@/hooks/useAuth';
import {
    ClipboardList,
    Trash2,
    Pencil,
    X,
    Plus,
    Cookie,
    Package,
    TrendingUp,
    AlertCircle,
    Search,
} from 'lucide-react';
import ProductFormModal from '@/Components/Forms/ProductFormModal';
import IngredientFormModal from '@/Components/Forms/IngredientFormModal';
import CategoryFormModal from '@/Components/Forms/CategoryFormModal';
import RecipeModal from '@/Components/Forms/RecipeModal';
import type { Product, Category, Ingredient, RecipeLine } from '@/types';

interface ProductsIndexProps {
    products: (Product & { category: Category })[];
    categories: Category[];
    ingredients: Ingredient[];
}

export default function ProductsIndex({
    products,
    categories,
    ingredients,
}: ProductsIndexProps) {
    const { hasRole } = useAuth();

    // ── Tab active ──
    const [activeTab, setActiveTab] = useState<
        'products' | 'ingredients' | 'categories'
    >('products');

    // ── Suppression ──
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<
        'product' | 'ingredient' | 'category'
    >('product');
    const [deleteName, setDeleteName] = useState('');

    // ── Modals ──
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] =
        useState<Ingredient | null>(null);

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );

    const [recipeModalOpen, setRecipeModalOpen] = useState(false);
    const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
    const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);

    // ── Search ──
    const [searchProducts, setSearchProducts] = useState('');
    const [searchIngredients, setSearchIngredients] = useState('');
    const [searchCategories, setSearchCategories] = useState('');

    const filteredProducts = useMemo(() =>
        !searchProducts
            ? products
            : products.filter(
                  (p) =>
                      p.nom.toLowerCase().includes(searchProducts.toLowerCase()) ||
                      (p.code && p.code.toLowerCase().includes(searchProducts.toLowerCase())),
              ),
    [products, searchProducts]);

    const filteredIngredients = useMemo(() =>
        !searchIngredients
            ? ingredients
            : ingredients.filter((i) =>
                  i.nom.toLowerCase().includes(searchIngredients.toLowerCase()),
              ),
    [ingredients, searchIngredients]);

    const filteredCategories = useMemo(() =>
        !searchCategories
            ? categories
            : categories.filter((c) =>
                  c.nom.toLowerCase().includes(searchCategories.toLowerCase()),
              ),
    [categories, searchCategories]);

    // Stats
    const statsByCategory = products.reduce(
        (acc, p) => {
            acc[p.category.nom] = (acc[p.category.nom] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    const totalProducts = products.length;
    const totalIngredients = ingredients.length;
    const totalCategories = categories.length;

    const formatPrice = (value: number | null | undefined): string => {
        if (!value && value !== 0) return '0.00';
        return Number(value).toFixed(2);
    };

    const margePercent = (
        pv: number | null | undefined,
        cr: number | null | undefined,
    ) => {
        const prix = Number(pv) || 0;
        const cout = Number(cr) || 0;
        if (prix <= 0) return 0;
        return Math.round(((prix - cout) / prix) * 100);
    };

    // ── Delete ──
    const openDeleteModal = (
        id: number,
        type: 'product' | 'ingredient' | 'category',
        name: string,
    ) => {
        setDeleteId(id);
        setDeleteType(type);
        setDeleteName(name);
    };

    // ── Products ──
    const openProductModal = (product?: Product) => {
        setEditingProduct(product || null);
        setProductModalOpen(true);
    };

    // ── Ingredients ──
    const openIngredientModal = (ingredient?: Ingredient) => {
        setEditingIngredient(ingredient || null);
        setIngredientModalOpen(true);
    };

    // ── Categories ──
    const openCategoryModal = (category?: Category) => {
        setEditingCategory(category || null);
        setCategoryModalOpen(true);
    };

    // ── Recipe ──
    const openRecipeModal = async (product: Product) => {
        setRecipeProduct(product);
        setRecipeLines([]); // reset before loading
        setRecipeModalOpen(true);
    };

    return (
        <div className="products-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Catalogue Produits</h1>
                    <p className="page-subtitle">
                        {totalProducts} produit{totalProducts > 1 ? 's' : ''} •{' '}
                        {totalIngredients} ingrédient
                        {totalIngredients > 1 ? 's' : ''} • {totalCategories}{' '}
                        catégorie{totalCategories > 1 ? 's' : ''}
                    </p>
                </div>
                {hasRole('ADMIN', 'RESP_LABO') && (
                    <div className="header-actions">
                        <button
                            className="btn-primary"
                            onClick={() => openProductModal()}
                        >
                            <Plus size={16} strokeWidth={1.5} />
                            <span>Nouveau produit</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Cookie size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Produits</div>
                        <div className="stat-value">{totalProducts}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <Package size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Ingrédients</div>
                        <div className="stat-value stat-value--success">
                            {totalIngredients}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <TrendingUp size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Marge moyenne</div>
                        <div className="stat-value">
                            {Math.round(
                                products.reduce(
                                    (acc, p) =>
                                        acc +
                                        margePercent(
                                            p.prix_vente,
                                            p.cout_revient,
                                        ),
                                    0,
                                ) / (products.length || 1),
                            )}
                            %
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <ClipboardList size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Catégories</div>
                        <div className="stat-value stat-value--success">
                            {totalCategories}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SUMMARY BY CATEGORY ── */}
            {Object.keys(statsByCategory).length > 0 && (
                <div className="summary-card">
                    <div className="summary-header">
                        <div className="summary-title">
                            <div className="summary-dot" />
                            <span>Répartition par catégorie</span>
                        </div>
                    </div>
                    <div className="summary-grid">
                        {Object.entries(statsByCategory).map(([cat, count]) => (
                            <div key={cat} className="category-stat-card">
                                <div className="category-stat-name">{cat}</div>
                                <div className="category-stat-value">
                                    {count}
                                </div>
                                <div className="category-stat-bar">
                                    <div
                                        className="category-stat-fill"
                                        style={{
                                            width: `${(count / totalProducts) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TABS ── */}
            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Produits
                </button>
                <button
                    className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ingredients')}
                >
                    Ingrédients
                </button>
                <button
                    className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    Catégories
                </button>
            </div>

            {/* ========================================= */}
            {/* ──── ONGLET PRODUITS ──── */}
            {/* ========================================= */}
            {activeTab === 'products' && (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Liste des produits</span>
                        </div>
                        <div className="header-actions">
                            <div className="search-wrap">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchProducts}
                                    onChange={(e) => setSearchProducts(e.target.value)}
                                    className="finput finput--search"
                                />
                            </div>
                            <div className="table-count">
                                {filteredProducts.length} produit
                                {filteredProducts.length > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="empty-state-card">
                            <Cookie size={48} strokeWidth={1} />
                            <div className="empty-state-text">
                                Aucun produit dans le catalogue
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="mobile-list">
                                {filteredProducts.map((p, i) => {
                                    const margePct = margePercent(
                                        p.prix_vente,
                                        p.cout_revient,
                                    );
                                    return (
                                        <div
                                            key={p.id}
                                            className="mobile-row"
                                            style={{
                                                animationDelay: `${i * 0.05}s`,
                                            }}
                                        >
                                            <div className="mobile-row-top">
                                                <span className="mobile-name">
                                                    {p.nom}
                                                </span>
                                                {p.code && (
                                                    <span className="lot-tag">
                                                        {p.code}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mobile-row-meta">
                                                <span className="meta-text">
                                                    {p.category.nom}
                                                </span>
                                                {p.dlc !== null && (
                                                    <span className="dlc-badge">
                                                        {p.dlc}j
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mobile-stats">
                                                <div className="mobile-stat">
                                                    <span className="mobile-stat-label">
                                                        Prix vente
                                                    </span>
                                                    <span className="mobile-stat-value">
                                                        {formatPrice(
                                                            p.prix_vente,
                                                        )}{' '}
                                                        €
                                                    </span>
                                                </div>
                                                <div className="mobile-stat-divider" />
                                                <div className="mobile-stat">
                                                    <span className="mobile-stat-label">
                                                        Coût
                                                    </span>
                                                    <span className="mobile-stat-value text-muted">
                                                        {(p.cout_revient ??
                                                            0) === 0
                                                            ? '-'
                                                            : `${formatPrice(p.cout_revient)} €`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mobile-margin">
                                                <span className="mobile-margin-label">
                                                    Marge
                                                </span>
                                                <span
                                                    className={`mobile-margin-value ${margePct >= 50 ? 'good' : margePct >= 30 ? 'avg' : 'low'}`}
                                                >
                                                    {margePct}%
                                                </span>
                                            </div>
                                            <div className="mobile-actions">
                                                <button
                                                    className="btn-ghost"
                                                    onClick={() =>
                                                        openRecipeModal(p)
                                                    }
                                                    title="Voir/éditer la recette"
                                                >
                                                    <ClipboardList
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                    &nbsp;
                                                    <span>Recette</span>
                                                </button>
                                                {hasRole(
                                                    'ADMIN',
                                                    'RESP_LABO',
                                                ) && (
                                                    <>
                                                        <button
                                                            className="btn-ghost"
                                                            onClick={() =>
                                                                openProductModal(
                                                                    p,
                                                                )
                                                            }
                                                            title="Modifier"
                                                        >
                                                            <Pencil
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            <span>
                                                                Modifier
                                                            </span>
                                                        </button>
                                                        <button
                                                            className="btn-icon-danger"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    p.id,
                                                                    'product',
                                                                    p.nom,
                                                                )
                                                            }
                                                            title="Supprimer"
                                                        >
                                                            <Trash2
                                                                size={14}
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Produit</th>
                                            <th>Catégorie</th>
                                            <th>Code</th>
                                            <th className="text-right">DLC</th>
                                            <th className="text-right">
                                                Prix vente
                                            </th>
                                            <th className="text-right">Coût</th>
                                            <th className="text-right">
                                                Marge
                                            </th>
                                            <th className="text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((p, i) => {
                                            const margePct = margePercent(
                                                p.prix_vente,
                                                p.cout_revient,
                                            );
                                            return (
                                                <tr
                                                    key={p.id}
                                                    style={{
                                                        animationDelay: `${i * 0.04}s`,
                                                    }}
                                                >
                                                    <td>
                                                        <span className="product-name">
                                                            {p.nom}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="category-name">
                                                            {p.category.nom}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted">
                                                        {p.code || '-'}
                                                    </td>
                                                    <td className="text-right">
                                                        {p.dlc !== null ? (
                                                            <span className="dlc-badge">
                                                                {p.dlc}j
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="text-success text-right">
                                                        {formatPrice(
                                                            p.prix_vente,
                                                        )}{' '}
                                                        €
                                                    </td>
                                                    <td className="text-muted text-right">
                                                        {(p.cout_revient ??
                                                            0) === 0
                                                            ? '-'
                                                            : `${formatPrice(p.cout_revient)} €`}
                                                    </td>
                                                    <td className="text-right">
                                                        <span
                                                            className={`margin-badge ${margePct >= 50 ? 'good' : margePct >= 30 ? 'avg' : 'low'}`}
                                                        >
                                                            {margePct}%
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="table-actions">
                                                            <button
                                                                className="btn-ghost-sm"
                                                                onClick={() =>
                                                                    openRecipeModal(
                                                                        p,
                                                                    )
                                                                }
                                                                title="Voir/éditer la recette"
                                                            >
                                                                <ClipboardList
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                                &nbsp; Recette
                                                            </button>
                                                            {hasRole(
                                                                'ADMIN',
                                                                'RESP_LABO',
                                                            ) && (
                                                                <>
                                                                    <button
                                                                        className="btn-ghost-sm"
                                                                        onClick={() =>
                                                                            openProductModal(
                                                                                p,
                                                                            )
                                                                        }
                                                                        title="Éditer"
                                                                    >
                                                                        <Pencil
                                                                            size={
                                                                                14
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </button>
                                                                    <button
                                                                        className="btn-icon-danger-sm"
                                                                        onClick={() =>
                                                                            openDeleteModal(
                                                                                p.id,
                                                                                'product',
                                                                                p.nom,
                                                                            )
                                                                        }
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                14
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ========================================= */}
            {/* ──── ONGLET INGRÉDIENTS ──── */}
            {/* ========================================= */}
            {activeTab === 'ingredients' && (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Liste des ingrédients</span>
                        </div>
                        <div className="header-actions">
                            <div className="search-wrap">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchIngredients}
                                    onChange={(e) => setSearchIngredients(e.target.value)}
                                    className="finput finput--search"
                                />
                            </div>
                            {hasRole('ADMIN', 'RESP_LABO') && (
                                <button
                                    className="btn-primary"
                                    onClick={() => openIngredientModal()}
                                >
                                    <Plus size={16} strokeWidth={1.5} />
                                    <span>Nouvel ingrédient</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredIngredients.length === 0 ? (
                        <div className="empty-state-card">
                            <Package size={48} strokeWidth={1} />
                            <div className="empty-state-text">
                                Aucun ingrédient dans le catalogue
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mobile-list">
                                {filteredIngredients.map((ing, i) => (
                                    <div
                                        key={ing.id}
                                        className="mobile-row"
                                        style={{
                                            animationDelay: `${i * 0.05}s`,
                                        }}
                                    >
                                        <div className="mobile-row-top">
                                            <span className="mobile-name">
                                                {ing.nom}
                                            </span>
                                        </div>
                                        <div className="mobile-stats">
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Unité
                                                </span>
                                                <span className="mobile-stat-value text-muted">
                                                    {ing.unite || '-'}
                                                </span>
                                            </div>
                                            <div className="mobile-stat-divider" />
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Prix unitaire
                                                </span>
                                                <span className="mobile-stat-value text-success">
                                                    {formatPrice(
                                                        ing.prix_unitaire,
                                                    )}{' '}
                                                    €
                                                </span>
                                            </div>
                                        </div>
                                        {hasRole('ADMIN', 'RESP_LABO') && (
                                            <div className="mobile-actions">
                                                <button
                                                    className="btn-ghost"
                                                    onClick={() =>
                                                        openIngredientModal(ing)
                                                    }
                                                >
                                                    <Pencil
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                    <span>Modifier</span>
                                                </button>
                                                <button
                                                    className="btn-icon-danger"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            ing.id,
                                                            'ingredient',
                                                            ing.nom,
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Ingrédient</th>
                                            <th>Unité</th>
                                            <th className="text-right">
                                                Prix unitaire
                                            </th>
                                            {hasRole('ADMIN', 'RESP_LABO') && (
                                                <th className="text-right">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIngredients.map((ing, i) => (
                                            <tr
                                                key={ing.id}
                                                style={{
                                                    animationDelay: `${i * 0.04}s`,
                                                }}
                                            >
                                                <td>
                                                    <span className="product-name">
                                                        {ing.nom}
                                                    </span>
                                                </td>
                                                <td className="text-muted">
                                                    {ing.unite || '-'}
                                                </td>
                                                <td className="text-success text-right">
                                                    {formatPrice(
                                                        ing.prix_unitaire,
                                                    )}{' '}
                                                    €
                                                </td>
                                                {hasRole(
                                                    'ADMIN',
                                                    'RESP_LABO',
                                                ) && (
                                                    <td className="text-right">
                                                        <div className="table-actions">
                                                            <button
                                                                className="btn-ghost-sm"
                                                                onClick={() =>
                                                                    openIngredientModal(
                                                                        ing,
                                                                    )
                                                                }
                                                                title="Éditer"
                                                            >
                                                                <Pencil
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                            </button>
                                                            <button
                                                                className="btn-icon-danger-sm"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        ing.id,
                                                                        'ingredient',
                                                                        ing.nom,
                                                                    )
                                                                }
                                                                title="Supprimer"
                                                            >
                                                                <Trash2
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ========================================= */}
            {/* ──── ONGLET CATÉGORIES ──── */}
            {/* ========================================= */}
            {activeTab === 'categories' && (
                <div className="table-card">
                    <div className="table-header">
                        <div className="table-title">
                            <div className="table-dot" />
                            <span>Liste des catégories</span>
                        </div>
                        <div className="header-actions">
                            <div className="search-wrap">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchCategories}
                                    onChange={(e) => setSearchCategories(e.target.value)}
                                    className="finput finput--search"
                                />
                            </div>
                            {hasRole('ADMIN', 'RESP_LABO') && (
                                <button
                                    className="btn-primary"
                                    onClick={() => openCategoryModal()}
                                >
                                    <Plus size={16} strokeWidth={1.5} />
                                    <span>Nouvelle catégorie</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredCategories.length === 0 ? (
                        <div className="empty-state-card">
                            <ClipboardList size={48} strokeWidth={1} />
                            <div className="empty-state-text">
                                Aucune catégorie définie
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mobile-list">
                                {filteredCategories.map((cat, i) => (
                                    <div
                                        key={cat.id}
                                        className="mobile-row"
                                        style={{
                                            animationDelay: `${i * 0.05}s`,
                                        }}
                                    >
                                        <div className="mobile-row-top">
                                            <span className="mobile-name">
                                                {cat.nom}
                                            </span>
                                        </div>
                                        <div className="mobile-stats">
                                            <div className="mobile-stat">
                                                <span className="mobile-stat-label">
                                                    Produits
                                                </span>
                                                <span className="mobile-stat-value text-orange">
                                                    {statsByCategory[cat.nom] ||
                                                        0}
                                                </span>
                                            </div>
                                        </div>
                                        {hasRole('ADMIN', 'RESP_LABO') && (
                                            <div className="mobile-actions">
                                                <button
                                                    className="btn-ghost"
                                                    onClick={() =>
                                                        openCategoryModal(cat)
                                                    }
                                                >
                                                    <Pencil
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                    <span>Modifier</span>
                                                </button>
                                                <button
                                                    className="btn-icon-danger"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            cat.id,
                                                            'category',
                                                            cat.nom,
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Catégorie</th>
                                            <th className="text-right">
                                                Produits
                                            </th>
                                            {hasRole('ADMIN', 'RESP_LABO') && (
                                                <th className="text-right">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCategories.map((cat, i) => (
                                            <tr
                                                key={cat.id}
                                                style={{
                                                    animationDelay: `${i * 0.04}s`,
                                                }}
                                            >
                                                <td>
                                                    <span className="product-name">
                                                        {cat.nom}
                                                    </span>
                                                </td>
                                                <td className="text-orange text-right font-semibold">
                                                    {statsByCategory[cat.nom] ||
                                                        0}
                                                </td>
                                                {hasRole(
                                                    'ADMIN',
                                                    'RESP_LABO',
                                                ) && (
                                                    <td className="text-right">
                                                        <div className="table-actions">
                                                            <button
                                                                className="btn-ghost-sm"
                                                                onClick={() =>
                                                                    openCategoryModal(
                                                                        cat,
                                                                    )
                                                                }
                                                                title="Éditer"
                                                            >
                                                                <Pencil
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                            </button>
                                                            <button
                                                                className="btn-icon-danger-sm"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        cat.id,
                                                                        'category',
                                                                        cat.nom,
                                                                    )
                                                                }
                                                                title="Supprimer"
                                                            >
                                                                <Trash2
                                                                    size={14}
                                                                    strokeWidth={
                                                                        1.5
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── MODALS ── */}
            <ProductFormModal
                open={productModalOpen}
                onClose={() => setProductModalOpen(false)}
                product={editingProduct}
                categories={categories}
                ingredients={ingredients}
            />

            <IngredientFormModal
                open={ingredientModalOpen}
                onClose={() => setIngredientModalOpen(false)}
                ingredient={editingIngredient}
            />

            <CategoryFormModal
                open={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                category={editingCategory}
            />

            <RecipeModal
                open={recipeModalOpen}
                onClose={() => setRecipeModalOpen(false)}
                product={recipeProduct}
                ingredients={ingredients}
                initialRecipeLines={recipeLines}
            />

            {/* ── MODAL CONFIRMATION SUPPRESSION ── */}
            {deleteId !== null && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteId(null)}
                >
                    <div
                        className="modal modal-danger"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-danger">
                            <div className="modal-icon-danger">
                                <AlertCircle size={28} strokeWidth={1.5} />
                            </div>
                            <button
                                onClick={() => setDeleteId(null)}
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
                                Êtes-vous sûr de vouloir supprimer{' '}
                                {deleteType === 'product'
                                    ? 'le produit'
                                    : deleteType === 'ingredient'
                                      ? "l'ingrédient"
                                      : 'la catégorie'}{' '}
                                <strong>"{deleteName}"</strong> ?
                            </p>
                            <p className="modal-message-subtle">
                                Cette action est irréversible.
                            </p>
                        </div>
                        <div className="modal-footer-danger">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    let url = '';
                                    if (deleteType === 'product')
                                        url = `/products/${deleteId}`;
                                    else if (deleteType === 'ingredient')
                                        url = `/ingredients/${deleteId}`;
                                    else url = `/categories/${deleteId}`;
                                    router.delete(url, {
                                        onSuccess: () => setDeleteId(null),
                                    });
                                }}
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                                Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .products-page { display: flex; flex-direction: column; gap: 1.5rem; }

                /* Header */
                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.25rem; }
                .page-subtitle { font-size: 0.8rem; color: var(--text-3); }
                .header-actions { display: flex; gap: 0.5rem; }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
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
                }
                .stat-icon--orange { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .stat-icon--success { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .stat-content { flex: 1; }
                .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--orange); line-height: 1.2; }
                .stat-value--success { color: var(--success); }

                /* Summary Card */
                .summary-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .summary-header {
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
                    color: var(--text-2);
                }
                .summary-dot { width: 8px; height: 8px; background: var(--orange); border-radius: 50%; }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 0.85rem;
                    padding: 1.25rem;
                }
                .category-stat-card {
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 0.9rem;
                }
                .category-stat-name { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); margin-bottom: 0.3rem; }
                .category-stat-value { font-size: 1.3rem; font-weight: 700; color: var(--orange); line-height: 1; margin-bottom: 0.5rem; }
                .category-stat-bar { height: 3px; background: var(--border); border-radius: 99px; overflow: hidden; }
                .category-stat-fill { height: 100%; background: linear-gradient(90deg, var(--orange), var(--orange-lt)); border-radius: 99px; }

                /* Tabs */
                .tabs {
                    display: flex;
                    gap: 4px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 4px;
                    width: fit-content;
                }
                .tab-btn {
                    padding: 0.5rem 1.2rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-3);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tab-btn:hover { color: var(--text-1); }
                .tab-btn.active {
                    background: var(--bg-card);
                    color: var(--orange);
                    box-shadow: var(--shadow-sm);
                }

                /* Table Card */
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
                    color: var(--text-2);
                }
                .table-dot { width: 8px; height: 8px; background: var(--orange); border-radius: 50%; }
                .table-count { font-size: 0.7rem; color: var(--text-3); background: var(--bg-card-2); padding: 0.25rem 0.7rem; border-radius: 20px; }

                /* Mobile List */
                .mobile-list { display: flex; flex-direction: column; }
                .mobile-row { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .mobile-row:hover { background: var(--bg-card-2); }
                .mobile-row-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
                .mobile-name { font-weight: 600; font-size: 0.9rem; color: var(--text-1); }
                .mobile-row-meta { margin-bottom: 0.65rem; }
                .meta-text { font-size: 0.75rem; color: var(--text-3); }
                .mobile-stats { display: flex; gap: 1.25rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
                .mobile-stat { display: flex; flex-direction: column; gap: 2px; flex: 1; }
                .mobile-stat-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
                .mobile-stat-value { font-size: 0.95rem; font-weight: 700; color: var(--text-2); }
                .mobile-stat-divider { width: 1px; height: 24px; background: var(--border); }
                .mobile-margin { display: flex; align-items: center; gap: 0.5rem; padding-top: 0.5rem; margin-top: 0.5rem; border-top: 1px solid var(--border); }
                .mobile-margin-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
                .mobile-margin-value { font-size: 0.85rem; font-weight: 700; }
                .mobile-margin-value.good { color: var(--success); }
                .mobile-margin-value.avg { color: var(--orange); }
                .mobile-margin-value.low { color: var(--danger); }
                .mobile-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: flex-end; }

                /* Desktop Table */
                .table-wrapper { display: none; overflow-x: auto; }
                @media (min-width: 768px) {
                    .mobile-list { display: none; }
                    .table-wrapper { display: block; }
                }
                .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .data-table thead tr { border-bottom: 2px solid var(--border); }
                .data-table th { padding: 0.85rem 1rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); text-align: left; }
                .data-table th.text-right { text-align: right; }
                .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .data-table tbody tr:hover { background: var(--bg-card-2); }
                .data-table td { padding: 0.85rem 1rem; }
                .data-table td.text-right { text-align: right; }

                .product-name { font-weight: 600; color: var(--text-1); }
                .category-name { font-size: 0.8rem; color: var(--text-2); }
                .text-success { color: var(--success); font-weight: 600; }
                .text-orange { color: var(--orange); font-weight: 600; }
                .text-muted { color: var(--text-3); }
                .margin-badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 20px; }
                .margin-badge.good { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .margin-badge.avg { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .margin-badge.low { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
                .table-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
                .lot-tag {
                    padding: 2px 8px;
                    border-radius: 20px;
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .dlc-badge {
                    padding: 2px 8px;
                    border-radius: 20px;
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35); }
                .btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.8rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-ghost:hover { background: rgba(232, 116, 42, 0.1); transform: translateY(-1px); }
                .btn-ghost-sm {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.7rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-ghost-sm:hover { background: rgba(232, 116, 42, 0.1); }
                .btn-icon-danger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-icon-danger:hover { background: rgba(214, 59, 59, 0.1); }
                .btn-icon-danger-sm {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.6rem;
                    background: transparent;
                    color: var(--danger);
                    border: 1px solid rgba(214, 59, 59, 0.3);
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-icon-danger-sm:hover { background: rgba(214, 59, 59, 0.1); }
                .btn-neutral {
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
                }
                .btn-neutral:hover { background: var(--bg-card-2); }
                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, var(--danger), #e05a5a);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(214, 59, 59, 0.35); }

                /* Modal (shared) */
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
                    max-width: 480px;
                    width: 100%;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .modal-danger { border: 1px solid rgba(214, 59, 59, 0.2); }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem 0.5rem;
                }
                .modal-title { font-size: 1.1rem; font-weight: 700; color: var(--text-1); }
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
                    transition: all 0.2s;
                }
                .modal-close:hover { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
                .modal-body { padding: 1.5rem; }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }

                /* Delete modal */
                .modal-header-danger {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 0.5rem;
                }
                .modal-icon-danger {
                    width: 64px;
                    height: 64px;
                    border-radius: 32px;
                    background: rgba(214, 59, 59, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--danger);
                    margin: 0 auto;
                }
                .modal-title-danger {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--danger);
                    margin-bottom: 0.5rem;
                }
                .modal-footer-danger {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }
                .modal-message { font-size: 0.95rem; color: var(--text-2); margin-bottom: 0.5rem; }
                .modal-message-subtle { font-size: 0.75rem; color: var(--text-3); }
                .text-center { text-align: center; }

                /* Search input */
                .search-wrap { position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; left: 10px; color: var(--text-3); pointer-events: none; z-index: 1; }
                .finput--search { padding-left: 32px; width: 100%; max-width: 260px; }

                /* Empty State */
                .empty-state-card {
                    background: var(--bg-card-2);
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-3);
                }
                .empty-state-text { margin-top: 1rem; font-size: 0.9rem; }
            `}</style>
        </div>
    );
}
