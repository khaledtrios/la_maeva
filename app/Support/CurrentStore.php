<?php

namespace App\Support;

use Illuminate\Container\Container;
use Illuminate\Support\Facades\Auth;

/**
 * Résolveur UNIQUE du store courant (contexte tenant).
 *
 * Point d'entrée partagé par :
 *   - App\Models\Concerns\BelongsToStore (remplissage de store_id à la création) ;
 *   - App\Models\Scopes\StoreScope       (filtrage automatique des requêtes) ;
 *   - les middlewares et contrôleurs qui ont besoin du store courant.
 *
 * Centraliser cette résolution évite d'avoir des règles divergentes selon
 * l'endroit du code — c'était précisément le défaut relevé par l'audit (le scope
 * ne connaissait que le guard "store" et ignorait les employés du guard "web").
 *
 * RÈGLES, par ordre de priorité :
 *   1. Binding conteneur `currentStoreId` — override explicite (console, jobs,
 *      tâches planifiées, tests, intégration caisse authentifiée par token).
 *   2. Guard "store" (Store Admin) -> son `store_id`.
 *   3. Guard "web" (employé) -> `users.store_id`, SAUF l'ADMIN interne.
 *   4. Sinon null : aucun contexte tenant (console, admin interne, invité).
 *
 * POURQUOI L'ADMIN INTERNE EST EXCLU : c'est le rôle « plateforme » validé avec
 * l'utilisateur — il administre toutes les entités et tous les stores. Il porte
 * pourtant un `store_id` en base (héritage mono-organisation) : le scoper
 * automatiquement lui ferait perdre sa vue globale. Le Super Admin (guard
 * `super_admin`) n'a par construction aucun store_id.
 */
class CurrentStore
{
    /** Clé de binding pour forcer un store dans le conteneur. */
    public const CONTAINER_KEY = 'currentStoreId';

    /**
     * Identifiant du store courant, ou null si le contexte n'est pas cloisonné.
     */
    public static function id(): ?int
    {
        $container = Container::getInstance();

        // 1. Override explicite (prioritaire)
        if ($container->bound(self::CONTAINER_KEY)) {
            $storeId = $container->make(self::CONTAINER_KEY);

            return $storeId ? (int) $storeId : null;
        }

        // 2. Store Admin
        if (Auth::guard('store')->check()) {
            $storeId = Auth::guard('store')->user()?->store_id;

            return $storeId ? (int) $storeId : null;
        }

        // 3. Employé (guard web), hors ADMIN interne
        if (Auth::guard('web')->check()) {
            $user = Auth::guard('web')->user();

            if (($user->role ?? null) === 'ADMIN') {
                return null; // accès plateforme : non cloisonné
            }

            return $user->store_id ? (int) $user->store_id : null;
        }

        // 4. Aucun contexte tenant
        return null;
    }

    /**
     * Store de RATTACHEMENT pour une écriture.
     *
     * À ne pas confondre avec id() :
     *   - id()            = contexte de LECTURE (filtrage). L'ADMIN interne y
     *                       renvoie null car il ne doit pas être cloisonné.
     *   - idForWriting()  = store auquel rattacher une ligne CRÉÉE. L'ADMIN
     *                       interne y renvoie SON store_id.
     *
     * Sans cette distinction, un ADMIN interne créant une catégorie ou un
     * ingrédient (tables sans `entity_id` d'où dériver) produisait une ligne
     * avec `store_id = NULL` — ce qui violerait la contrainte NOT NULL de la
     * Phase 4. Vérifié avant la vague 3a : le cas se produisait réellement.
     */
    public static function idForWriting(): ?int
    {
        $container = Container::getInstance();

        if ($container->bound(self::CONTAINER_KEY)) {
            $storeId = $container->make(self::CONTAINER_KEY);

            return $storeId ? (int) $storeId : null;
        }

        if (Auth::guard('store')->check()) {
            $storeId = Auth::guard('store')->user()?->store_id;

            return $storeId ? (int) $storeId : null;
        }

        // Guard web : TOUS les rôles, y compris l'ADMIN interne. Ce qu'il crée
        // est rattaché à son propre store, même s'il consulte tous les stores.
        if (Auth::guard('web')->check()) {
            $storeId = Auth::guard('web')->user()?->store_id;

            return $storeId ? (int) $storeId : null;
        }

        return null;
    }

    /**
     * Le contexte courant est-il cloisonné ?
     *
     * Distingue « pas de store » (console, admin interne) de « store courant
     * connu ». Utile au scope pour choisir entre « ne pas filtrer » et
     * « filtrer », et au trait pour savoir s'il peut remplir store_id.
     */
    public static function isScoped(): bool
    {
        return self::id() !== null;
    }

    /**
     * Un compte est-il authentifié dans un contexte QUI DEVRAIT être cloisonné
     * mais dont le store est introuvable ?
     *
     * Ce cas est anormal (compte boutique sans store, employé sans store_id) et
     * doit être traité en fail-closed par le scope : mieux vaut ne rien renvoyer
     * que de tout exposer.
     */
    public static function isBrokenContext(): bool
    {
        if (Container::getInstance()->bound(self::CONTAINER_KEY)) {
            return empty(Container::getInstance()->make(self::CONTAINER_KEY));
        }

        if (Auth::guard('store')->check()) {
            return empty(Auth::guard('store')->user()?->store_id);
        }

        if (Auth::guard('web')->check()) {
            $user = Auth::guard('web')->user();

            // L'ADMIN interne n'est pas censé être cloisonné : contexte sain.
            if (($user->role ?? null) === 'ADMIN') {
                return false;
            }

            return empty($user->store_id);
        }

        return false;
    }

    /**
     * Exécute un callback en forçant un store donné (utile en console, jobs,
     * seeders et tests). Restaure l'état précédent ensuite.
     */
    public static function for(?int $storeId, callable $callback): mixed
    {
        $container = Container::getInstance();
        $avait = $container->bound(self::CONTAINER_KEY);
        $precedent = $avait ? $container->make(self::CONTAINER_KEY) : null;

        $container->instance(self::CONTAINER_KEY, $storeId);

        try {
            return $callback();
        } finally {
            if ($avait) {
                $container->instance(self::CONTAINER_KEY, $precedent);
            } else {
                $container->forgetInstance(self::CONTAINER_KEY);
            }
        }
    }
}
