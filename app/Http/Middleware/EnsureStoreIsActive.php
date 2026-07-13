<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureStoreIsActive
{
    /**
     * Handle an incoming request.
     *
     * Vérification en profondeur (defense-in-depth) : re-vérifiée à chaque requête au cas où
     * un admin refuserait/désactiverait la boutique APRÈS que le propriétaire ait déjà une
     * session active.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $storeUser = $request->user('store');

        if ($storeUser && ! $storeUser->store->isActive()) {
            Auth::guard('store')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('store.login')->with('error', 'Votre accès a été suspendu.');
        }

        return $next($request);
    }
}
