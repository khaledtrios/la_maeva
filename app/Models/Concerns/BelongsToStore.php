<?php

namespace App\Models\Concerns;

use App\Models\Entity;
use App\Models\Store;
use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Rattachement d'un modèle à un Store (multi-tenant).
 *
 * PHASE 3.5 — CORRECTION DU BLOQUEUR C1 : avant ce trait, aucun modèle métier
 * n'avait `store_id` dans `$fillable` et aucun contrôleur ne l'écrivait. Toute
 * ligne créée par l'application repartait donc avec `store_id = NULL`, ce qui
 * rendait impossible le passage en NOT NULL prévu en Phase 4.
 *
 * Ce trait renseigne `store_id` AUTOMATIQUEMENT à la création, sans toucher aux
 * ~250 points d'appel des contrôleurs et services :
 *
 *   1. `store_id` déjà fourni explicitement -> respecté (aucun écrasement) ;
 *   2. sinon store du contexte courant (cf. App\Support\CurrentStore) ;
 *   3. sinon dérivation depuis la ligne elle-même via `resolveStoreIdFrom()`
 *      (par défaut : l'entité pointée par `entity_id`). C'est ce qui couvre
 *      l'ADMIN interne, non cloisonné, qui crée pour le compte d'une entité.
 *
 * POURQUOI `store_id` N'EST PAS AJOUTÉ À `$fillable` : le rattachement d'une
 * ligne à un tenant ne doit jamais pouvoir venir d'une assignation de masse
 * (`$request->all()`). Le trait l'affecte directement sur l'attribut, ce qui
 * contourne `$fillable` par conception : automatique ET non injectable.
 *
 * Les modèles dont le store ne se déduit pas d'`entity_id` (Recipe via son
 * produit, Product/Category/Ingredient qui n'ont pas d'entité) surchargent
 * `resolveStoreIdFrom()`.
 */
trait BelongsToStore
{
    public static function bootBelongsToStore(): void
    {
        static::creating(function (Model $model) {
            // 1. Valeur explicite : on ne l'écrase jamais.
            if ($model->getAttribute('store_id') !== null) {
                return;
            }

            // 2. Store de rattachement du contexte courant.
            //    `idForWriting()` (et non `id()`) : l'ADMIN interne n'est pas
            //    cloisonné en LECTURE, mais ce qu'il CRÉE doit tout de même être
            //    rattaché à son store — sinon les tables sans `entity_id`
            //    (categories, ingredients) partiraient avec store_id NULL.
            $storeId = CurrentStore::idForWriting();

            // 3. Dérivation depuis la ligne (admin interne, console, seeders).
            if ($storeId === null) {
                $storeId = $model->resolveStoreIdFrom();
            }

            if ($storeId !== null) {
                $model->setAttribute('store_id', $storeId);
            }
        });
    }

    /**
     * Déduit le store depuis les données de la ligne, quand le contexte ne le
     * fournit pas. Par défaut : le store de l'entité pointée par `entity_id`.
     *
     * À surcharger dans les modèles sans `entity_id`.
     */
    protected function resolveStoreIdFrom(): ?int
    {
        $entityId = $this->getAttribute('entity_id');

        if (!$entityId) {
            return null;
        }

        return Entity::whereKey($entityId)->value('store_id');
    }

    /**
     * Relation : le modèle appartient à un store.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Scope local : restreint la requête à un store donné.
     */
    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }
}
