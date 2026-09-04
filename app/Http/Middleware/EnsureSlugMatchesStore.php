<?php

namespace App\Http\Middleware;

use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * PHASE 3.5 — CORRECTION DU BLOQUEUR C4 : cohérence entre le slug de l'URL et le
 * store de l'utilisateur connecté.
 *
 * Les routes employé sont déclarées sous `/{slug}` mais RIEN ne vérifiait que ce
 * slug correspondait au store de l'employé authentifié : un employé du store A
 * pouvait naviguer sur `/store-b/production`. Les requêtes filtrant sur son
 * propre `entity_id`, il n'y avait pas de fuite de données — mais le contexte
 * affiché était incohérent, et cela devenait une vraie faille dès qu'une requête
 * ferait confiance au slug (ce que la Phase 4 rend probable).
 *
 * Comportement :
 *   - slug absent de la route          -> laisser passer (route hors /{slug}) ;
 *   - slug inconnu                     -> 404 (ne pas révéler l'existence) ;
 *   - utilisateur non authentifié      -> laisser passer (auth s'en charge) ;
 *   - ADMIN interne                    -> laisser passer (rôle plateforme, doit
 *     pouvoir intervenir sous n'importe quel store) ;
 *   - employé sans store_id            -> 403 (compte incohérent, fail-closed) ;
 *   - slug ≠ store de l'employé        -> 403.
 */
class EnsureSlugMatchesStore
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('slug');

        if (!$slug) {
            return $next($request);
        }

        $user = $request->user();

        // L'authentification est gérée en amont par `auth:web`.
        if (!$user) {
            return $next($request);
        }

        // L'ADMIN interne est le rôle plateforme : accès à tous les stores.
        if (($user->role ?? null) === 'ADMIN') {
            return $next($request);
        }

        $storeId = Store::where('slug', $slug)->value('id');

        if (!$storeId) {
            abort(404);
        }

        // Fail-closed : un employé sans store rattaché ne doit pas passer.
        if (empty($user->store_id)) {
            abort(403, 'Votre compte n\'est rattaché à aucune boutique.');
        }

        if ((int) $user->store_id !== (int) $storeId) {
            abort(403, 'Cette boutique n\'est pas la vôtre.');
        }

        return $next($request);
    }
}
