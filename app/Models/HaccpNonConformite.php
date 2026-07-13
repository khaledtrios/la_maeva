<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class HaccpNonConformite extends Model
{
    protected $table = 'haccp_non_conformites';

    protected $fillable = ['entity_id', 'type', 'description', 'action', 'statut', 'date', 'created_by'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table haccp_non_conformites
     */
    public $timestamps = false;

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
     * Relation: l'entité concernée
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: l'utilisateur qui a créé cette NC
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
