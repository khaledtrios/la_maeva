<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class HaccpControleReception extends Model
{
    protected $table = 'haccp_controles_reception';

    protected $fillable = ['entity_id', 'fournisseur', 'bl_number', 'categorie', 'temperature', 'conforme', 'commentaire', 'date', 'created_by'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table haccp_controles_reception
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'conforme' => 'boolean',
            'temperature' => 'float',
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
     * Relation: l'utilisateur qui a créé ce contrôle
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
