<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class Reception extends Model
{
    protected $fillable = ['expedition_id', 'entity_id', 'date', 'statut'];

    /**
     * Indicates if the model should be timestamped.
     * La table reception a des timestamps (created_at, updated_at)
     */
    // public $timestamps = true;

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
     * Relation: l'expédition dont cette réception découle
     */
    public function expedition(): BelongsTo
    {
        return $this->belongsTo(Expedition::class);
    }

    /**
     * Relation: la boulangerie (entity) qui reçoit
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: les lignes de réception
     */
    public function lines(): HasMany
    {
        return $this->hasMany(ReceptionLine::class);
    }
}
