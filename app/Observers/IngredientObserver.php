<?php

namespace App\Observers;

use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

class IngredientObserver
{
    /**
     * Handle the Ingredient "updated" event.
     * Recalcule automatiquement le coût de revient de tous les produits
     * qui utilisent cet ingrédient dans leur recette.
     */
    public function updated(Ingredient $ingredient)
    {
        // Détecter si prix_unitaire a changé
        $original = $ingredient->getOriginal('prix_unitaire');
        $current  = $ingredient->prix_unitaire;

        // Si le prix n'a pas changé, on ne fait rien
        if ($original === $current) {
            return;
        }

        // Trouver tous les products_id qui utilisent cet ingrédient
        $productIds = \App\Models\Recipe::where('ingredient_id', $ingredient->id)
            ->distinct()
            ->pluck('product_id');

        if ($productIds->isEmpty()) {
            return;
        }

        Log::info('Recalcul cout_revient déclenché par changement prix ingrédient', [
            'ingredient_id' => $ingredient->id,
            'ingredient_nom' => $ingredient->nom,
            'ancien_prix' => $original,
            'nouveau_prix' => $current,
            'produits_concernes' => $productIds->count(),
        ]);

        // Recalculer chaque produit
        $productIds->each(function ($productId) {
            $product = Product::find($productId);
            if ($product) {
                $product->recalculerCoutRevient();
                Log::debug('cout_revient recalculé', [
                    'product_id' => $product->id,
                    'product_nom' => $product->nom,
                    'nouveau_cout' => $product->cout_revient,
                ]);
            }
        });
    }

    /**
     * Handle the Ingredient "created" event.
     * Aucune action nécessaire — pas de recettes existantes.
     */
    public function created(Ingredient $ingredient)
    {
        // No-op: un nouvel ingrédient n'a pas encore de recettes
    }

    /**
     * Handle the Ingredient "deleted" event.
     * Désactive les recettes concernées (optionnel : mettre produit en alerte)
     */
    public function deleted(Ingredient $ingredient)
    {
        // Optionnel : logger que l'ingrédient supprimé pourrait invalider des recettes
        Log::warning('Ingrédient supprimé — recettes associées à vérifier', [
            'ingredient_id' => $ingredient->id,
            'ingredient_nom' => $ingredient->nom,
        ]);
    }
}
