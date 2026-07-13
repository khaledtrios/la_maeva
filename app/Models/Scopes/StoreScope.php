<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Container\Container;

/**
 * Scaffold pour la Phase 2 : un futur middleware résoudra le `store_id` de l'utilisateur
 * boutique authentifié et le liera dans le conteneur sous la clé "currentStoreId" tôt dans
 * le cycle de vie de la requête. Tout modèle utilisant le trait App\Models\Concerns\BelongsToStore
 * et enregistrant ce global scope dans une méthode booted() sera alors automatiquement filtré
 * sur cette boutique, sans code supplémentaire par requête.
 *
 * Non appliqué à aucun modèle pour l'instant.
 */
class StoreScope implements Scope
{
    /**
     * Applique le scope à la requête Eloquent donnée.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $container = Container::getInstance();

        if ($container->bound('currentStoreId')) {
            $builder->where($model->getTable().'.store_id', $container->make('currentStoreId'));
        }
    }
}
