<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\StoreLoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreAuthController extends Controller
{
    /**
     * Affiche la page de connexion boutique
     */
    public function create()
    {
        return Inertia::render('Store/Login');
    }

    /**
     * Traite la connexion boutique (guard "store")
     */
    public function store(StoreLoginRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('store.dashboard'))->with('success', 'Connexion réussie. Bienvenue !');
    }

    /**
     * Déconnexion boutique
     */
    public function destroy(Request $request)
    {
        Auth::guard('store')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('store.login')->with('success', 'Vous avez été déconnecté avec succès.');
    }
}
