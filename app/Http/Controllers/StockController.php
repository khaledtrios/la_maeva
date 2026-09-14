<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Entity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockController extends Controller
{
    /**
     * Vue d'ensemble stock boulangerie
     * GET /stock
     * Accessible: RESP_BOUTIQUE, EMPLOYE_VENTE, ADMIN
     */
    public function index()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // 1. Stock agrégé par produit (groupé par produit)
        // Récupérer d'abord tous les lots avec DLC pour calculer les métriques
        $allLots = StockBalance::where('entity_id', $entityId)
            ->where('product_id', '!=', null)
            ->where('quantite', '>', 0)
            ->get(['product_id', 'quantite', 'dlc']);

        // Grouper par produit pour calculer total, expiré, valide
        $stockByProductRaw = [];
        foreach ($allLots as $lot) {
            $pid = $lot->product_id;
            if (!isset($stockByProductRaw[$pid])) {
                $stockByProductRaw[$pid] = [
                    'total_quantity' => 0,
                    'expired_quantity' => 0,
                    'valid_quantity' => 0,
                    'earliest_dlc' => null,
                    'latest_dlc' => null,
                ];
            }
            $stockByProductRaw[$pid]['total_quantity'] += $lot->quantite;
            if ($lot->dlc && $lot->dlc <= now()) {
                $stockByProductRaw[$pid]['expired_quantity'] += $lot->quantite;
            } else {
                $stockByProductRaw[$pid]['valid_quantity'] += $lot->quantite;
            }
            if ($lot->dlc) {
                if (!$stockByProductRaw[$pid]['earliest_dlc'] || $lot->dlc < $stockByProductRaw[$pid]['earliest_dlc']) {
                    $stockByProductRaw[$pid]['earliest_dlc'] = $lot->dlc;
                }
                if (!$stockByProductRaw[$pid]['latest_dlc'] || $lot->dlc > $stockByProductRaw[$pid]['latest_dlc']) {
                    $stockByProductRaw[$pid]['latest_dlc'] = $lot->dlc;
                }
            }
        }

        // Charger les produits et catégories
        $productsWithCategory = Product::with('category')
            ->whereIn('id', array_keys($stockByProductRaw))
            ->get()
            ->keyBy('id');

        // Construire le résultat final
        $stockByProduct = collect($stockByProductRaw)->map(function ($data, $productId) use ($productsWithCategory) {
            $product = $productsWithCategory->get($productId);
            if (!$product) return null;

            return (object)[
                'product_id' => $productId,
                'product_nom' => $product->nom,
                'product_code' => $product->code,
                'category_nom' => $product->category ? $product->category->nom : '',
                'total_quantity' => $data['total_quantity'],
                'expired_quantity' => $data['expired_quantity'],
                'valid_quantity' => $data['valid_quantity'],
                'earliest_dlc' => $data['earliest_dlc'] ? $data['earliest_dlc']->format('Y-m-d') : null,
                'latest_dlc' => $data['latest_dlc'] ? $data['latest_dlc']->format('Y-m-d') : null,
                'cout_revient' => $product->cout_revient,
            ];
        })->filter()->sortBy('earliest_dlc')->values();

        // 2. Lots détaillés (pour ajustement)
        $detailedLots = StockBalance::with(['product.category'])
            ->where('entity_id', $entityId)
            ->where('product_id', '!=', null)
            ->where('quantite', '>', 0)
            ->orderBy('dlc', 'asc')
            ->get()
            ->map(fn($lot) => [
                'id' => $lot->id,
                'entity_id' => $lot->entity_id,
                'product_id' => $lot->product_id,
                'product_nom' => $lot->product?->nom ?? 'Produit inconnu',
                'product_code' => $lot->product?->code ?? '',
                'category_nom' => $lot->product?->category?->nom ?? '',
                'quantite' => (float) $lot->quantite,
                'dlc' => $lot->dlc ? $lot->dlc->format('Y-m-d') : null,
                'lot_number' => $lot->lot_number,
            ]);

        // 3. Alertes DLC
        $today = now()->toDateString();
        $expiringLots = StockBalance::with(['product', 'product.category'])
            ->where('entity_id', $entityId)
            ->where('product_id', '!=', null)
            ->whereNotNull('dlc')
            ->where('dlc', '>', $today)
            ->where('dlc', '<=', now()->addDays(3)->toDateString())
            ->where('quantite', '>', 0)
            ->get()
            ->map(fn($lot) => [
                'id' => $lot->id,
                'product_id' => $lot->product_id,
                'product_nom' => $lot->product?->nom ?? 'Produit inconnu',
                'quantite' => (float) $lot->quantite,
                'dlc' => $lot->dlc ? $lot->dlc->format('Y-m-d') : null,
                'lot_number' => $lot->lot_number,
                'days_remaining' => $lot->dlc ? now()->diffInDays($lot->dlc) : 0,
            ]);

        $expiredLots = StockBalance::with(['product', 'product.category'])
            ->where('entity_id', $entityId)
            ->where('product_id', '!=', null)
            ->whereNotNull('dlc')
            ->where('dlc', '<=', $today)
            ->where('quantite', '>', 0)
            ->get()
            ->map(fn($lot) => [
                'id' => $lot->id,
                'product_id' => $lot->product_id,
                'product_nom' => $lot->product?->nom ?? 'Produit inconnu',
                'quantite' => (float) $lot->quantite,
                'dlc' => $lot->dlc ? $lot->dlc->format('Y-m-d') : null,
                'lot_number' => $lot->lot_number,
                'days_expired' => $lot->dlc ? now()->diffInDays($lot->dlc) : 0,
            ]);

        // 4. Valeur stock (coût de revient) - uniquement sur le stock valide
        $stockValue = 0;
        foreach ($stockByProduct as $item) {
            $stockValue += $item->valid_quantity * ($item->cout_revient ?? 0);
        }

        // 5. Quantités totales
        $totalQuantity = $stockByProduct->sum('total_quantity');
        $validQuantity = $stockByProduct->sum('valid_quantity');

        return Inertia::render('Stock/Index', [
            'stock_by_product' => $stockByProduct,
            'detailed_lots' => $detailedLots,
            'expiring_lots' => $expiringLots,
            'expired_lots' => $expiredLots,
            'total_value' => round($stockValue, 2),
            'total_quantity' => $totalQuantity,
            'valid_quantity' => $validQuantity,
            'products' => Product::with('category')->orderBy('nom')->get(),
            'entity' => Entity::findOrFail($entityId),
        ]);
    }

    /**
     * Ajustement manuel stock boulangerie
     * POST /stock/adjust
     * Accessible: RESP_BOUTIQUE, ADMIN
     */
    public function adjust(Request $request)
    {
        $this->authorizeRole(['RESP_BOUTIQUE', 'ADMIN', 'STORE_ADMIN']);

        // `stock_movements.created_by` reference `users` : l'id d'un StoreUser
        // n'y est pas valide (cf. getCurrentUserIdForAttribution).
        $auteurId = $this->getCurrentUserIdForAttribution();

        if (!$auteurId) {
            return back()->withErrors([
                'stock' => "Aucun employé actif rattaché à votre boutique : créez-en un avant d'ajuster le stock.",
            ]);
        }

        $validated = $request->validate([
            'product_id'      => ['required', 'integer', 'exists:products,id'],
            'quantite_delta'  => ['required', 'integer', 'not_in:0'],
            'raison'          => ['required', 'string', 'max:255'],
            'lot_number'      => ['nullable', 'string', 'max:100'],
        ]);

        $entityId = $this->getCurrentEntityId();
        $productId = $validated['product_id'];
        $delta = $validated['quantite_delta'];
        $raison = $validated['raison'];
        $lotNumber = $validated['lot_number'] ?? null;

        DB::transaction(function () use ($entityId, $productId, $delta, $raison, $lotNumber, $auteurId) {
            // Trouver le lot cible
            $query = StockBalance::where('entity_id', $entityId)
                ->where('product_id', $productId)
                ->where('quantite', '>', 0);

            if ($lotNumber) {
                $lot = $query->where('lot_number', $lotNumber)->first();
            } else {
                // FIFO: lot le plus ancien (DLC la plus proche)
                $lot = $query->orderBy('dlc', 'asc')->first();
            }

            // Si ajustement positif sans lot existant → créer nouveau lot
            if (!$lot && $delta > 0) {
                $lot = StockBalance::create([
                    'entity_id'  => $entityId,
                    'product_id' => $productId,
                    'lot_number' => 'ADJ-' . now()->timestamp . '-' . $productId,
                    'quantite'   => 0,
                    'dlc'        => now()->addDays(7)->toDateString(), // DLC par défaut
                ]);
            }

            if (!$lot) {
                throw new \Exception('Aucun lot disponible pour ajustement négatif');
            }

            $oldQty = (float) $lot->quantite;
            $newQty = $oldQty + $delta;

            if ($newQty < 0) {
                $delta = -$oldQty; // clamp
                $newQty = 0;
            }

            $lot->update(['quantite' => $newQty, 'updated_at' => now()]);

            if ($newQty <= 0.0001) {
                $lot->delete();
            }

            $type = $delta > 0 ? 'ADJUSTMENT_IN' : 'WASTE';

            StockMovement::create([
                'entity_id'      => $entityId,
                'product_id'     => $productId,
                'type'           => $type,
                'quantite'       => abs($delta),
                'dlc'            => $lot->dlc,
                'lot_number'     => $lot->lot_number,
                'notes'          => "Ajustement: {$raison} (lot {$lot->lot_number}, {$oldQty}→{$newQty})",
                'created_by'     => $auteurId,
                'movement_date'  => now()->toDateString(),
            ]);
        });

        $typeAjustement = $delta > 0 ? 'ajout' : 'retrait';
        $absDelta = abs($delta);
        return back()->with('success', "Ajustement {$typeAjustement} de {$absDelta} unité(s) sur le produit enregistré.");
    }

    /**
     * Historique mouvements stock boulangerie
     * GET /stock/movements
     * Accessible: RESP_BOUTIQUE, EMPLOYE_VENTE, ADMIN
     */
    public function movements(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $dateFrom = $request->query('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->query('date_to', now()->toDateString());
        $productId = $request->query('product_id');
        $type = $request->query('type');

        $query = StockMovement::with(['product.category', 'creator'])
            ->where('entity_id', $entityId)
            ->where('product_id', '!=', null)
            ->whereBetween('movement_date', [$dateFrom, $dateTo])
            ->orderByDesc('movement_date')
            ->orderByDesc('created_at');

        if ($productId) {
            $query->where('product_id', $productId);
        }

        if ($type && in_array($type, ['ENTREE', 'SORTIE', 'ADJUSTMENT_IN', 'WASTE'])) {
            $query->where('type', $type);
        }

        $movements = $query->paginate(50)->withQueryString();

        // Stats
        $totalEntree = (clone $query)->where('type', 'ENTREE')->sum('quantite');
        $totalSortie = abs((clone $query)->where('type', 'SORTIE')->sum('quantite'));

        return Inertia::render('StockMovements/Index', [
            'movements' => $movements,
            'filters' => compact('dateFrom', 'dateTo', 'productId', 'type'),
            'products' => Product::orderBy('nom')->get(),
            'stats' => [
                'total_entree' => $totalEntree,
                'total_sortie' => $totalSortie,
            ],
        ]);
    }

    /**
     * Autoriser les rôles
     */
    private function authorizeRole(array $roles): void
    {
        // `Auth::user()` resout le guard par defaut ("web") : null pour un Store
        // Admin (guard "store"), donc `$user->role` levait une erreur fatale
        // AVANT meme le controle -- alors que STORE_ADMIN figure bien dans la
        // liste autorisee. `getCurrentUser()` gere les deux guards.
        $user = $this->getCurrentUser();

        if (!$user || !in_array($user->role, $roles, true)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
