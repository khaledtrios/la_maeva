<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use App\Models\Expedition;
use App\Models\ExpeditionLine;
use App\Models\Product;
use App\Models\Production;
use App\Models\Recipe;
use App\Models\StockBalance;
use App\Models\CommandeUrgente;
use App\Models\CommandeUrgenteLine;
use App\Services\InventoryService;
use App\Services\ProductionAllocationService;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class ProductionController extends Controller
{
    /**
     * Liste des productions pour l'entité courante, avec option de filtrage par date.
     * Nouveau format : tous les produits avec leurs productions de la date (même si 0).
     */
    public function index(Request $request)
    {
        $user     = Auth::user();
        $entityId = $user->entity_id;
        $date     = $request->query('date', now()->toDateString());

        // 1. Tous les produits (avec catégorie)
        $products = Product::with('category')->orderBy('nom')->get();

        // 2. Productions de la date (groupées par produit)
        $productions = Production::where('entity_id', $entityId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('product_id');

        // 3. Pré-calculer les stocks boutiques par produit (toutes entités BOULANGERIE)
        $boutiquesIds = Entity::where('type', 'BOULANGERIE')->pluck('id');

        $stocksBoutiques = StockBalance::whereIn('entity_id', $boutiquesIds)
            ->whereNotNull('product_id')
            ->where('quantite', '>', 0)
            ->selectRaw('product_id, SUM(quantite) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id');

        // 4. Construire le tableau complet avec calcul du stock disponible
        $produitsComplets = $products->map(function ($product) use ($productions, $entityId, $date, $stocksBoutiques) {
            $production = $productions->get($product->id);

            $quantiteProduite = $production ? $production->quantite : 0;
            $pertes           = $production ? $production->quantite_pertes : 0;
            $quantiteNette    = $quantiteProduite - $pertes;

            // Disponible = quantité nette produite ce jour moins les lignes de BL
            // non encore livrées (BROUILLON, ENVOYEE).
            // Les BL LIVRE / ANNULE sont exclus.
            $disponible = 0;

            if ($quantiteNette > 0) {
                $dejaReserve = ExpeditionLine::whereHas('expedition', function ($q) use ($entityId, $date) {
                    $q->where('entity_id', $entityId)
                        ->whereIn('statut', ['BROUILLON', 'ENVOYEE'])
                        ->whereDate('date', $date);
                })
                    ->where('product_id', $product->id)
                    ->whereNotNull('production_id')
                    ->sum('quantite');

                $disponible = max(0, $quantiteNette - $dejaReserve);
            }

            // Dernière production (avant la date courante) — quantité nette
            $derniereProd = Production::where('entity_id', $entityId)
                ->where('product_id', $product->id)
                ->whereDate('date', '<', $date)
                ->orderByDesc('date')
                ->first();

            $derniereProductionNette = $derniereProd
                ? $derniereProd->quantite - $derniereProd->quantite_pertes
                : 0;

            return [
                'product'                    => $product,
                'production'                 => $production,
                'derniere_production_nette'  => $derniereProductionNette, // porté vers la 2e passe
                'row'                        => [
                    'quantite'        => $quantiteProduite,
                    'quantite_pertes' => $pertes,
                    'lot'             => $production ? $production->lot : '',
                    'isModified'      => false,
                    'stock_info'      => [
                        'disponible' => $disponible,
                        'ideal_min'  => 0, // TODO: config
                    ],
                    'suggestion' => 0, // sera recalculé dans la 2e passe
                ],
            ];
        });

        // 5. Summary (tous les produits, avec stock disponible)
        $summary = $produitsComplets->map(function ($item) {
            return [
                'product'          => $item['product'],
                'total_produit'    => $item['row']['quantite'],
                'total_pertes'     => $item['row']['quantite_pertes'],
                'quantite_nette'   => $item['row']['quantite'] - $item['row']['quantite_pertes'],
                'stock_disponible' => $item['row']['stock_info']['disponible'],
            ];
        })->values();

        // 6. Calculer les commandes urgentes par produit POUR LA DATE COURANTE
        // Seules les commandes dont la date de besoin = date de production sont prises en compte.
        $commandesParProduit = CommandeUrgenteLine::whereHas('commandeUrgente', function ($q) use ($date) {
            $q->whereIn('statut', [CommandeUrgente::STATUT_ENVOYEE, CommandeUrgente::STATUT_PRISE_EN_CHARGE])
                ->whereDate('date', $date);
        })
            ->whereHas('commandeUrgente.entity', function ($q) {
                $q->where('type', 'BOULANGERIE');
            })
            ->groupBy('product_id')
            ->select('product_id', DB::raw('SUM(quantite) as total'))
            ->pluck('total', 'product_id');

        // 7. Enrichir stock_info avec les commandes urgentes et calculer l'idéal final
        $produitsCompletsEnrichis = $produitsComplets->map(function ($item) use ($commandesParProduit) {
            $productId       = $item['product']->id;
            $stockDisponible = $item['row']['stock_info']['disponible'];
            $commandesUrgentes = (int) ($commandesParProduit[$productId] ?? 0);

            // Réutiliser la dernière production nette calculée dans la 1re passe (évite N+1)
            $derniereProductionNette = $item['derniere_production_nette'];

            // Idéal final : (dernière prod nette + commandes urgentes) - stock disponible
            $besoinsTotaux = $derniereProductionNette + $commandesUrgentes;
            $idealFinal    = max(0, $besoinsTotaux - $stockDisponible);
            $enAlerte      = $idealFinal > 0;

            return [
                'product'    => $item['product'],
                'production' => $item['production'],
                'row'        => [
                    'quantite'        => $item['row']['quantite'],
                    'quantite_pertes' => $item['row']['quantite_pertes'],
                    'lot'             => $item['row']['lot'],
                    'isModified'      => $item['row']['isModified'],
                    'stock_info'      => [
                        'disponible'        => $stockDisponible,
                        'ideal_min'         => 0,
                        'commandes_urgentes' => $commandesUrgentes,
                        'en_alerte'         => $enAlerte,
                        // a_commander = besoin urgent seulement (commandes - stock)
                        'a_commander' => max(0, $commandesUrgentes - $stockDisponible),
                    ],
                    // Idéal final = (dernière prod nette + commandes) - stock disponible
                    'suggestion' => $idealFinal > 0 ? $idealFinal : null,
                ],
            ];
        });

        // 8. Produits en alerte pour les commandes urgentes (uniquement rôles labo)
        $produitsEnAlerte = [];

        if (in_array($user->role, ['ADMIN', 'RESP_LABO', 'EMPLOYE_LABO'])) {
            $produitsEnAlerte = $produitsCompletsEnrichis
                ->filter(function ($item) {
                    $cmd   = $item['row']['stock_info']['commandes_urgentes'];
                    $dispo = $item['row']['stock_info']['disponible'];

                    return $cmd > 0 && $dispo < $cmd;
                })
                ->map(function ($item) {
                    return [
                        'product_id'         => $item['product']->id,
                        'nom'                => $item['product']->nom,
                        'stock_disponible'   => $item['row']['stock_info']['disponible'],
                        'commandes_urgentes' => $item['row']['stock_info']['commandes_urgentes'],
                        'manque'             => $item['row']['stock_info']['a_commander'],
                    ];
                })
                ->values()
                ->all();
        }

        // Alertes de stock pour le labo
        $stockAlerts = [];

        if (in_array($user->role, ['ADMIN', 'RESP_LABO', 'EMPLOYE_LABO'])) {
            $stockAlerts = ProductionAllocationService::getStockAlerts($entityId, $date);
        }

        // Commandes urgentes en attente (pour les rôles labo uniquement)
        $commandesUrgentes = [];
        $commandesEnAlerte = []; // Commandes PRISE_EN_CHARGE avec stock insuffisant

        if (in_array($user->role, ['ADMIN', 'RESP_LABO', 'EMPLOYE_LABO'])) {
            $commandes = CommandeUrgente::with(['entity', 'lines.product'])
                ->whereIn('statut', [CommandeUrgente::STATUT_ENVOYEE, CommandeUrgente::STATUT_PRISE_EN_CHARGE]) // Seulement PRISE_EN_CHARGE
                ->whereDate('date', $date)
                ->orderByDesc('priorite')
                ->orderByDesc('created_at')
                ->get();

            $entityId = $user->entity_id; // Labo entity

            foreach ($commandes as $commande) {
                // Vérifier le stock disponible pour cette commande
                $shortages = [];
                $linesByProduct = $commande->lines->groupBy('product_id');

                foreach ($linesByProduct as $productId => $lines) {
                    $demande = $lines->sum('quantite');
                    $disponible = ProductionAllocationService::getAvailableQuantity($productId, $entityId, $date);

                    if ($demande > $disponible) {
                        $product = Product::find($productId);
                        $shortages[] = [
                            'product_nom' => $product?->nom ?? "Produit #{$productId}",
                            'demande' => $demande,
                            'disponible' => $disponible,
                            'manque' => $demande - $disponible,
                        ];
                    }
                }

                $commandeData = [
                    'id' => $commande->id,
                    'reference' => "#{$commande->id}",
                    'entity' => $commande->entity?->nom ?? 'Boutique inconnue',
                    'date' => $commande->date?->format('Y-m-d') ?? $commande->date,
                    'statut' => $commande->statut,
                    'priorite' => $commande->priorite,
                    'notes' => $commande->notes,
                    'lines' => $commande->lines->map(function ($line) {
                        return [
                            'id' => $line->id,
                            'product_id' => $line->product_id,
                            'product_nom' => $line->product?->nom ?? "Produit #{$line->product_id}",
                            'quantite' => $line->quantite,
                        ];
                    })->values(),
                    'total_quantite' => $commande->lines->sum('quantite'),
                    'creator' => $commande->creator?->nom ?? 'Inconnu',
                    'stock_suffisant' => empty($shortages),
                    'shortages' => $shortages,
                ];

                $commandesUrgentes[] = $commandeData;

                // Si la commande a des shortages, ajouter à l'alerte
                if (!empty($shortages)) {
                    $commandesEnAlerte[] = $commandeData;
                }
            }
        }

        // S'assurer que commandesEnAlerte est bien un tableau (pour éviter undefined)
        $commandesEnAlerte = $commandesEnAlerte ?? [];

        return Inertia::render('Production/Index', [
            'produitsComplets' => $produitsCompletsEnrichis,
            'summary'          => $summary,
            'date'             => $date,
            'stockAlerts'      => $stockAlerts,
            'produitsEnAlerte' => $produitsEnAlerte,
            'commandesUrgentes' => $commandesUrgentes,
            'commandesEnAlerte' => $commandesEnAlerte,
        ]);
    }

    /**
     * Enregistrer une nouvelle production.
     * Utilise l'algorithme FIFO pour consommer les ingrédients.
     */
    public function store(Request $request)
    {
        $user     = Auth::user();
        $entityId = $user->entity_id;

        $validated = $request->validate([
            'product_id'      => ['required', 'integer', 'exists:products,id'],
            'quantite'        => ['required', 'integer', 'min:1'],
            'quantite_pertes' => ['nullable', 'integer', 'min:0'],
            'lot'             => ['nullable', 'string', 'max:100'],
            'date'            => ['required', 'date'],
        ]);

        // Vérifier la disponibilité des ingrédients avant la transaction
        $recipes = Recipe::where('product_id', $validated['product_id'])
            ->with('ingredient')
            ->get();

        foreach ($recipes as $recipe) {
            $consommation = $recipe->quantite * $validated['quantite'];
            $totalStock   = StockMovementService::getTotalStock($entityId, $recipe->ingredient_id);

            if ($totalStock < $consommation) {
                throw ValidationException::withMessages([
                    'quantite' => "Stock insuffisant pour {$recipe->ingredient->nom}. "
                        . "Disponible: " . round($totalStock, 3)
                        . ", requis: " . round($consommation, 3),
                ]);
            }
        }

        DB::transaction(function () use ($validated, $user, $entityId, $recipes) {
            $production = Production::create([
                'entity_id'       => $entityId,
                'product_id'      => $validated['product_id'],
                'quantite'        => $validated['quantite'],
                'quantite_pertes' => $validated['quantite_pertes'] ?? 0,
                'lot'             => $validated['lot'] ?? null,
                'date'            => $validated['date'],
                'created_by'      => $user->id,
            ]);

            // Déduction du stock via FIFO
            foreach ($recipes as $recipe) {
                $consommation = $recipe->quantite * $validated['quantite'];

                StockMovementService::consumeIngredientFIFO(
                    $entityId,
                    $recipe->ingredient_id,
                    $consommation,
                    [
                        'reference'  => 'PROD #' . $production->id,
                        'created_by' => $user->id,
                    ]
                );
            }
        });

        $product    = Product::find($validated['product_id']);
        $produitNom = $product ? $product->nom : "Produit #{$validated['product_id']}";

        return back()->with('success', "Production de {$validated['quantite']} unités de « {$produitNom} » enregistrée et stock déduit.");
    }

    /**
     * Mettre à jour une production (sans recalcul du stock).
     */
    public function update(Request $request, Production $production)
    {
        $user = Auth::user();

        // Vérification ownership (sauf ADMIN)
        if ($user->role !== 'ADMIN' && $production->entity_id !== $user->entity_id) {
            abort(403);
        }

        $validated = $request->validate([
            'quantite'        => ['required', 'integer', 'min:1'],
            'quantite_pertes' => ['nullable', 'integer', 'min:0', 'lte:quantite'],
            'lot'             => ['nullable', 'string', 'max:100'],
        ]);

        $production->update($validated);

        return back()->with('success', "Production #{$production->id} de « {$production->product->nom} » modifiée.");
    }

    /**
     * Supprimer une production (sans remettre le stock).
     */
    public function destroy(Production $production)
    {
        $user = Auth::user();

        if ($user->role !== 'ADMIN' && $production->entity_id !== $user->entity_id) {
            abort(403);
        }

        $nomProduit = $production->product->nom;
        $production->delete();

        return back()->with('success', "Production de « {$nomProduit} » supprimée.");
    }

    /**
     * POST /production/distribuer — Créer les BL (expéditions) pour les productions du jour.
     * Utilise l'allocation FIFO pour lier chaque ligne aux productions correspondantes.
     */
    public function distribuer(Request $request)
    {
        $user     = Auth::user();
        $entityId = $user->entity_id;
        $date     = $request->input('date', now()->toDateString());

        // Récupérer toutes les productions du jour pour cette entité
        $productions = Production::where('entity_id', $entityId)
            ->whereDate('date', $date)
            ->get();

        if ($productions->isEmpty()) {
            return back()->with('error', 'Aucune production à distribuer pour cette date.');
        }

        // Grouper par produit et sommer les quantités nettes
        $byProduct = [];

        foreach ($productions as $p) {
            $net = $p->quantite - $p->quantite_pertes;
            $byProduct[$p->product_id] = ($byProduct[$p->product_id] ?? 0) + $net;
        }

        $boulangeries = Entity::where('type', 'BOULANGERIE')->get();
        $nbBoutiques  = $boulangeries->count();

        if ($nbBoutiques === 0) {
            return back()->with('error', 'Aucune boulangerie enregistrée.');
        }

        // Vérification préalable : chaque produit a assez de stock disponible
        foreach ($byProduct as $productId => $quantiteTotale) {
            $quantiteParBoutique = floor($quantiteTotale / $nbBoutiques);

            if ($quantiteParBoutique <= 0) {
                continue;
            }

            $disponible = ProductionAllocationService::getAvailableQuantity($productId, $entityId);

            if ($quantiteParBoutique > $disponible) {
                $product = Product::find($productId);
                $nom     = $product?->nom ?? "Produit #{$productId}";

                return back()->with('error', "Stock insuffisant pour {$nom}. Disponible: {$disponible}, demandé par boutique: {$quantiteParBoutique}");
            }
        }

        try {
            DB::transaction(function () use ($byProduct, $boulangeries, $date, $entityId, $user, $nbBoutiques) {
                foreach ($boulangeries as $b) {
                    $lines = collect($byProduct)
                        ->map(fn($total, $pid) => [
                            'product_id' => (int) $pid,
                            'quantite'   => (int) floor($total / $nbBoutiques),
                        ])
                        ->filter(fn($l) => $l['quantite'] > 0)
                        ->values();

                    if ($lines->isEmpty()) {
                        continue;
                    }

                    $expedition = Expedition::create([
                        'entity_id'      => $entityId,
                        'boulangerie_id' => $b->id,
                        'date'           => $date,
                        'statut'         => 'BROUILLON',
                        'created_by'     => $user->id,
                    ]);

                    // Créer les lignes d'expédition avec allocation FIFO
                    foreach ($lines as $l) {
                        $productId        = $l['product_id'];
                        $quantiteDemandee = $l['quantite'];

                        $allocations = ProductionAllocationService::allocateFifo(
                            $productId,
                            $entityId,
                            $quantiteDemandee
                        );

                        foreach ($allocations as $alloc) {
                            ExpeditionLine::create([
                                'expedition_id'   => $expedition->id,
                                'product_id'      => $productId,
                                'production_id'   => $alloc['production_id'],
                                'date_production' => $alloc['date_production'],
                                'quantite'        => $alloc['quantite'],
                                'dlc'             => $alloc['dlc'],
                                'lot_reference'   => $alloc['lot_reference'],
                            ]);
                        }
                    }
                }
            });
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la création des BL : ' . $e->getMessage());
        }

        return redirect()->route('expeditions.index')->with('success', 'Tous les bons de livraison ont été créés pour les boulangeries avec traçabilité DLC complète.');
    }

    /**
     * Batch update/create — Enregistrement de la feuille de production complète.
     * Gère les différences et déduit/remet le stock d'ingrédients en conséquence.
     */
    public function batch(Request $request)
    {
        $user     = Auth::user();
        $entityId = $user->entity_id;
        $date     = $request->input('date', now()->toDateString());
        $lignes   = $request->input('productions', []);

        try {
            DB::transaction(function () use ($lignes, $user, $entityId, $date) {
                foreach ($lignes as $ligne) {
                    $productId = $ligne['product_id'];
                    $quantite  = (int) ($ligne['quantite'] ?? 0);
                    $pertes    = (int) ($ligne['quantite_pertes'] ?? 0);
                    $lot       = $ligne['lot'] ?? null;

                    // 1. Récupérer l'ancienne production (si elle existe)
                    $ancienne = Production::where('entity_id', $entityId)
                        ->whereDate('date', $date)
                        ->where('product_id', $productId)
                        ->first();

                    // 2. Calculer les consommations nettes
                    $ancienneConsommation = $ancienne
                        ? $ancienne->quantite - $ancienne->quantite_pertes
                        : 0;
                    $nouvelleConsommation = $quantite - $pertes;
                    $difference           = $nouvelleConsommation - $ancienneConsommation;

                    // 3. Si différence ≠ 0, ajuster le stock
                    if ($difference !== 0) {
                        $recipes = Recipe::where('product_id', $productId)
                            ->with('ingredient')
                            ->get();

                        if ($recipes->isEmpty()) {
                            // Pas de recette définie : on saute l'ajustement de stock
                            Log::warning("Aucune recette pour le produit #{$productId}, stock non ajusté.");
                        } else {
                            if ($difference > 0) {
                                // Vérifier le stock disponible
                                foreach ($recipes as $recipe) {
                                    $besoin    = $recipe->quantite * $difference;
                                    $disponible = StockMovementService::getTotalStock($entityId, $recipe->ingredient_id);

                                    if ($disponible < $besoin) {
                                        $nom = $recipe->ingredient->nom ?? "Ingrédient #{$recipe->ingredient_id}";
                                        throw new \Exception("Stock insuffisant pour {$nom}. Disponible: {$disponible}, requis: {$besoin}");
                                    }
                                }

                                // Consommer via FIFO
                                foreach ($recipes as $recipe) {
                                    StockMovementService::consumeIngredientFIFO(
                                        $entityId,
                                        $recipe->ingredient_id,
                                        $recipe->quantite * $difference,
                                        [
                                            'reference'  => 'PROD BATCH ' . ($ancienne ? 'UPDATE #' . $ancienne->id : 'CREATE'),
                                            'created_by' => $user->id,
                                        ]
                                    );
                                }
                            } else {
                                // Remettre en stock (différence négative)
                                $remettre = -$difference;

                                foreach ($recipes as $recipe) {
                                    StockMovementService::createEntree(
                                        $entityId,
                                        $recipe->ingredient_id,
                                        $recipe->quantite * $remettre,
                                        [
                                            'lot_number' => 'RETOUR-PROD-' . ($ancienne?->id ?? 'NEW') . '-' . time(),
                                            'reference'  => 'Retour production (réduction)',
                                            'notes'      => "Retour de {$remettre} unités nettes",
                                            'created_by' => $user->id,
                                        ]
                                    );
                                }
                            }
                        }
                    }

                    // 4. Upsert production
                    if ($ancienne) {
                        $ancienne->update([
                            'quantite'        => $quantite,
                            'quantite_pertes' => $pertes,
                            'lot'             => $lot,
                        ]);
                    } else {
                        Production::create([
                            'entity_id'       => $entityId,
                            'product_id'      => $productId,
                            'quantite'        => $quantite,
                            'quantite_pertes' => $pertes,
                            'lot'             => $lot,
                            'date'            => $date,
                            'created_by'      => $user->id,
                        ]);
                    }
                }
            });

            return back()->with('success', 'Feuille de production enregistrée.');
        } catch (\Exception $e) {
            Log::error('Erreur batch production', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }
}
