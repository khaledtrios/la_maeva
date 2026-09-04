<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Sépare complètement les sessions des trois espaces d'authentification en
 * attribuant à chacun SON PROPRE cookie de session (donc sa propre ligne de
 * session en base) :
 *
 *   - Super Admin  (/super-admin/*)          -> {base}-superadmin
 *   - Store Admin  (/store/*, /register)     -> {base}-store
 *   - Employé/Admin interne (tout le reste)  -> {base}   (cookie par défaut)
 *
 * Résultat : le login/logout d'un espace (invalidate/regenerate de SA session)
 * n'affecte jamais les deux autres, même dans le même navigateur.
 *
 * IMPORTANT : ce middleware DOIT s'exécuter AVANT StartSession (il est donc
 * "prepend" au groupe web dans bootstrap/app.php), car StartSession lit
 * config('session.cookie') pour savoir quel cookie lire/écrire.
 */
class SetSessionCookiePerArea
{
    public function handle(Request $request, Closure $next)
    {
        $base = config('session.cookie');

        // Détection basée sur le PATH uniquement (le routage n'a pas encore eu lieu).
        if ($request->is('super-admin', 'super-admin/*')) {
            $cookie = $base . '-superadmin';
        } elseif ($request->is('store', 'store/*', 'register')) {
            $cookie = $base . '-store';
        } else {
            // Employés (/{slug}/*) et admin interne : cookie par défaut
            $cookie = $base;
        }

        config(['session.cookie' => $cookie]);

        return $next($request);
    }
}
