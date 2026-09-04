<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class StockBalance extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 3/Stocks) : cloisonnement automatique.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    /**
     * La table a une colonne id auto-incrémenté (PK).
     * Unicity garantie par deux indexes uniques:
     *  - stock_balances_ingredient_unique: (entity_id, ingredient_id, dlc, lot_number) pour ingrédients
     *  - stock_balances_product_unique: (entity_id, product_id, dlc, lot_number) pour produits finis
     */
    protected $primaryKey = 'id';
    public $incrementing = true;

    /**
     * Les attributs mass-assignables.
     */
    protected $fillable = [
        'entity_id',
        'ingredient_id',   // nullable — pour produits finis, ce champ est null
        'product_id',      // nullable — pour ingrédients, ce champ est null
        'dlc',
        'lot_number',
        'quantite',
        'expedition_line_id', // traçabilité provenance (nullable)
        'production_id',      // traçabilité lot source (nullable)
        'notes',
    ];

    /**
     * Indicates if the model should be timestamped.
     * Les timestamps created_at / updated_at sont gérés automatiquement.
     */
    public $timestamps = true;

    /**
     * Casts pour les attributs.
     */
    protected function casts(): array
    {
        return [
            'quantite' => 'decimal:3',
            'dlc' => 'date',
        ];
    }

    /**
     * Relation : l'entité propriétaire de ce lot.
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    /**
     * Relation : l'ingrédient (labo).
     * Retour null si product_id est défini.
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /**
     * Relation : le produit fini (boulangerie).
     * Retour null si ingredient_id est défini.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation : ligne d'expédition d'origine (traçabilité).
     */
    public function expeditionLine(): BelongsTo
    {
        return $this->belongsTo(ExpeditionLine::class, 'expedition_line_id');
    }

    /**
     * Relation : production d'origine (traçabilité lot).
     * Permet de remonter à la production exacte dont ce stock provient.
     */
    public function production(): BelongsTo
    {
        return $this->belongsTo(Production::class);
    }

    /**
     * Scope : lots correspondant à des produits finis.
     */
    public function scopeForProducts($query)
    {
        return $query->where('product_id', '!=', null);
    }

    /**
     * Scope : lots correspondant à des ingrédients.
     */
    public function scopeForIngredients($query)
    {
        return $query->where('ingredient_id', '!=', null);
    }

    /**
     * Vérifie si ce lot est expiré (DLC < aujourd'hui).
     */
    public function isExpired(): bool
    {
        if (!$this->dlc) return false;
        // Comparer la date DLC avec aujourd'hui (sans heure)
        return Carbon::parse($this->dlc)->lt(Carbon::today());
    }

    /**
     * Vérifie si ce lot arrive à expiration bientôt (≤ aujourd'hui + X jours).
     */
    public function isExpiringSoon(int $days = 3): bool
    {
        if (!$this->dlc) return false;
        $limit = Carbon::today()->addDays($days);
        return Carbon::parse($this->dlc)->lte($limit);
    }

    /**
     * Scope pour les lots expirés (quantite > 0 et DLC <= today).
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('dlc')
            ->where('dlc', '<=', now()->toDateString())
            ->where('quantite', '>', 0);
    }

    /**
     * Scope pour les lots à consommer rapidement (DLC ≤ today + X jours).
     */
    public function scopeExpiringSoon($query, int $days = 3)
    {
        return $query->whereNotNull('dlc')
            ->where('dlc', '>', now()->toDateString())
            ->where('dlc', '<=', now()->addDays($days)->toDateString())
            ->where('quantite', '>', 0);
    }
}
