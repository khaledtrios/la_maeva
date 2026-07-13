<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'nom',
        'code',
        'prix_vente',
        'cout_revient',
        'dlc', // Durée de vie en jours (DLC = production date + dlc)
    ];

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
