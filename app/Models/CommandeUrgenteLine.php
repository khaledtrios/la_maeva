<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle CommandeUrgenteLine — Ligne d'une commande urgente
 *
 * Chaque ligne représente un produit et sa quantité demandée
 * dans le cadre d'un réassort urgent.
 */
class CommandeUrgenteLine extends Model
{
    protected $table = 'commandes_urgentes_lines';

    protected $fillable = [
        'commande_urgente_id',
        'product_id',
        'quantite',
    ];

    protected function casts(): array
    {
        return [
            'quantite' => 'integer',
        ];
    }

    public $timestamps = true;

    /**
     * Relation : commande urgente parent
     */
    public function commandeUrgente(): BelongsTo
    {
        return $this->belongsTo(CommandeUrgente::class);
    }

    /**
     * Relation : produit
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
