<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StoreGuardMiddleware
{
    /**
     * Assure que Auth::user() retourne l'utilisateur du store guard
     */
    public function handle(Request $request, Closure $next)
    {
        // Si l'utilisateur est authentifié sur le store guard,
        // nous l'assignons au guard par défaut pour que Auth::user() fonctionne
        if ($request->user('store')) {
            Auth::shouldUse('store');
        }

        return $next($request);
    }
}
