<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 1/fondamentaux) : cloisonnement automatique.
     * Meme defaut que Category corrige ici : IngredientController n'avait
     * aucun filtre par store.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $fillable = ['nom', 'unite', 'prix_unitaire'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table ingredients
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'float',
        ];
    }

    /**
     * Relation: les lignes de recette utilisant cet ingrédient
     */
    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }
}
