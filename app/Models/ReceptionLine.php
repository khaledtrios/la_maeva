<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ReceptionLine extends Model
{
    protected $fillable = [
        'reception_id',
        'expedition_line_id', // traçabilité: ligne d'expédition d'origine
        'product_id',
        'qte_attendue',
        'qte_recue',
        'ecart',
        'dlc', // DLC propagée depuis l'expédition (copie pour traçabilité)
        'date_production', // Date de production du lot (copie depuis expedition_lines)
    ];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table reception_lines
     */
    public $timestamps = false;

    /**
     * Relation: la réception parente
     */
    public function reception(): BelongsTo
    {
        return $this->belongsTo(Reception::class);
    }

    /**
     * Relation: le produit reçu
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation: la ligne d'expédition d'origine
     */
    public function expeditionLine(): BelongsTo
    {
        return $this->belongsTo(ExpeditionLine::class, 'expedition_line_id');
    }

    /**
     * Relation: la production source (via expeditionLine)
     * Permet de retracer le lot d'origine
     */
    public function production(): BelongsTo
    {
        return $this->hasOneThrough(
            Production::class,
            ExpeditionLine::class,
            'id', // Foreign key on expedition_lines table...
            'id', // Foreign key on productions table...
            'expedition_line_id', // Local key on reception_lines...
            'production_id' // Local key on expedition_lines...
        );
    }
}
