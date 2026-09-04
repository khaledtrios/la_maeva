<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class HaccpNettoyage extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 2/HACCP) : cloisonnement automatique.
     * updateNettoyage() a deja un controle manuel entity_id ; le scope
     * protege aussi le route-model-binding lui-meme.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

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
