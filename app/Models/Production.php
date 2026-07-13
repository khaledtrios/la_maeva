<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Production extends Model
{
    protected $fillable = ['entity_id', 'product_id', 'quantite', 'quantite_pertes', 'lot', 'date', 'created_by'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table productions
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'quantite' => 'integer',
            'quantite_pertes' => 'integer',
        ];
    }

    /**
     * Relation: l'entité (labo) où a été produite cette production
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: le produit fabriqué
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation: l'utilisateur qui a créé cet enregistrement
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation: les lignes d'expédition issues de cette production
     * Une production peut être répartie sur plusieurs expéditions/lignes
     */
    public function expeditionLines(): HasMany
    {
        return $this->hasMany(ExpeditionLine::class);
    }

    /**
     * Relation: les stocks créés à partir de cette production
     * Permet de retracer tous les stocks issus de ce lot
     */
    public function stockBalances(): HasMany
    {
        return $this->hasMany(StockBalance::class);
    }

    /**
     * Quantité nette (produite - pertes)
     */
    public function quantiteNette(): int
    {
        return $this->quantite - $this->quantite_pertes;
    }
}
