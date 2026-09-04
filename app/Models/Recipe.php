<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 1/fondamentaux) : cloisonnement automatique.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $fillable = ['product_id', 'ingredient_id', 'quantite'];

    /**
     * `recipes` n'a pas d'`entity_id` : une recette appartient au store de SON
     * produit. Utilisé quand le contexte ne fournit pas de store (admin interne,
     * console, seeders).
     */
    protected function resolveStoreIdFrom(): ?int
    {
        $productId = $this->getAttribute('product_id');

        return $productId ? Product::whereKey($productId)->value('store_id') : null;
    }

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table recipes
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'quantite' => 'float',
        ];
    }

    /**
     * Relation: le produit concerné
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation: l'ingrédient concerné
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
