<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class FactureLigne extends Model
{
    protected $fillable = [
        'facture_id',
        'expedition_id',
        'expedition_line_id',
        'product_id',
        'quantite',
        'prix_unitaire',
        'montant',
        'dlc',
        'lot_reference',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire' => 'decimal:2',
        'montant' => 'decimal:2',
    ];

    /**
     * Relation: la facture parente
     */
    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    /**
     * Relation: l'expédition source
     */
    public function expedition(): BelongsTo
    {
        return $this->belongsTo(Expedition::class);
    }

    /**
     * Relation: la ligne d'expédition d'origine
     */
    public function expeditionLine(): BelongsTo
    {
        return $this->belongsTo(ExpeditionLine::class, 'expedition_line_id');
    }

    /**
     * Relation: le produit
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
