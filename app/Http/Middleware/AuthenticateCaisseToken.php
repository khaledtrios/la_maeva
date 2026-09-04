<?php

namespace App\Http\Middleware;

use App\Models\Store;
use App\Support\CurrentStore;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * PHASE 3.5 — CORRECTION DU BLOQUEUR C2 : authentifie l'intégration caisse.
 *
 * La caisse présente le jeton de son store dans l'en-tête `X-Caisse-Token`
 * (ou `Authorization: Bearer <token>`). Le middleware :
 *   1. refuse la requête si le jeton est absent, vide ou inconnu (401) ;
 *   2. refuse si le store n'est pas ACTIF (403) — un store suspendu ne doit plus
 *      pouvoir injecter de ventes ;
 *   3. lie le store résolu au contexte tenant (`CurrentStore`), ce qui permet au
 *      contrôleur de contraindre `entity_id` et fait bénéficier l'API du même
 *      cloisonnement que le reste de l'application.
 *
 * La comparaison utilise `hash_equals` pour éviter les attaques temporelles, et
 * le store est recherché par égalité stricte sur une colonne unique.
 */
class AuthenticateCaisseToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Caisse-Token') ?: $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'Jeton d\'API manquant.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $store = Store::whereNotNull('api_token')->where('api_token', $token)->first();

        // Double vérification en temps constant (le where a déjà filtré, mais on
        // ne veut pas dépendre du seul comportement de comparaison SQL).
        if (!$store || !hash_equals((string) $store->api_token, (string) $token)) {
            return response()->json([
                'message' => 'Jeton d\'API invalide.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$store->isActive()) {
            return response()->json([
                'message' => 'Boutique inactive : synchronisation refusée.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Contexte tenant pour toute la durée de la requête : le scope global et
        // le trait BelongsToStore s'appuieront dessus.
        app()->instance(CurrentStore::CONTAINER_KEY, $store->id);
        $request->attributes->set('caisse_store', $store);

        return $next($request);
    }
}
