<?php

namespace App\Models\Scopes;

use App\Support\CurrentStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Global scope d'isolation multi-tenant par `store_id`.
 *
 * PHASE 3.5 — CORRECTION DU BLOQUEUR C3 : ce scope ne résolvait que le guard
 * "store". Les EMPLOYÉS (guard "web") portent pourtant `users.store_id` et
 * n'auraient donc pas été cloisonnés. La résolution est désormais entièrement
 * déléguée à App\Support\CurrentStore, utilisé aussi par le trait
 * BelongsToStore : une seule règle, valable partout.
 *
 * Contextes gérés par CurrentStore, par priorité :
 *   1. binding conteneur `currentStoreId` (console, jobs, tests, API caisse) ;
 *   2. guard "store"  -> Store Admin ;
 *   3. guard "web"    -> employé, SAUF l'ADMIN interne qui garde sa vue globale ;
 *   4. aucun contexte -> pas de filtre.
 *
 * FAIL-CLOSED : si le contexte DEVRAIT être cloisonné mais qu'aucun store n'en
 * ressort (compte boutique sans store, employé sans store_id), la requête ne
 * renvoie AUCUNE ligne plutôt que toutes. Un scope qui « laisse passer » en cas
 * de doute donne une fausse impression de sécurité.
 *
 * PAS ENCORE APPLIQUÉ À UN MODÈLE : l'activation (via `addGlobalScope` dans le
 * `booted()` des modèles) est prévue en PHASE 4, après le passage de `store_id`
 * en NOT NULL. L'activer maintenant masquerait les lignes dont `store_id` est
 * encore NULL.
 */
class StoreScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $column = $model->getTable() . '.store_id';

        // Contexte censé être cloisonné mais store introuvable -> aucune ligne.
        if (CurrentStore::isBrokenContext()) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $storeId = CurrentStore::id();

        // Aucun contexte tenant (admin interne, console, seeder) -> accès global.
        if ($storeId === null) {
            return;
        }

        $builder->where($column, $storeId);
    }
}
