<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Afficher la page de login pour un Store spécifique (par slug)
     */
    public function showLogin($slug)
    {
        $store = \App\Models\Store::where('slug', $slug)
            ->where('status', \App\Enums\StoreStatus::Active)
            ->with('entity')
            ->firstOrFail();

        return Inertia::render('Auth/Login', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'entity_name' => $store->entity->nom ?? null,
            ],
        ]);
    }

    /**
     * Traiter la connexion PIN
     * Flux : Slug du Store (dans l'URL) + PIN
     * Réservé aux employés uniquement (RESP_LABO, EMPLOYE_LABO, RESP_BOUTIQUE, EMPLOYE_VENTE)
     * Les Admin se connectent via /store/login avec email + password
     */
    public function login(Request $request, $slug)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^\d{4}$/'],
        ]);

        // Récupérer le store depuis le slug
        $store = \App\Models\Store::where('slug', $slug)
            ->where('status', \App\Enums\StoreStatus::Active)
            ->firstOrFail();

        // Chercher l'utilisateur : store_id + PIN
        $user = User::where('store_id', $store->id)
            ->where('pin', User::hashPin($request->pin))
            ->where('active', true)
            ->where('auth_type', 'PIN')
            ->where('role', '!=', 'ADMIN')  // Bloque les Admin (doivent utiliser /store/login)
            ->first();

        if (!$user) {
            return back()->withErrors(['pin' => 'PIN incorrect.']);
        }

        Auth::login($user);
        $request->session()->regenerate();

        // Stocker le slug en session pour le conserver dans les URLs
        $request->session()->put('store_slug', $slug);

        // Rediriger vers le dashboard avec le slug
        return redirect("/{$slug}/dashboard")->with('success', 'Connexion réussie. Bienvenue !');
    }

    /**
     * Déconnexion d'un employé (guard web).
     * Cette route est /{slug}/logout et utilise le cookie de session "employé"
     * (isolé des sessions Store Admin / Super Admin). On ne déconnecte donc que
     * le guard web, et on redirige vers la page de login du même store (slug).
     */
    public function logout(Request $request, $slug)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect("/{$slug}/login")->with('success', 'Vous avez été déconnecté avec succès.');
    }
}
