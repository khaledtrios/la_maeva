<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $fillable = [
        'numero',
        'entity_id',
        'boulangerie_id',
        'periode_type',
        'date_debut',
        'date_fin',
        'montant_total',
        'statut',
        'generation_auto',
        'generated_by',
        'validated_by',
        'paid_at',
        'paid_by',
        'notes',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'montant_total' => 'decimal:2',
        'generation_auto' => 'boolean',
        'paid_at' => 'datetime',
    ];

    /**
     * Relation: le labo émetteur
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: la boulangerie destinataire
     */
    public function boulangerie(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'boulangerie_id');
    }

    /**
     * Relation: l'utilisateur qui a généré cette facture
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Relation: l'utilisateur qui a validé (émis) la facture
     */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Relation: l'utilisateur qui a enregistré le paiement
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    /**
     * Relation: les lignes de cette facture
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }
}
