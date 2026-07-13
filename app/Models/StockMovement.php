<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    /**
     * Les attributs mass-assignables.
     * ingredient_id OU product_id selon le type de mouvement (ingrédient vs produit fini)
     */
    protected $fillable = [
        'entity_id',
        'ingredient_id', // nullable — pour produits finis ce champ est null
        'product_id',    // nullable — pour ingrédients ce champ est null
        'type',
        'quantite',
        'dlc',
        'lot_number',
        'provenance',
        'reference',
        'notes',
        'created_by',
        'production_id', // traçabilité: quelle production a créé/consommé ce lot
        'expedition_line_id', // traçabilité: quelle expédition est à l'origine
        'reference_type', // pour pointer vers vente_jour, ajustement, etc.
        'reference_id',   // id de la ressource référencée
        'movement_date',  // date du mouvement (pour reporting par date)
        'return_id',      // traçabilité: retour boutique à l'origine du mouvement
    ];

    /**
     * Casts pour les attributs.
     */
    protected function casts(): array
    {
        return [
            'quantite'      => 'decimal:3',
            'dlc'           => 'date',
            'movement_date' => 'date',
            'created_at'    => 'datetime',
        ];
    }

    /**
     * Relation : l'entité propriétaire du mouvement.
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation : l'ingrédient concerné (pour mouvements sur ingrédients).
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /**
     * Relation : le produit fini concerné (pour mouvements sur produits).
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation : l'utilisateur ayant créé le mouvement.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation : la production qui a créé/consommé ce lot.
     * Pour les ENTREE de produits: production_id = production dont provient le lot
     * Pour les SORTIE (production labo): production_id = production qui a consommé
     */
    public function production(): BelongsTo
    {
        return $this->belongsTo(Production::class);
    }

    /**
     * Relation : la ligne d'expédition d'origine (pour les produits finis).
     */
    public function expeditionLine(): BelongsTo
    {
        return $this->belongsTo(ExpeditionLine::class);
    }

    /**
     * Scope pour les entrées.
     */
    public function scopeEntrees($query)
    {
        return $query->where('type', 'ENTREE');
    }

    /**
     * Scope pour les sorties.
     */
    public function scopeSorties($query)
    {
        return $query->where('type', 'SORTIE');
    }

    /**
     * Scope pour les ajustements.
     */
    public function scopeAjustements($query)
    {
        return $query->where('type', 'AJUSTEMENT');
    }

    /**
     * Vérifie si ce mouvement est une entrée.
     */
    public function isEntree(): bool
    {
        return $this->type === 'ENTREE';
    }

    /**
     * Vérifie si ce mouvement est une sortie.
     */
    public function isSortie(): bool
    {
        return $this->type === 'SORTIE';
    }
}
