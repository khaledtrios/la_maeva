<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Middleware;

class ShareSlugWithInertia extends Middleware
{
    public function handle(Request $request, Closure $next)
    {
        // Le slug de la route courante fait foi ; la session ne sert que de repli.
        $slug = $request->route('slug') ?? $request->session()->get('store_slug');

        if ($slug) {
            // INDISPENSABLE : toutes les routes employé sont déclarées sous
            // /{slug}. Sans valeur par défaut, un `route('factures.index')` ou
            // `redirect()->route('returns.show', $r)` appelé depuis un contrôleur
            // lève UrlGenerationException (« Missing parameter: slug ») => erreur
            // 500 sur des parcours réels : création/suppression de facture, envoi
            // de retour, création de BL, création de commande urgente.
            URL::defaults(['slug' => $slug]);
        }

        // Partager le slug avec Inertia pour que React l'ait dans ses props
        if (auth('web')->check()) {
            \Inertia\Inertia::share('slug', $slug);
        }

        return $next($request);
    }
}
