<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use App\Models\Ingredient;
use App\Models\StockBalance;
use App\Services\InventoryService;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Resout l'ingredient depuis le parametre de route `{ingredient}`.
     *
     * Les routes inventaire existent en DEUX declinaisons : sous
     * /{slug}/inventory (espace Employe) et sous /store/inventory (espace Store
     * Admin). Laravel injecte les parametres de route par POSITION : avec un
     * `Ingredient $ingredient` type-hinte, la variante /{slug} passait le SLUG
     * (string) a la place du modele -> TypeError 500. On recupere donc le
     * parametre PAR SON NOM, ce qui fonctionne pour les deux declinaisons.
     * Le StoreScope global sur Ingredient conserve le cloisonnement (pas
     * d'IDOR inter-store). Meme motif que ProductController::resolveProduct().
     */
    private function resolveIngredient(Request $request): Ingredient
    {
        $ingredient = $request->route('ingredient');

        if ($ingredient instanceof Ingredient) {
            return $ingredient;
        }

        return Ingredient::findOrFail($ingredient);
    }

    /**
     * Page Stocks — affiche les items d'inventaire de l'entité + alertes
     * Migration: utilise maintenant stock_balances comme source de vérité
     * avec seuils depuis ingredient_thresholds
     */
    public function index()
    {
        $user       = $this->getCurrentUser();
        $entityId   = $this->getCurrentEntityId();
        $entity     = Entity::findOrFail($entityId);

        // 1. Récupérer les seuils depuis ingredient_thresholds
        $thresholds = DB::table('ingredient_thresholds')
            ->where('entity_id', $entityId)
            ->pluck('seuil_minimum', 'ingredient_id')
            ->toArray();

        $stockMaxes = DB::table('ingredient_thresholds')
            ->where('entity_id', $entityId)
            ->pluck('stock_max', 'ingredient_id')
            ->toArray();

        // 2. Récupérer TOUS les lots d'ingrédients (y compris quantite = 0)
        // On récupère tous les ingrédients qui ont au moins un lot dans stock_balances
        $allLots = StockBalance::where('entity_id', $entityId)
            ->where('ingredient_id', '!=', null)
            ->get(['ingredient_id', 'quantite', 'dlc', 'lot_number']);

        // Grouper par ingrédient pour calculer total, expiré, valide
        $stockRaw = [];
        foreach ($allLots as $lot) {
            $iid = $lot->ingredient_id;
            if (!isset($stockRaw[$iid])) {
                $stockRaw[$iid] = [
                    'total_quantity' => 0,
                    'expired_quantity' => 0,
                    'valid_quantity' => 0,
                ];
            }
            $stockRaw[$iid]['total_quantity'] += $lot->quantite;
            if ($lot->dlc && $lot->dlc <= now()) {
                $stockRaw[$iid]['expired_quantity'] += $lot->quantite;
            } else {
                $stockRaw[$iid]['valid_quantity'] += $lot->quantite;
            }
        }

        // 3. Récupérer TOUS les ingrédients du catalogue
        // Même ceux sans stock (stockRaw peut ne pas avoir la clé)
        $ingredientsData = Ingredient::orderBy('nom')->get()->keyBy('id');

        // 4. Construire les items avec les métriques (y compris stock = 0)
        $items = collect($ingredientsData)->map(function ($ingredient) use ($stockRaw, $thresholds, $stockMaxes, $entityId) {
            $iid = $ingredient->id;
            $stockInfo = $stockRaw[$iid] ?? [
                'total_quantity' => 0.000,
                'expired_quantity' => 0.000,
                'valid_quantity' => 0.000,
            ];

            $quantite = $stockInfo['total_quantity'];
            $seuil_minimum = $thresholds[$iid] ?? null;
            $stock_max = $stockMaxes[$iid] ?? null;

            return [
                'id' => $iid,
                'entity_id' => $entityId,
                'ingredient_id' => $iid,
                'quantite' => $quantite,
                'valid_quantity' => $stockInfo['valid_quantity'],
                'expired_quantity' => $stockInfo['expired_quantity'],
                'seuil_minimum' => $seuil_minimum,
                'stock_max' => $stock_max,
                'is_low_stock' => $seuil_minimum !== null && $quantite < (float) $seuil_minimum,
                'is_high_stock' => $stock_max !== null && $quantite > (float) $stock_max,
                'created_at' => now(),
                'updated_at' => now(),
                'ingredient' => (object)[
                    'id' => $ingredient->id,
                    'nom' => $ingredient->nom,
                    'unite' => $ingredient->unite,
                    'prix_unitaire' => $ingredient->prix_unitaire,
                ],
            ];
        })->values();

        // 5. Alertes stock bas (seuil dépassé)
        $alerts = $items->filter(fn($i) => $i['is_low_stock'])->values();

        // 5. Alertes stock trop élevé (dépassement du stock_max)
        $highStockAlerts = $items->filter(fn($i) => $i['is_high_stock'])->values();

        // 6. Tous les ingrédients pour le formulaire de création/update
        $ingredients = Ingredient::orderBy('nom')->get();

        // 7. Lots expirés et bientôt expirés (pour alertes DLC) — depuis stock_balances
        $expiredLots = StockBalance::with(['ingredient'])
            ->where('entity_id', $entityId)
            ->where('ingredient_id', '!=', null)
            ->whereNotNull('dlc')
            ->where('dlc', '<=', now()->toDateString())
            ->where('quantite', '>', 0)
            ->orderBy('dlc', 'asc')
            ->get();

        $expiringSoonLots = StockBalance::with(['ingredient'])
            ->where('entity_id', $entityId)
            ->where('ingredient_id', '!=', null)
            ->whereNotNull('dlc')
            ->where('dlc', '>', now()->toDateString())
            ->where('dlc', '<=', now()->addDays(3)->toDateString())
            ->where('quantite', '>', 0)
            ->orderBy('dlc', 'asc')
            ->get();

        return Inertia::render('Inventory/Index', [
            'items'             => $items,
            'alerts'            => $alerts,
            'high_stock_alerts' => $highStockAlerts,
            'ingredients'       => $ingredients,
            'entity'            => $entity,
            // Nouvelles données DLC
            'expired_lots'      => $expiredLots,
            'expiring_soon_lots' => $expiringSoonLots,
            'has_dlc_alerts'    => $expiredLots->count() > 0 || $expiringSoonLots->count() > 0,
        ]);
    }

    /**
     * API: Obtenir les balances (lots FIFO) d'un ingrédient
     * Utilisé par le frontend pour afficher les lots disponibles
     */
    public function getBalances(Request $request, Ingredient $ingredient)
    {
        // Lecture : meme resolution dual-guard que index().
        $entityId = $this->getCurrentEntityId();

        $balances = StockBalance::with('ingredient')
            ->where('entity_id', $entityId)
            ->where('ingredient_id', $ingredient->id)
            ->where('quantite', '>', 0)
            ->orderBy('dlc', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($balances);
    }

    /**
     * Page détaillée des lots (balances FIFO)
     * Accessible via /inventory/lots
     */
    public function lotsIndex(Request $request)
    {
        // Lecture : meme resolution dual-guard que index().
        $entityId = $this->getCurrentEntityId();
        $entity = Entity::findOrFail($entityId);

        // Récupérer toutes les balances groupées par ingrédient
        $query = StockBalance::with(['ingredient', 'entity'])
            ->where('entity_id', $entityId)
            ->where('quantite', '>', 0);

        // Filtre par ingrédient
        if ($request->has('ingredient_id') && $request->ingredient_id) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        // Filtre DLC status
        if ($request->has('dlc_status')) {
            $today = now()->toDateString();
            switch ($request->dlc_status) {
                case 'expired':
                    $query->whereNotNull('dlc')->where('dlc', '<=', $today);
                    break;
                case 'expiring_soon':
                    $query->whereNotNull('dlc')
                        ->where('dlc', '>', $today)
                        ->where('dlc', '<=', now()->addDays(3)->toDateString());
                    break;
                case 'ok':
                    $query->where(function ($q) use ($today) {
                        $q->whereNull('dlc')
                            ->orWhere('dlc', '>', now()->addDays(3)->toDateString());
                    });
                    break;
            }
        }

        $balances = $query->orderBy('dlc', 'asc')
            ->orderBy('created_at', 'asc')
            ->paginate(50)
            ->withQueryString();

        // Stats
        $stats = [
            'total_lots' => $balances->total(),
            'total_quantity' => (float) $balances->sum('quantite'),
            'expired_count' => (clone $query)->whereNotNull('dlc')
                ->where('dlc', '<=', now()->toDateString())->count(),
            'expiring_soon_count' => (clone $query)->whereNotNull('dlc')
                ->where('dlc', '>', now()->toDateString())
                ->where('dlc', '<=', now()->addDays(3)->toDateString())->count(),
        ];

        return Inertia::render('Inventory/Lots', [
            'balances' => $balances,
            'stats' => $stats,
            'ingredients' => Ingredient::orderBy('nom')->get(),
            'entity' => $entity,
            'filters' => $request->only(['ingredient_id', 'dlc_status']),
        ]);
    }

    /**
     * PUT /inventory/{ingredient} — met à jour les seuils et ajuste le stock si nécessaire
     * Migration: utilise StockMovementService pour les ajustements + ingredient_thresholds pour les seuils
     */
    public function update(Request $request)
    {
        $ingredient = $this->resolveIngredient($request);

        // `Auth::user()` resout le guard par defaut ("web") : null pour un
        // Store Admin (guard "store"), d'ou une erreur fatale sur ->entity_id.
        // Meme correctif que ProductionController::batch().
        $entityId = $this->getCurrentEntityId();
        $auteurId = $this->getCurrentUserIdForAttribution();

        if (!$entityId || !$auteurId) {
            return back()->withErrors([
                'inventory' => "Compte incomplet (entite ou employe manquant) : impossible de mettre a jour le stock.",
            ]);
        }

        $validated = $request->validate([
            'quantite'       => ['nullable', 'numeric', 'min:0'],
            'seuil_minimum'  => ['nullable', 'numeric', 'min:0'],
            'stock_max'      => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $entityId, $ingredient, $auteurId) {
            // 1. Mettre à jour les seuils dans ingredient_thresholds
            $thresholdData = [];
            if (array_key_exists('seuil_minimum', $validated) || array_key_exists('stock_max', $validated)) {
                $thresholdData['seuil_minimum'] = $validated['seuil_minimum'] ?? null;
                $thresholdData['stock_max'] = $validated['stock_max'] ?? null;
                $thresholdData['updated_at'] = now();
                // `ingredient_thresholds.store_id` est NOT NULL (vague 3b). La
                // ligne est ecrite via le QUERY BUILDER : le trait BelongsToStore
                // ne s'applique pas et ne peut donc pas remplir `store_id`. Sans
                // cette ligne, toute creation de seuil echoue (« Field 'store_id'
                // doesn't have a default value »).
                $thresholdData['store_id'] = Entity::whereKey($entityId)->value('store_id');

                DB::table('ingredient_thresholds')->updateOrInsert(
                    [
                        'entity_id' => $entityId,
                        'ingredient_id' => $ingredient->id,
                    ],
                    $thresholdData
                );
            }

            // 2. Si quantite fournie = ajustement manuel via StockMovementService
            if (isset($validated['quantite'])) {
                // Calculer la différence entre nouvelle quantité et stock actuel (depuis stock_balances)
                $currentStock = DB::table('stock_balances')
                    ->where('entity_id', $entityId)
                    ->where('ingredient_id', $ingredient->id)
                    ->sum('quantite');

                $difference = (float) $validated['quantite'] - (float) $currentStock;

                if (abs($difference) > 0.001) {
                    // Créer un mouvement d'ajustement
                    StockMovementService::createAjustement(
                        $entityId,
                        $ingredient->id,
                        $difference,
                        [
                            'reference' => 'Ajustement manuel via formulaire',
                            'notes' => "Ajustement direct: {$currentStock} → {$validated['quantite']}",
                            'created_by' => $auteurId,
                        ]
                    );
                }
            }
        });

        return back()->with('success', "Stock de l'ingrédient « {$ingredient->nom} » et seuils mis à jour.");
    }

    /**
     * POST /inventory/create-ingredient — crée un ingrédient + son seuil + stock initial
     * Migration: utilise StockMovementService pour le stock initial
     */
    public function createIngredientWithStock(Request $request)
    {
        // `Auth::user()` resout le guard par defaut ("web") : null pour un
        // Store Admin (guard "store"), d'ou une erreur fatale sur ->entity_id.
        // Meme correctif que ProductionController::batch().
        $entityId = $this->getCurrentEntityId();
        $auteurId = $this->getCurrentUserIdForAttribution();

        if (!$entityId || !$auteurId) {
            return back()->withErrors([
                'inventory' => "Compte incomplet (entite ou employe manquant) : impossible de creer l'ingredient.",
            ]);
        }

        $validated = $request->validate([
            'nom'           => ['required', 'string', 'max:255'],
            'unite'         => ['nullable', 'string', 'max:50'],
            'prix_unitaire' => ['nullable', 'numeric', 'min:0'],
            'quantite'      => ['nullable', 'numeric', 'min:0'],
            'seuil_minimum' => ['nullable', 'numeric', 'min:0'],
            'stock_max'     => ['nullable', 'numeric', 'min:0'],
        ]);

        $ingredient = DB::transaction(function () use ($validated, $entityId, $auteurId) {

            // 1. Créer l'ingrédient
            $ingredient = Ingredient::create([
                'nom'           => $validated['nom'],
                'unite'         => $validated['unite'] ?? null,
                'prix_unitaire' => $validated['prix_unitaire'] ?? null,
            ]);

            // 2. Seuils
            if (!is_null($validated['seuil_minimum'] ?? null) || !is_null($validated['stock_max'] ?? null)) {
                DB::table('ingredient_thresholds')->insert([
                    'entity_id'      => $entityId,
                    'ingredient_id'  => $ingredient->id,
                    'seuil_minimum'  => $validated['seuil_minimum'] ?? null,
                    'stock_max'      => $validated['stock_max'] ?? null,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            // 3. Stock initial
            $initialQuantity = $validated['quantite'] ?? 0;

            if ($initialQuantity > 0) {
                StockMovementService::createEntree(
                    $entityId,
                    $ingredient->id,
                    $initialQuantity,
                    [
                        'lot_number' => 'CREATION-' . $ingredient->id . '-' . now()->format('YmdHis'),
                        'reference'  => 'Création ingrédient',
                        'notes'      => "Stock initial à la création de l'ingrédient",
                        'created_by' => $auteurId,
                    ]
                );
            }

            return $ingredient;
        });

        return back()->with(
            'success',
            "L'ingrédient « {$ingredient->nom} » a été créé avec son stock initial de {$validated['quantite']} {$validated['unite']}."
        );
    }

    /**
     * PUT /inventory/adjust-batch
     * Ajustement batch des stocks (entrées/sorties) via inputs inline
     * Permet de modifier plusieurs ingrédients d'un coup
     */
    public function adjustBatch(Request $request)
    {
        // `Auth::user()` resout le guard par defaut ("web") : null pour un
        // Store Admin (guard "store"), d'ou une erreur fatale sur ->entity_id.
        // Meme correctif que ProductionController::batch().
        $entityId = $this->getCurrentEntityId();
        // `stock_movements.created_by` reference `users` : l'id d'un StoreUser
        // n'y est pas valide (cf. getCurrentUserIdForAttribution).
        $auteurId = $this->getCurrentUserIdForAttribution();

        if (!$entityId || !$auteurId) {
            return back()->withErrors([
                'inventory' => "Compte incomplet (entite ou employe manquant) : impossible d'ajuster le stock.",
            ]);
        }

        $validated = $request->validate([
            'adjustments' => ['required', 'array', 'min:1'],
            'adjustments.*.ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'adjustments.*.adjustment' => ['required', 'numeric'],
            'adjustments.*.note' => ['nullable', 'string', 'max:255'],
        ]);

        $count = 0;
        DB::transaction(function () use ($validated, $entityId, $auteurId, &$count) {
            foreach ($validated['adjustments'] as $adj) {
                $adjustment = (float) $adj['adjustment'];

                // Ignorer les ajustements nuls
                if (abs($adjustment) < 0.001) {
                    continue;
                }

                StockMovementService::createAjustement(
                    $entityId,
                    $adj['ingredient_id'],
                    $adjustment,
                    [
                        'reference' => 'Ajustement batch inline',
                        'notes' => $adj['note'] ?? 'Ajustement depuis l\'interface stocks',
                        'created_by' => $auteurId,
                    ]
                );
                $count++;
            }
        });

        $message = $count > 0
            ? "{$count} ajustement(s) effectué(s) avec succès."
            : "Aucun ajustement à effectuer.";

        return back()->with('success', $message);
    }
}
