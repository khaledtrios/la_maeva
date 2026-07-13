<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreDashboardController extends Controller
{
    /**
     * Tableau de bord boutique — placeholder minimal, le vrai back-office arrive en Phase 2.
     */
    public function index()
    {
        $storeUser = Auth::guard('store')->user();

        return Inertia::render('Store/Dashboard', [
            'store' => [
                'id' => $storeUser->store->id,
                'name' => $storeUser->store->name,
            ],
        ]);
    }
}
