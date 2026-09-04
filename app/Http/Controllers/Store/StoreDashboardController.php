<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Production;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreDashboardController extends Controller
{
    /**
     * Tableau de bord boutique avec statistiques du jour
     */
    public function index()
    {
        $storeUser = Auth::guard('store')->user();
        $store = $storeUser->store()->with('entity')->first();

        // Vérifier que le store a une entity_id associée
        if (!$store || !$store->entity_id) {
            return Inertia::render('Store/Dashboard', [
                'store' => [
                    'id' => $storeUser->store->id,
                    'name' => $storeUser->store->name,
                ],
                'stats' => null,
                'error' => 'Votre boutique n\'est pas correctement configurée.',
            ]);
        }

        $entityId = $store->entity_id;

        // Statistiques du jour pour le LABO associé au store
        $today = now()->toDateString();
        $productions = Production::where('entity_id', $entityId)
            ->whereDate('date', $today)
            ->with('product')
            ->get();

        $stats = [
            'saisies' => $productions->count(),
            'unites_produites' => $productions->sum('quantite'),
            'pertes' => $productions->sum('quantite_pertes'),
        ];

        return Inertia::render('Store/Dashboard', [
            'store' => [
                'id' => $storeUser->store->id,
                'name' => $storeUser->store->name,
            ],
            'user' => [
                'nom' => $storeUser->name,
                'role' => 'STORE_ADMIN',
            ],
            'stats' => $stats,
        ]);
    }
}
