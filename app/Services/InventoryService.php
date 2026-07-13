<?php

namespace App\Services;

use App\Models\Production;
use App\Models\Recipe;
use App\Services\StockMovementService;
use Illuminate\Support\Facades\DB;
use App\Models\Ingredient;

class InventoryService
{
    /**
     * Déduire le stock pour une production (méthode FIFO avec DLC)
     * DÉPRÉCIÉ : utiliser StockMovementService::consumeIngredientFIFO()
     * Conservé pour rétrocompatibilité temporaire.
     */
    public static function deductForProduction(Production $production): void
    {
        $recipes = Recipe::where('product_id', $production->product_id)->with('ingredient')->get();

        foreach ($recipes as $recipe) {
            $consommation = $recipe->quantite * $production->quantite;

            // Utiliser FIFO si disponible
            try {
                StockMovementService::consumeIngredientFIFO(
                    $production->entity_id,
                    $recipe->ingredient_id,
                    $consommation,
                    ['reference' => 'PROD #' . $production->id]
                );
            } catch (\Exception $e) {
                // Si FIFO échoue (stock insuffisant), on log l'erreur mais ne bloque pas la production
                logger()->error('Erreur FIFO', [
                    'production_id' => $production->id,
                    'ingredient_id' => $recipe->ingredient_id,
                    'consommation' => $consommation,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Récupérer les alertes de stock bas pour une entité
     * Migration: lit depuis stock_balances + ingredient_thresholds
     */
    public static function getAlerts(int $entityId)
    {
        // Récupérer tous les seuils minimum pour cette entité
        $thresholds = DB::table('ingredient_thresholds')
            ->where('entity_id', $entityId)
            ->whereNotNull('seuil_minimum')
            ->pluck('seuil_minimum', 'ingredient_id');

        if ($thresholds->isEmpty()) {
            return collect();
        }

        // Récupérer les stocks totaux depuis stock_balances pour les ingrédients ayant un seuil
        $stocks = DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('ingredient_id', '!=', null)
            ->whereIn('ingredient_id', $thresholds->keys()->toArray())
            ->join('ingredients', 'ingredients.id', '=', 'stock_balances.ingredient_id')
            ->select(
                'ingredients.id as ingredient_id',
                'ingredients.nom',
                DB::raw('SUM(stock_balances.quantite) as quantite')
            )
            ->groupBy('ingredients.id', 'ingredients.nom')
            ->get();

        // Filtrer par seuil minimum
        $alerts = [];
        foreach ($stocks as $stock) {
            $seuil = $thresholds[$stock->ingredient_id] ?? null;
            if ($seuil !== null && (float) $stock->quantite < (float) $seuil) {
                $ingredient = Ingredient::find($stock->ingredient_id);
                $alerts[] = [
                    'id' => $stock->ingredient_id,
                    'ingredient' => $ingredient,
                    'quantite' => (float) $stock->quantite,
                    'seuil_minimum' => (float) $seuil,
                    'deficit' => (float) $seuil - (float) $stock->quantite,
                ];
            }
        }

        return collect($alerts);
    }

    /**
     * Récupérer les alertes de stock trop élevé pour une entité
     * (quantite > stock_max, quand stock_max est défini)
     * Migration: lit depuis stock_balances + ingredient_thresholds
     */
    public static function getHighStockAlerts(int $entityId)
    {
        // Récupérer tous les seuils max
        $stockMaxes = DB::table('ingredient_thresholds')
            ->where('entity_id', $entityId)
            ->whereNotNull('stock_max')
            ->pluck('stock_max', 'ingredient_id');

        if ($stockMaxes->isEmpty()) {
            return collect();
        }

        // Récupérer les stocks totaux depuis stock_balances
        $stocks = DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('ingredient_id', '!=', null)
            ->whereIn('ingredient_id', $stockMaxes->keys()->toArray())
            ->join('ingredients', 'ingredients.id', '=', 'stock_balances.ingredient_id')
            ->select(
                'ingredients.id as ingredient_id',
                'ingredients.nom',
                DB::raw('SUM(stock_balances.quantite) as quantite')
            )
            ->groupBy('ingredients.id', 'ingredients.nom')
            ->get();

        // Filtrer par seuil maximum
        $alerts = [];
        foreach ($stocks as $stock) {
            $stockMax = $stockMaxes[$stock->ingredient_id] ?? null;
            if ($stockMax !== null && (float) $stock->quantite > (float) $stockMax) {
                $ingredient = Ingredient::find($stock->ingredient_id);
                $alerts[] = [
                    'id' => $stock->ingredient_id,
                    'ingredient' => $ingredient,
                    'quantite' => (float) $stock->quantite,
                    'stock_max' => (float) $stockMax,
                    'exces' => (float) $stock->quantite - (float) $stockMax,
                ];
            }
        }

        return collect($alerts);
    }
}
