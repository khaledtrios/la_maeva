<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\VenteJour;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\StockMovementService;

class SaleController extends Controller
{
    /**
     * Page des ventes — affiche les réceptions confirmées du jour + ventes existantes
     */
    public function index(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $date = $request->query('date', now()->toDateString());

        // Réceptions confirmées du jour
        $receptions = Reception::with(['expedition.lines.product.category', 'lines.product.category'])
            ->whereHas('expedition', fn($q) => $q->where('boulangerie_id', $entityId))
            ->where('statut', 'CONFIRMEE')
            ->whereDate('date', $date)
            ->get();

        // Ventes déjà enregistrées pour ce jour
        $ventesExistantes = VenteJour::with('product.category')
            ->where('entity_id', $entityId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('product_id');

        // 1. Récupérer tous les produits ayant un stock > 0 (lots non expirés uniquement)
        $stocksParProduit = DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('product_id', '>', 0)
            ->where('quantite', '>', 0)
            ->where(function ($q) {
                $q->whereNull('dlc')
                    ->orWhere('dlc', '>', now()->toDateString());
            })
            ->groupBy('product_id')
            ->select('product_id', DB::raw('SUM(quantite) as stock_total'))
            ->pluck('stock_total', 'product_id');

        // Construire le tableau de données pour l'UI
        $salesData = [];

        // Pour chaque produit en stock (>0), créer une entrée
        foreach ($stocksParProduit as $productId => $stockTotal) {
            $product = \App\Models\Product::with('category')->find($productId);
            if (!$product) continue;

            $qteRecueJour = $receptions->flatMap(fn($r) => $r->lines)
                ->where('product_id', $productId)
                ->sum('qte_recue');

            $existing = $ventesExistantes->get($productId);

            $salesData[$productId] = [
                'product_id'       => $productId,
                'product'          => $product,
                'qte_recue'        => (int)$qteRecueJour,
                'qte_reste'        => $existing ? (int)$existing->qte_reste : 0,
                'qte_vendue'       => $existing ? (int)$existing->qte_vendue : 0,
                'stock_disponible' => (int)$stockTotal,
            ];
        }

        // 2. Ajouter les produits qui ont une vente existante mais pas de stock actuel (stock épuisé)
        foreach ($ventesExistantes as $productId => $vente) {
            if (!isset($salesData[$productId])) {
                $qteRecueJour = $receptions->flatMap(fn($r) => $r->lines)
                    ->where('product_id', $productId)
                    ->sum('qte_recue');

                $salesData[$productId] = [
                    'product_id'       => $productId,
                    'product'          => $vente->product,
                    'qte_recue'        => (int)$qteRecueJour,
                    'qte_reste'        => (int)$vente->qte_reste,
                    'qte_vendue'       => (int)$vente->qte_vendue,
                    'stock_disponible' => 0,
                ];
            }
        }

        // 3. Ajouter les produits avec réception du jour mais sans stock (expiré) et sans vente existante
        foreach ($receptions as $reception) {
            foreach ($reception->lines as $line) {
                $productId = $line->product_id;
                if (!isset($salesData[$productId])) {
                    $salesData[$productId] = [
                        'product_id'       => $productId,
                        'product'          => $line->product,
                        'qte_recue'        => $line->qte_recue,
                        'qte_reste'        => 0,
                        'qte_vendue'       => 0,
                        'stock_disponible' => 0,
                    ];
                }
            }
        }

        $salesData = array_values($salesData);

        return Inertia::render('Sales/Index', [
            'salesData'            => $salesData,
            'date'                 => $date,
            'receptions_confirmees' => $receptions,
        ]);
    }

    /**
     * Enregistrer les ventes du jour
     * Valide le stock disponible (via FIFO, DLC) avant enregistrement.
     * Gère les modifications en annulant l'ancienne vente avant d'appliquer la nouvelle.
     */
    public function store(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $date = $request->input('date', now()->toDateString());

        $validated = $request->validate([
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'lines.*.qte_recue'  => ['required', 'integer', 'min:0'],
            'lines.*.qte_vendue' => ['required', 'integer', 'min:0'],
            'lines.*.qte_reste'  => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::transaction(function () use ($validated, $entityId, $date, $user) {
                foreach ($validated['lines'] as $ligne) {
                    $productId = $ligne['product_id'];
                    $qteRecue = (int) $ligne['qte_recue'];
                    $qteReste = (int) $ligne['qte_reste'];
                    $qteVendue = (int) $ligne['qte_vendue'];

                    if ($qteVendue < 0) {
                        throw new \Exception("Quantité vendue négative impossible (qte_recue < qte_reste).");
                    }

                    // 0. Récupérer la vente existante (si modification)
                    $existingVente = VenteJour::where([
                        'entity_id' => $entityId,
                        'date' => $date,
                        'product_id' => $productId,
                    ])->first();

                    $ancienneQteVendue = $existingVente ? (int)$existingVente->qte_vendue : 0;

                    // 1. Calculer le stock disponible actuel (depuis stock_balances, FIFO, DLC valides)
                    $stockDisponible = StockMovementService::getTotalProductStock($entityId, $productId);

                    // 2. Stock virtuel disponible pour validation = stock physique + ancienne qte vendue
                    $stockPourValidation = $stockDisponible + $ancienneQteVendue;

                    Log::info('Vente validation', [
                        'entity_id' => $entityId,
                        'product_id' => $productId,
                        'stock_balances' => $stockDisponible,
                        'ancienne_qte_vendue' => $ancienneQteVendue,
                        'nouvelle_qte_vendue' => $qteVendue,
                        'stock_pour_validation' => $stockPourValidation,
                    ]);

                    // 3. Validation stricte
                    if ($qteVendue > $stockPourValidation) {
                        $manque = $qteVendue - $stockPourValidation;
                        throw new \Exception(
                            "Stock insuffisant pour le produit #{$productId}. " .
                                "Disponible: {$stockPourValidation}, demandé: {$qteVendue}. " .
                                "Il manque {$manque} unité(s)."
                        );
                    }

                    // 4. Si modification : annuler l'ancienne vente (remettre en stock)
                    if ($existingVente) {
                        StockMovement::create([
                            'entity_id'      => $entityId,
                            'product_id'     => $productId,
                            'type'           => 'ENTREE',
                            'quantite'       => $ancienneQteVendue,
                            'reference'      => 'retour_modification_vente',
                            'reference_id'   => $existingVente->id,
                            'reference_type' => 'vente_jour',
                            'created_by'     => $user->id,
                            'movement_date'  => $date,
                            'notes'          => 'Retour suite à modification de vente',
                        ]);

                        DB::table('stock_balances')
                            ->where('entity_id', $entityId)
                            ->where('product_id', $productId)
                            ->update([
                                'quantite'   => DB::raw('COALESCE(quantite, 0) + ' . $ancienneQteVendue),
                                'updated_at' => now(),
                            ]);

                        Log::info('Ancienne vente annulée (retour stock)', [
                            'vente_id' => $existingVente->id,
                            'product_id' => $productId,
                            'quantite_retournee' => $ancienneQteVendue,
                        ]);

                        $existingVente->delete();
                    }

                    // 5. Enregistrer la nouvelle vente
                    VenteJour::create([
                        'entity_id' => $entityId,
                        'date' => $date,
                        'product_id' => $productId,
                        'qte_recue' => $qteRecue,
                        'qte_reste' => $qteReste,
                        'qte_vendue' => $qteVendue,
                    ]);

                    // 6. Consommer le stock via FIFO si vente > 0
                    if ($qteVendue > 0) {
                        $consommes = StockMovementService::consumeProductFIFO(
                            $entityId,
                            $productId,
                            $qteVendue,
                            [
                                'reference_type' => 'vente_jour',
                                'reference_id'   => null,
                                'created_by'     => $user->id,
                                'movement_date'  => $date,
                            ]
                        );

                        Log::info('Stock consommé avec succès', [
                            'product_id' => $productId,
                            'qte_vendue' => $qteVendue,
                            'lots' => $consommes,
                        ]);
                    }
                }
            });

            $totalVendue = array_sum(array_column($validated['lines'], 'qte_recue')) - array_sum(array_column($validated['lines'], 'qte_reste'));
            $nbLignes = count($validated['lines']);
            return back()->with('success', "Ventes du {$date} enregistrées pour {$nbLignes} produit(s).");
        } catch (\Exception $e) {
            Log::warning('Erreur lors enregistrement ventes', [
                'entity_id' => $entityId,
                'error' => $e->getMessage(),
            ]);
            return back()->with('error', $e->getMessage());
        }
    }
}
