<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureStoreIsActive;
use App\Http\Middleware\StoreGuardMiddleware;
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
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Alias pour utiliser ->middleware('role:ADMIN,RESP_LABO')
        $middleware->alias([
            'role' => CheckRole::class,
            'store.active' => EnsureStoreIsActive::class,
            'store.guard' => StoreGuardMiddleware::class,
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

            return $isStoreContext($request) ? route('store.login') : route('login');
        });

        $middleware->redirectUsersTo(function ($request) use ($isStoreContext, $isSuperAdminContext) {
            if ($isSuperAdminContext($request)) {
                return route('superadmin.stores.index');
            }

            return $isStoreContext($request) ? route('store.dashboard') : route('dashboard');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
