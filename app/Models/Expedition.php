<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class Expedition extends Model
{
    protected $fillable = ['entity_id', 'boulangerie_id', 'date', 'statut', 'created_by'];

    /**
     * Indicates if the model should be timestamped.
     * La table a des timestamps (created_at, updated_at)
     */
    // public $timestamps = true; // par défaut

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * Relation: le labo source de cette expédition
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    /**
     * Relation: la boulangerie destinataire
     */
    public function boulangerie(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'boulangerie_id');
    }

    /**
     * Relation: les lignes de cette expédition
     */
    public function lines(): HasMany
    {
        return $this->hasMany(ExpeditionLine::class);
    }

    /**
     * Relation: l'utilisateur qui a créé cette expédition
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation: la réception associée à cette expédition (1:1)
     */
    public function reception(): HasOne
    {
        return $this->hasOne(Reception::class);
    }

    /**
     * Relation: les lignes de facture liées à cette expédition
     */
    public function factureLignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }
}
