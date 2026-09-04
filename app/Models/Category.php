<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 1/fondamentaux) : cloisonnement automatique.
     * Corrige un vrai defaut existant : CategoryController n'avait aucun
     * filtre par store, un employe voyait/modifiait les categories de
     * n'importe quel store (route-model-binding non scope).
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $fillable = ['nom'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table categories
     */
    public $timestamps = false;

    /**
     * Relation: les produits dans cette catégorie
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
