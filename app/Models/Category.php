<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
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
