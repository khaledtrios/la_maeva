<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 1/fondamentaux) : cloisonnement automatique.
     * Corrige un vrai defaut : ProductController::index() faisait
     * Product::get() sans AUCUN filtre — tout compte (Store Admin, employe)
     * voyait le catalogue de TOUTE la plateforme. update()/destroy() via
     * route-model-binding etaient egalement vulnerables a l'IDOR (modifier/
     * supprimer le produit d'un autre store en devinant son id).
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $fillable = [
        'category_id',
        'nom',
        'code',
        'prix_vente',
        'cout_revient',
        'dlc', // Durée de vie en jours (DLC = production date + dlc)
    ];

    /**
     * `products` n'a pas d'`entity_id` : un produit appartient au store de SA
     * catégorie. Utilisé quand le contexte ne fournit pas de store (admin
     * interne, console, seeders).
     */
    protected function resolveStoreIdFrom(): ?int
    {
        $categoryId = $this->getAttribute('category_id');

        return $categoryId ? Category::whereKey($categoryId)->value('store_id') : null;
    }

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table products
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'prix_vente' => 'float',
            'cout_revient' => 'float',
            'dlc'        => 'integer',
        ];
    }

    /**
     * Relation: la catégorie de ce produit
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relation: les lignes de recette de ce produit
     */
    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    /**
     * Relation: les stocks de ce produit fini (boulangerie)
     * via stock_balances où product_id = ce produit
     */
    public function stockBalances(): HasMany
    {
        return $this->hasMany(StockBalance::class, 'product_id');
    }

    /**
     * Recalculer le coût de revient à partir des recettes
     * Appelé après modification d'une recette
     */
    public function recalculerCoutRevient(): void
    {
        $cout = $this->recipes()
            ->with('ingredient')
            ->get()
            ->sum(fn($r) => (float) $r->quantite * (float) $r->ingredient->prix_unitaire);

        $this->update(['cout_revient' => round($cout, 2)]);
    }
}
