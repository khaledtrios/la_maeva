<?php

namespace App\Services;

use App\Models\Entity;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Production;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StockMovementService
{
    /**
     * Store proprietaire d'une entite.
     *
     * `stock_balances.store_id` est NOT NULL (Phase 4, vague 3b) mais les
     * balances sont ecrites via le QUERY BUILDER (`DB::table()->updateOrInsert`)
     * et non via le modele : le trait BelongsToStore, qui remplit `store_id` a
     * la creation, NE S'APPLIQUE PAS. Toute nouvelle ligne de balance partait
     * donc sans `store_id` et l'INSERT echouait (« Field 'store_id' doesn't have
     * a default value »). C'est cette meme resolution que fait le trait.
     */
    private static function storeIdPourEntite(int $entityId): ?int
    {
        return Entity::whereKey($entityId)->value('store_id');
    }

    /**
     * Créer un mouvement d'entrée (réception de stock pour ingrédients).
     *
     * @param int $entityId
     * @param int $ingredientId
     * @param float $quantite
     * @param array $options ['dlc' => date, 'lot_number' => string, 'provenance' => string, 'reference' => string, 'notes' => string]
     * @return StockMovement
     */
    public static function createEntree(
        int $entityId,
        int $ingredientId,
        float $quantite,
        array $options = []
    ): StockMovement {
        return DB::transaction(function () use ($entityId, $ingredientId, $quantite, $options) {
            // 1. Créer le mouvement (stock_movements.dlc peut être NULL)
            $movement = StockMovement::create([
                'entity_id'     => $entityId,
                'ingredient_id' => $ingredientId,
                'type'          => 'ENTREE',
                'quantite'      => $quantite,
                'dlc'           => $options['dlc'] ?? null,
                'lot_number'    => $options['lot_number'] ?? null,
                'provenance'    => $options['provenance'] ?? null,
                'reference'     => $options['reference'] ?? null,
                'notes'         => $options['notes'] ?? null,
                // `Auth::id()` seul resout le guard par defaut ("web") : il vaut
                // null pour un Store Admin (guard "store") et l'INSERT echouait
                // (`created_by` est NOT NULL). L'appelant fournit desormais
                // l'auteur resolu ; meme convention que consumeIngredientFIFO()
                // et createSortie() plus bas.
                'created_by'    => $options['created_by'] ?? Auth::id(),
            ]);

            // 2. Mettre à jour la balance (stock_balances.dlc fait partie de la PK → doit être non-null)
            // Si dlc est null, on utilise une date sentinelle pour représenter "sans DLC"
            $balanceDlc = $options['dlc'] ?? '2099-12-31';

            $key = [
                'entity_id'     => $entityId,
                'ingredient_id' => $ingredientId,
                'dlc'           => $balanceDlc,
                'lot_number'    => $options['lot_number'] ?? null,
            ];

            DB::table('stock_balances')->updateOrInsert(
                $key,
                [
                    'store_id'   => self::storeIdPourEntite($entityId),
                    'quantite'   => DB::raw('COALESCE(quantite, 0) + ' . $quantite),
                    'updated_at' => now(),
                ]
            );

            return $movement;
        });
    }

    /**
     * Créer un mouvement d'ajustement (correction manuelle pour ingrédients).
     */
    public static function createAjustement(
        int $entityId,
        int $ingredientId,
        float $quantite,
        array $options = []
    ): StockMovement {
        return DB::transaction(function () use ($entityId, $ingredientId, $quantite, $options) {
            $lotNumber = 'AJUSTEMENT-' . time();

            $movement = StockMovement::create([
                'entity_id'     => $entityId,
                'ingredient_id' => $ingredientId,
                'type'          => 'AJUSTEMENT',
                'quantite'      => $quantite,
                'dlc'           => null,
                'lot_number'    => $lotNumber,
                'provenance'    => $options['provenance'] ?? null,
                'reference'     => $options['reference'] ?? null,
                'notes'         => $options['notes'] ?? 'Ajustement manuel',
                // `Auth::id()` seul resout le guard par defaut ("web") : il vaut
                // null pour un Store Admin (guard "store") et l'INSERT echouait
                // (`created_by` est NOT NULL). L'appelant fournit desormais
                // l'auteur resolu ; meme convention que consumeIngredientFIFO()
                // et createSortie() plus bas.
                'created_by'    => $options['created_by'] ?? Auth::id(),
            ]);

            DB::table('stock_balances')->updateOrInsert(
                [
                    'entity_id'     => $entityId,
                    'ingredient_id' => $ingredientId,
                    'dlc'           => '2099-12-31',
                    'lot_number'    => $lotNumber,
                ],
                [
                    'store_id'   => self::storeIdPourEntite($entityId),
                    'quantite'   => DB::raw('COALESCE(quantite, 0) + ' . $quantite),
                    'updated_at' => now(),
                ]
            );

            return $movement;
        });
    }

    /**
     * Consommer un ingrédient selon FIFO (First-In-First-Out).
     *
     * @param int $entityId
     * @param int $ingredientId
     * @param float $quantiteRequise
     * @param array $options ['reference' => string, 'created_by' => int, 'production_id' => int]
     * @return array Liste des lots consommés avec détails
     * @throws \Exception si stock insuffisant
     */
    public static function consumeIngredientFIFO(
        int $entityId,
        int $ingredientId,
        float $quantiteRequise,
        array $options = []
    ): array {
        if ($quantiteRequise <= 0) {
            return [];
        }

        return DB::transaction(function () use ($entityId, $ingredientId, $quantiteRequise, $options) {
            $lots = DB::table('stock_balances')
                ->where('entity_id', $entityId)
                ->where('ingredient_id', $ingredientId)
                ->where('quantite', '>', 0)
                // Ne consommer que les lots non expirés (dlc NULL ou > aujourd'hui)
                ->where(function ($q) {
                    $q->whereNull('dlc')
                        ->orWhere('dlc', '>', now()->toDateString());
                })
                ->orderBy('dlc', 'asc')
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->get();

            $reste = $quantiteRequise;
            $consommes = [];

            foreach ($lots as $lot) {
                if ($reste <= 0.001) {
                    break;
                }

                $aPrelever = min($lot->quantite, $reste);

                StockMovement::create([
                    'entity_id'     => $entityId,
                    'ingredient_id' => $ingredientId,
                    'type'          => 'SORTIE',
                    'quantite'      => -$aPrelever,
                    'dlc'           => $lot->dlc,
                    'lot_number'    => $lot->lot_number,
                    'reference'     => $options['reference'] ?? null,
                    'reference_type' => $options['reference_type'] ?? null,
                    'reference_id'  => $options['reference_id'] ?? null,
                    'production_id' => $options['production_id'] ?? null,
                    'created_by'    => $options['created_by'] ?? Auth::id(),
                    'movement_date' => $options['movement_date'] ?? now()->toDateString(),
                ]);


                $newQuantity = $lot->quantite - $aPrelever;
                Log::debug('Sortie stock ingrédient', [
                    'ingredient_id' => $ingredientId,
                    'dlc' => $lot->dlc,
                    'lot_number' => $lot->lot_number,
                    'preleve' => $aPrelever,
                    'reste_apres' => $newQuantity,
                ]);
                if ($newQuantity <= 0.0001) {
                    DB::table('stock_balances')
                        ->where('entity_id', $entityId)
                        ->where('ingredient_id', $ingredientId)
                        ->where('dlc', $lot->dlc)
                        ->where('lot_number', $lot->lot_number)
                        ->delete();
                } else {
                    DB::table('stock_balances')
                        ->where('entity_id', $entityId)
                        ->where('ingredient_id', $ingredientId)
                        ->where('dlc', $lot->dlc)
                        ->where('lot_number', $lot->lot_number)
                        ->update(['quantite' => $newQuantity, 'updated_at' => now()]);
                }

                $consommes[] = [
                    'lot_id'     => $lot->id ?? null,
                    'dlc'        => $lot->dlc,
                    'lot_number' => $lot->lot_number,
                    'quantite'   => $aPrelever,
                ];

                $reste -= $aPrelever;
            }

            if ($reste > 0.001) {
                throw new \Exception(
                    "Stock insuffisant pour l'ingrédient #{$ingredientId}. Il manque " . round($reste, 3) . " unités."
                );
            }

            return $consommes;
        });
    }

    /**
     * Obtenir le stock total disponible pour un ingrédient (lots non expirés uniquement).
     */
    public static function getTotalStock(int $entityId, int $ingredientId): float
    {
        return DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('ingredient_id', $ingredientId)
            ->where(function ($q) {
                $q->whereNull('dlc')
                    ->orWhere('dlc', '>', now()->toDateString());
            })
            ->sum('quantite');
    }

    /**
     * Obtenir les balances FIFO d'un ingrédient (lots non expirés).
     */
    public static function getBalancesFIFO(int $entityId, int $ingredientId)
    {
        return DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('ingredient_id', $ingredientId)
            ->where('quantite', '>', 0)
            ->where(function ($q) {
                $q->whereNull('dlc')
                    ->orWhere('dlc', '>', now()->toDateString());
            })
            ->orderBy('dlc', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Obtenir les lots expirés.
     */
    public static function getExpiredLots(int $entityId)
    {
        return StockBalance::with('ingredient')
            ->where('entity_id', $entityId)
            ->whereNotNull('dlc')
            ->where('dlc', '<=', now()->toDateString())
            ->where('quantite', '>', 0)
            ->get();
    }

    /**
     * Obtenir les lots arrivant à expiration bientôt.
     */
    public static function getExpiringSoonLots(int $entityId, int $days = 3)
    {
        return StockBalance::with('ingredient')
            ->where('entity_id', $entityId)
            ->whereNotNull('dlc')
            ->where('dlc', '>', now()->toDateString())
            ->where('dlc', '<=', now()->addDays($days)->toDateString())
            ->where('quantite', '>', 0)
            ->get();
    }

    /**
     * Créer une entrée de stock pour un produit fini (boulangerie).
     * Appelé lors de la réception d'une expédition.
     *
     * @param int $entityId        Entité boulangerie
     * @param int $productId       ID du produit reçu
     * @param int $quantity        Quantité reçue
     * @param \Carbon\Carbon|null $dlc Date limite de consommation
     * @param array $options       ['lot_number', 'expedition_line_id', 'provenance', 'reference', 'notes', 'movement_date']
     * @return StockMovement
     */
    public static function createProductEntree(
        int $entityId,
        int $productId,
        int $quantity,
        ?\Carbon\Carbon $dlc = null,
        array $options = []
    ): StockMovement {
        return DB::transaction(function () use ($entityId, $productId, $quantity, $dlc, $options) {
            $movement = StockMovement::create([
                'entity_id'      => $entityId,
                'product_id'     => $productId,
                'type'           => 'ENTREE',
                'quantite'       => $quantity,
                'dlc'            => $dlc,
                'lot_number'     => $options['lot_number'] ?? null,
                'provenance'     => $options['provenance'] ?? 'reception',
                'reference'      => $options['reference'] ?? null,
                'notes'          => $options['notes'] ?? 'Entrée stock boulangerie',
                'created_by'     => Auth::id() ?? $options["created_by"],
                'movement_date'  => $options['movement_date'] ?? now()->toDateString(),
            ]);

            $key = [
                'entity_id'  => $entityId,
                'product_id' => $productId,
                'dlc'        => $dlc ? $dlc->toDateString() : null,
                'lot_number' => $options['lot_number'] ?? null,
            ];

            DB::table('stock_balances')->updateOrInsert(
                $key,
                [
                    'store_id'   => self::storeIdPourEntite($entityId),
                    'quantite'   => DB::raw('COALESCE(quantite, 0) + ' . $quantity),
                    'updated_at' => now(),
                ]
            );

            Log::info('ProductEntree créée', [
                'entity_id' => $entityId,
                'product_id' => $productId,
                'quantity' => $quantity,
                'dlc' => $dlc?->toDateString(),
                'lot_number' => $options['lot_number'] ?? null,
            ]);

            return $movement;
        });
    }

    /**
     * Consommer un produit fini selon FIFO (First-In-First-Out).
     * Utilisé lors d'une vente en boulangerie.
     *
     * @param int $entityId
     * @param int $productId
     * @param int $quantiteRequise
     * @param array $options ['reference' => string, 'created_by' => int, 'reference_type' => string, 'reference_id' => int, 'movement_date' => string]
     * @return array Liste des lots consommés avec détails
     * @throws \Exception si stock insuffisant
     */
    public static function consumeProductFIFO(
        int $entityId,
        int $productId,
        int $quantiteRequise,
        array $options = []
    ): array {
        if ($quantiteRequise <= 0) {
            return [];
        }

        Log::info('consumeProductFIFO start', [
            'entity_id' => $entityId,
            'product_id' => $productId,
            'quantite_requise' => $quantiteRequise,
        ]);

        return DB::transaction(function () use ($entityId, $productId, $quantiteRequise, $options) {
            $lots = DB::table('stock_balances')
                ->where('entity_id', $entityId)
                ->where('product_id', $productId)
                ->where('quantite', '>', 0)
                // Ne consommer que les lots non expirés (dlc NULL ou > aujourd'hui)
                ->where(function ($q) {
                    $q->whereNull('dlc')
                        ->orWhere('dlc', '>', now()->toDateString());
                })
                ->orderBy('dlc', 'asc')
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->get();

            Log::info('Lots disponibles pour consommation', [
                'entity_id' => $entityId,
                'product_id' => $productId,
                'nb_lots' => $lots->count(),
                'lots' => $lots->map(fn($l) => ['id' => $l->id, 'quantite' => $l->quantite, 'dlc' => $l->dlc, 'lot_number' => $l->lot_number])->toArray(),
            ]);

            $reste = $quantiteRequise;
            $consommes = [];

            foreach ($lots as $lot) {
                if ($reste <= 0.001) {
                    break;
                }

                $aPrelever = min($lot->quantite, $reste);

                StockMovement::create([
                    'entity_id'      => $entityId,
                    'product_id'     => $productId,
                    'type'           => 'SORTIE',
                    'quantite'       => -$aPrelever,
                    'dlc'            => $lot->dlc,
                    'lot_number'     => $lot->lot_number,
                    'reference'      => $options['reference'] ?? null,
                    'reference_type' => $options['reference_type'] ?? null,
                    'reference_id'   => $options['reference_id'] ?? null,
                    'created_by'     => $options['created_by'] ?? Auth::id(),
                    'movement_date'  => $options['movement_date'] ?? now()->toDateString(),
                ]);


                $newQuantity = $lot->quantite - $aPrelever;
                if ($newQuantity <= 0.0001) {
                    DB::table('stock_balances')
                        ->where('entity_id', $entityId)
                        ->where('product_id', $productId)
                        ->where('dlc', $lot->dlc)
                        ->where('lot_number', $lot->lot_number)
                        ->delete();
                } else {
                    DB::table('stock_balances')
                        ->where('entity_id', $entityId)
                        ->where('product_id', $productId)
                        ->where('dlc', $lot->dlc)
                        ->where('lot_number', $lot->lot_number)
                        ->update(['quantite' => $newQuantity, 'updated_at' => now()]);
                }
                Log::debug('Sortie stock produit (FIFO)', [
                    'product_id' => $productId,
                    'dlc' => $lot->dlc,
                    'lot_number' => $lot->lot_number,
                    'preleve' => $aPrelever,
                    'reste_apres' => $newQuantity,
                ]);

                $consommes[] = [
                    'lot_id'     => $lot->id ?? null,
                    'dlc'        => $lot->dlc,
                    'lot_number' => $lot->lot_number,
                    'quantite'   => $aPrelever,
                ];

                $reste -= $aPrelever;
            }

            if ($reste > 0.001) {
                throw new \Exception(
                    "Stock insuffisant pour le produit #{$productId}. Il manque " . round($reste) . " unités."
                );
            }

            return $consommes;
        });
    }

    /**
     * Obtenir le stock total disponible d'un produit fini (lots non expirés uniquement).
     */
    public static function getTotalProductStock(int $entityId, int $productId): float
    {
        return DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('product_id', $productId)
            ->where(function ($q) {
                $q->whereNull('dlc')
                    ->orWhere('dlc', '>', now()->toDateString());
            })
            ->sum('quantite');
    }

    /**
     * Obtenir les balances FIFO d'un produit (lots disponibles, non expirés).
     */
    public static function getProductBalancesFIFO(int $entityId, int $productId)
    {
        return DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('product_id', $productId)
            ->where('quantite', '>', 0)
            ->where(function ($q) {
                $q->whereNull('dlc')
                    ->orWhere('dlc', '>', now()->toDateString());
            })
            ->orderBy('dlc', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
    }
}