<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
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
