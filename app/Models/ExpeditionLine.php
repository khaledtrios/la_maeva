<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class ExpeditionLine extends Model
{
    protected $fillable = [
        'expedition_id',
        'product_id',
        'production_id',
        'quantite',
        'dlc',
        'lot_reference',
        'date_production',
    ];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table expedition_lines
     */
    public $timestamps = false;

    /**
     * Relation: l'expédition parente
     */
    public function expedition(): BelongsTo
    {
        return $this->belongsTo(Expedition::class);
    }

    /**
     * Relation: le produit expédié
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation: la production source (lot dont provient cette ligne)
     * null pour les productions implicites (commandes urgentes sans production préalable)
     */
    public function production(): BelongsTo
    {
        return $this->belongsTo(Production::class);
    }

    /**
     * Relation: la ligne de réception associée (1:1)
     * Une ligne d'expédition donne lieu à une seule ligne de réception (si expédition reçue)
     */
    public function receptionLine(): HasOne
    {
        return $this->hasOne(ReceptionLine::class);
    }
}
