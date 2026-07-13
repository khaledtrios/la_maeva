<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreRejectRequest;
use App\Http\Requests\SuperAdmin\StoreSuspendRequest;
use App\Models\Store;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreManagementController extends Controller
{
    /**
     * Liste des boutiques inscrites, avec leur statut de validation
     */
    public function index()
    {
        $stores = Store::with(['storeUsers' => function ($query) {
            $query->select('id', 'store_id', 'name', 'email');
        }])
            ->withCount('storeUsers')
            ->latest()
            ->get()
            ->map(function (Store $store) {
                $owner = $store->storeUsers->first();

                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'phone' => $store->phone,
                    'address' => $store->address,
                    'city' => $store->city,
                    'postal_code' => $store->postal_code,
                    'siret' => $store->siret,
                    'status' => $store->status->value,
                    'status_label' => $store->status->label(),
                    'status_color' => $store->status->color(),
                    'status_reason' => $store->status_reason,
                    'status_changed_at' => $store->status_changed_at?->toIso8601String(),
                    'created_at' => $store->created_at->toIso8601String(),
                    'owner' => $owner ? [
                        'name' => $owner->name,
                        'email' => $owner->email,
                    ] : null,
                ];
            });

        return Inertia::render('SuperAdmin/Stores/Index', [
            'stores' => $stores,
        ]);
    }

    // ============================================
    // VALIDATION DES BOUTIQUES
    // ============================================

    /**
     * Valide une boutique en attente
     */
    public function approve(Store $store)
    {
        if (! $store->isPending()) {
            return back()->with('error', 'Seules les boutiques en attente peuvent être validées.');
        }

        $store->approve(Auth::guard('super_admin')->user());

        return back()->with('success', "Boutique « {$store->name} » validée avec succès.");
    }

    /**
     * Refuse une boutique en attente
     */
    public function reject(StoreRejectRequest $request, Store $store)
    {
        if (! $store->isPending()) {
            return back()->with('error', 'Seules les boutiques en attente peuvent être refusées.');
        }

        $store->reject(Auth::guard('super_admin')->user(), $request->validated('reason'));

        return back()->with('success', "Boutique « {$store->name} » refusée.");
    }

    /**
     * Suspend une boutique active
     */
    public function suspend(StoreSuspendRequest $request, Store $store)
    {
        if (! $store->isActive()) {
            return back()->with('error', 'Seules les boutiques actives peuvent être suspendues.');
        }

        $store->suspend(Auth::guard('super_admin')->user(), $request->validated('reason'));

        return back()->with('success', "Boutique « {$store->name} » suspendue.");
    }

    /**
     * Réactive une boutique suspendue
     */
    public function reactivate(Store $store)
    {
        if (! $store->isSuspended()) {
            return back()->with('error', 'Seules les boutiques suspendues peuvent être réactivées.');
        }

        $store->reactivate(Auth::guard('super_admin')->user());

        return back()->with('success', "Boutique « {$store->name} » réactivée.");
    }
}
