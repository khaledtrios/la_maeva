<?php

namespace App\Http\Controllers\Store;

use App\Enums\StoreUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\StoreRegistrationRequest;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StoreRegistrationController extends Controller
{
    /**
     * Affiche le formulaire d'inscription boutique
     */
    public function create()
    {
        return Inertia::render('Store/Register');
    }

    /**
     * Traite l'inscription d'une nouvelle boutique (compte en attente de validation)
     */
    public function store(StoreRegistrationRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            $store = Store::create([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'siret' => $validated['siret'] ?? null,
            ]);

            $store->storeUsers()->create([
                'name' => $validated['owner_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => StoreUserRole::StoreAdmin,
                'active' => true,
            ]);
        });

        return redirect()->route('store.login')->with('success', 'Votre inscription a bien été enregistrée. Elle est en attente de validation par notre équipe.');
    }
}
