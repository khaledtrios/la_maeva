<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\SuperAdminLoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SuperAdminAuthController extends Controller
{
    /**
     * Affiche le formulaire de connexion Super Admin.
     */
    public function create()
    {
        return Inertia::render('SuperAdmin/Login');
    }

    /**
     * Traite la connexion Super Admin.
     */
    public function store(SuperAdminLoginRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->route('superadmin.stores.index')->with('success', 'Connexion réussie. Bienvenue !');
    }

    /**
     * Déconnecte le Super Admin.
     */
    public function destroy(Request $request)
    {
        Auth::guard('super_admin')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('superadmin.login')->with('success', 'Vous avez été déconnecté avec succès.');
    }
}
