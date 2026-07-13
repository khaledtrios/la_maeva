<?php

namespace App\Models\Concerns;

use App\Models\Store;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Phase 2 — ajouter une colonne `store_id` (foreignId constrained stores) à la table du modèle,
 * puis utiliser ce trait dans la classe concernée. Combiner avec App\Models\Scopes\StoreScope
 * pour un filtrage automatique de toutes les requêtes sur la boutique courante.
 *
 * Non utilisé par aucun modèle existant pour l'instant (scaffold préparé à l'avance).
 */
trait BelongsToStore
{
    /**
     * Relation: le modèle appartient à une boutique
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Scope local: restreint la requête à une boutique donnée
     */
    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }
}
