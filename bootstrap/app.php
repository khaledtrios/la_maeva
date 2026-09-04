<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\AuthenticateCaisseToken;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureSlugMatchesStore;
use App\Http\Middleware\EnsureStoreIsActive;
use App\Http\Middleware\StoreGuardMiddleware;
use App\Http\Middleware\ShareSlugWithInertia;
use App\Http\Middleware\SetSessionCookiePerArea;
use App\Enums\StoreStatus;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php', // Enregistre les canaux Pusher/broadcasting
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // DOIT s'exécuter avant StartSession : choisit le cookie de session
        // selon la zone (/super-admin, /store, employé) pour isoler les sessions.
        $middleware->web(prepend: [
            SetSessionCookiePerArea::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            ShareSlugWithInertia::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Alias pour utiliser ->middleware('role:ADMIN,RESP_LABO')
        $middleware->alias([
            'role' => CheckRole::class,
            'store.active' => EnsureStoreIsActive::class,
            'store.guard' => StoreGuardMiddleware::class,
            // Vérifie que le slug de l'URL correspond au store de l'employé
            'slug.store' => EnsureSlugMatchesStore::class,
            // Authentifie l'intégration caisse par le jeton d'API de son store
            'caisse.token' => AuthenticateCaisseToken::class,
        ]);

        // Redirections conscientes du guard : les routes store.* (ou /store/*, ou /register)
        // doivent rediriger vers store.login / store.dashboard, et les routes superadmin.*
        // (ou /super-admin/*) vers superadmin.login / superadmin.stores.index, au lieu des
        // routes internes login / dashboard. Le comportement web/guard par défaut reste
        // inchangé pour toutes les autres routes. L'API de Laravel 13 n'expose qu'un callback
        // global (pas de variante par guard), donc le branchement se fait ici via le nom de
        // route / le path.
        $isStoreContext = function ($request): bool {
            return $request->routeIs('store.*')
                || $request->is('store/*')
                || $request->is('register');
        };

        $isSuperAdminContext = function ($request): bool {
            return $request->routeIs('superadmin.*')
                || $request->is('super-admin/*');
        };

        $middleware->redirectGuestsTo(function ($request) use ($isStoreContext, $isSuperAdminContext) {
            if ($isSuperAdminContext($request)) {
                return route('superadmin.login');
            }

            if ($isStoreContext($request)) {
                return route('store.login');
            }

            // Pour les employés, obtenir le slug du paramètre de route ou rediriger vers la page de login générique
            $slug = $request->route('slug');
            if ($slug) {
                return "/{$slug}/login";
            }
            // Fallback : rediriger vers la première boutique disponible
            $defaultSlug = \App\Models\Store::where('status', StoreStatus::Active)
                ->first()?->slug ?? 'labo-maeva-cayenne-store';
            return "/{$defaultSlug}/login";
        });

        $middleware->redirectUsersTo(function ($request) use ($isStoreContext, $isSuperAdminContext) {
            if ($isSuperAdminContext($request)) {
                return route('superadmin.stores.index');
            }

            if ($isStoreContext($request)) {
                return route('store.dashboard');
            }

            // Pour les employés, rediriger vers le dashboard avec le slug
            $slug = $request->session()->get('store_slug');
            if ($slug) {
                return "/{$slug}/dashboard";
            }
            // Fallback
            return '/labo-maeva-cayenne-store/dashboard';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
