<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Ingredient;
use App\Models\Entity;
use App\Models\StockBalance;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    /**
     * Liste des mouvements de stock avec filtres.
     * Accessible à tous les rôles selon leur entity_id.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $entityId = $user->entity_id;

        $query = StockMovement::with(['ingredient', 'product', 'creator', 'entity'])
            ->where('entity_id', $entityId);

        // Filtre par ingrédient (pour LABO)
        if ($request->has('ingredient_id') && $request->ingredient_id) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        // Filtre par produit (pour BOULANGERIE)
        if ($request->has('product_id') && $request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        // Filtre par type
        if ($request->has('type') && in_array($request->type, ['ENTREE', 'SORTIE', 'AJUSTEMENT'])) {
            $query->where('type', $request->type);
        }

        // Filtre dates
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filtre DLC (pour les entrées)
        if ($request->has('dlc_status')) {
            $today = now()->toDateString();
            switch ($request->dlc_status) {
                case 'expired':
                    $query->whereNotNull('dlc')
                        ->where('dlc', '<=', $today)
                        ->where('type', 'ENTREE');
                    break;
                case 'expiring_soon':
                    $query->whereNotNull('dlc')
                        ->where('dlc', '>', $today)
                        ->where('dlc', '<=', now()->addDays(3)->toDateString())
                        ->where('type', 'ENTREE');
                    break;
                case 'ok':
                    $query->where(function ($q) use ($today) {
                        $q->whereNull('dlc')
                            ->orWhere('dlc', '>', now()->addDays(3)->toDateString());
                    })->where('type', 'ENTREE');
                    break;
            }
        }

        $movements = $query->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        // Stats pour le header de page
        $stats = [
            'total_entree' => (clone $query)->where('type', 'ENTREE')->sum('quantite'),
            'total_sortie' => abs((clone $query)->where('type', 'SORTIE')->sum('quantite')),
            'expired_count' => (clone $query)
                ->where('type', 'ENTREE')
                ->whereNotNull('dlc')
                ->where('dlc', '<=', now()->toDateString())
                ->count(),
            'expiring_soon_count' => (clone $query)
                ->where('type', 'ENTREE')
                ->whereNotNull('dlc')
                ->where('dlc', '>', now()->toDateString())
                ->where('dlc', '<=', now()->addDays(3)->toDateString())
                ->count(),
        ];

        return Inertia::render('Inventory/Movements', [
            'movements' => $movements,
            'stats' => $stats,
            'ingredients' => Ingredient::orderBy('nom')->get(),
            'products' => \App\Models\Product::orderBy('nom')->get(),
            'entity' => Entity::findOrFail($entityId),
            'filters' => $request->only(['ingredient_id', 'product_id', 'type', 'date_from', 'date_to', 'dlc_status']),
        ]);
    }

    /**
     * Créer une entrée de stock (réception).
     * Réservé aux ADMIN et RESP_LABO.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $this->authorizeRole(['ADMIN', 'RESP_LABO']);

        $validated = $request->validate([
            'ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'quantite'      => ['required', 'numeric', 'min:0.001'],
            'dlc'           => ['nullable', 'date'],
            'lot_number'    => ['nullable', 'string', 'max:100'],
            'provenance'    => ['nullable', 'string', 'max:255'],
            'reference'     => ['nullable', 'string', 'max:255'],
            'notes'         => ['nullable', 'string'],
        ]);

        $movement = StockMovementService::createEntree(
            $user->entity_id,
            $validated['ingredient_id'],
            $validated['quantite'],
            [
                'dlc'        => $validated['dlc'] ?? null,
                'lot_number' => $validated['lot_number'] ?? null,
                'provenance' => $validated['provenance'] ?? null,
                'reference'  => $validated['reference'] ?? null,
                'notes'      => $validated['notes'] ?? null,
            ]
        );

        $ingredient = \App\Models\Ingredient::find($validated['ingredient_id']);
        $ingredientNom = $ingredient?->nom ?? "Ingrédient #{$validated['ingredient_id']}";
        $unite = $ingredient?->unite ?? 'unité';
        return back()->with('success', "Entrée de stock enregistrée : +{$validated['quantite']} {$unite} de « {$ingredientNom} ».");
    }

    /**
     * Créer un ajustement de stock.
     * Réservé aux ADMIN et RESP_LABO.
     */
    public function ajustement(Request $request)
    {
        $user = Auth::user();
        $this->authorizeRole(['ADMIN', 'RESP_LABO']);

        $validated = $request->validate([
            'ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'quantite'      => ['required', 'numeric'], // Peut être positif ou négatif
            'provenance'    => ['nullable', 'string', 'max:255'],
            'reference'     => ['nullable', 'string', 'max:255'],
            'notes'         => ['nullable', 'string'],
        ]);

        $movement = StockMovementService::createAjustement(
            $user->entity_id,
            $validated['ingredient_id'],
            $validated['quantite'],
            [
                'provenance' => $validated['provenance'] ?? null,
                'reference'  => $validated['reference'] ?? null,
                'notes'      => $validated['notes'] ?? 'Ajustement manuel',
            ]
        );

        $ingredient = \App\Models\Ingredient::find($validated['ingredient_id']);
        $ingredientNom = $ingredient?->nom ?? "Ingrédient #{$validated['ingredient_id']}";
        $type = $validated['quantite'] >= 0 ? 'ajout' : 'retrait';
        $absQte = abs($validated['quantite']);
        $unite = $ingredient?->unite ?? 'unité';
        return back()->with('success', "Ajustement de stock enregistré : {$type} de {$absQte} {$unite} sur « {$ingredientNom} ».");
    }

    /**
     * Obtenir les balances FIFO d'un ingrédient (pour sélection lors de consommation).
     * Utilisé par le frontend pour afficher les lots disponibles.
     */
    public function getBalances(Request $request, int $ingredientId)
    {
        $user = Auth::user();
        $entityId = $user->entity_id;

        $balances = StockBalance::with(['ingredient'])
            ->where('entity_id', $entityId)
            ->where('ingredient_id', $ingredientId)
            ->where('quantite', '>', 0)
            ->orderBy('dlc', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($balances);
    }

    /**
     * Vérifier les alertes DLC pour l'entité courante.
     */
    public function getAlerts()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $expired = StockBalance::with('ingredient')
            ->where('entity_id', $user->entity_id)
            ->whereNotNull('dlc')
            ->where('dlc', '<=', $today)
            ->where('quantite', '>', 0)
            ->get();

        $expiringSoon = StockBalance::with('ingredient')
            ->where('entity_id', $user->entity_id)
            ->whereNotNull('dlc')
            ->where('dlc', '>', $today)
            ->where('dlc', '<=', now()->addDays(3)->toDateString())
            ->where('quantite', '>', 0)
            ->get();

        return response()->json([
            'expired' => $expired,
            'expiring_soon' => $expiringSoon,
            'total_expired' => $expired->sum('quantite'),
            'total_expiring_soon' => $expiringSoon->sum('quantite'),
        ]);
    }

    /**
     * Vérifie quels lots seront consommés (prévisualisation FIFO) avant production.
     */
    public function previewConsumption(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'quantite'      => ['required', 'numeric', 'min:0.001'],
        ]);

        $balances = StockBalance::where('entity_id', $user->entity_id)
            ->where('ingredient_id', $validated['ingredient_id'])
            ->where('quantite', '>', 0)
            ->orderBy('dlc', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $remaining = $validated['quantite'];
        $consumedLots = [];

        foreach ($balances as $balance) {
            if ($remaining <= 0) {
                break;
            }

            $toConsume = min($balance->quantite, $remaining);

            $consumedLots[] = [
                'lot_id'     => $balance->getKey(),
                'lot_number' => $balance->lot_number,
                'dlc'        => $balance->dlc,
                'quantite_disponible' => $balance->quantite,
                'quantite_consommee'  => $toConsume,
                'reste_apres'         => $balance->quantite - $toConsume,
            ];

            $remaining -= $toConsume;
        }

        return response()->json([
            'sufficient_stock' => $remaining <= 0,
            'remaining' => $remaining,
            'lots' => $consumedLots,
            'total_available' => $balances->sum('quantite'),
        ]);
    }

    /**
     * Aide pour autoriser les rôles.
     */
    private function authorizeRole(array $roles): void
    {
        $user = Auth::user();
        if (!in_array($user->role, $roles, true)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}