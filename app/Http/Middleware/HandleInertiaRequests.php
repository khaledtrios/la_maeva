<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Déterminer l'utilisateur authentifié (web ou store guard)
        $user = null;

        if ($request->user('store')) {
            // Store Admin
            $storeUser = $request->user('store');
            $store = $storeUser->store()->with('entity')->first();

            $user = [
                'id' => $storeUser->id,
                'nom' => $storeUser->name,
                'role' => 'STORE_ADMIN',
                'entity_id' => $store?->entity_id,
                'entity' => $store && $store->entity ? [
                    'id' => $store->entity->id,
                    'type' => $store->entity->type,
                    'nom' => $store->entity->nom,
                ] : null,
            ];
        } elseif ($request->user()) {
            // Utilisateur web interne
            $user = [
                'id' => $request->user()->id,
                'nom' => $request->user()->nom,
                'role' => $request->user()->role,
                'entity_id' => $request->user()->entity_id,
                'entity' => $request->user()->entity ? [
                    'id' => $request->user()->entity->id,
                    'type' => $request->user()->entity->type,
                    'nom' => $request->user()->entity->nom,
                ] : null,
            ];
        }

        // Construire les données storeAuth si Store Admin
        $storeAuth = null;
        if ($request->user('store')) {
            $storeUser = $request->user('store');
            $store = $storeUser->store;

            if ($store) {
                $storeAuth = [
                    'storeUser' => [
                        'id' => $storeUser->id,
                        'nom' => $storeUser->nom,
                        'email' => $storeUser->email,
                        'role' => $storeUser->role,
                        'store' => [
                            'id' => $store->id,
                            'name' => $store->name,
                            'status' => $store->status->value,
                        ],
                    ],
                ];
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'storeAuth' => $storeAuth ?? [
                'storeUser' => null,
            ],
            'superAdminAuth' => [
                'superAdmin' => $request->user('super_admin') ? [
                    'id' => $request->user('super_admin')->id,
                    'name' => $request->user('super_admin')->name,
                    'email' => $request->user('super_admin')->email,
                ] : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'errors' => fn() => $request->session()->get('errors')
                ? $request->session()->get('errors')->getMessages()
                : (object)[],
        ];
    }
}
