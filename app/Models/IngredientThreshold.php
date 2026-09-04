<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class IngredientThreshold extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 3/Stocks) : cloisonnement automatique.
     * PK composite (entity_id, ingredient_id) : sans effet sur le scope, qui
     * filtre sur store_id independamment de la cle primaire.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    /**
     * La table n'a pas de colonne id, clé primaire composite (entity_id, ingredient_id).
     */
    public $incrementing = false;
    protected $primaryKey = ['entity_id', 'ingredient_id'];

    /**
     * Les attributs mass-assignables.
     */
    protected $fillable = [
        'entity_id',
        'ingredient_id',
        'seuil_minimum',
        'stock_max',
    ];

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = true;

    /**
     * Casts pour les attributs.
     */
    protected function casts(): array
    {
        return [
            'seuil_minimum' => 'decimal:3',
            'stock_max' => 'decimal:3',
        ];
    }

    /**
     * Relation : l'entité (labo/boutique) propriétaire de ce seuil.
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    /**
     * Relation : l'ingrédient concerné.
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }

    /**
     * Vérifie si le seuil minimum est défini.
     */
    public function hasMinimumThreshold(): bool
    {
        return $this->seuil_minimum !== null;
    }

    /**
     * Vérifie si le seuil maximum est défini.
     */
    public function hasMaximumThreshold(): bool
    {
        return $this->stock_max !== null;
    }
}
