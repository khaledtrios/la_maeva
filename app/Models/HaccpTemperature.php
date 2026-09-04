<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class HaccpTemperature extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 2/HACCP) : cloisonnement automatique.
     * HaccpController filtre déjà par entity_id (défense en profondeur ici).
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $table = 'haccp_temperatures';

    protected $fillable = ['entity_id', 'enceinte', 'temperature', 'date', 'created_by'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table haccp_temperatures
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'temperature' => 'float',
        ];
    }

    /**
     * Relation: l'entité (labo/boutique) concernée
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: l'utilisateur qui a saisi ce relevé
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
