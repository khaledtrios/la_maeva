<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class HaccpNettoyage extends Model
{
    protected $table = 'haccp_nettoyage';

    protected $fillable = ['entity_id', 'date', 'taches_json', 'statut', 'valide_par'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table haccp_nettoyage
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'taches_json' => 'array',
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
     * Relation: l'utilisateur qui a validé ce plan (nullable)
     */
    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par');
    }
}
