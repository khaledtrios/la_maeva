<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Afficher la page de login
     */
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Traiter la connexion PIN
     * Filtre uniquement les utilisateurs PIN, pas les Store Admin
     */
    public function login(Request $request)
    {
        $request->validate([
            'entity_id' => ['required', 'integer', 'min:1'],
            'pin' => ['required', 'string', 'size:4'],
        ]);

        $user = User::where('entity_id', $request->entity_id)
            ->where('pin', User::hashPin($request->pin))
            ->where('active', true)
            ->where('auth_type', 'PIN')  // Bloque les Store Admin (auth_type=EMAIL_PASSWORD)
            ->first();

        if (!$user) {
            return back()->withErrors(['pin' => 'PIN ou entité invalide.']);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'))->with('success', 'Connexion réussie. Bienvenue !');
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Vous avez été déconnecté avec succès.');
    }
}
