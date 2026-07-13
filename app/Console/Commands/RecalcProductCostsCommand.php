<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\Ingredient;
use Illuminate\Support\Facades\Log;

#[Signature('products:recalc-costs {--ingredient= : ID de l\'ingrédient pour recalculer seulement les produits l\'utilisant} {--all : Recalculer tous les produits}')]
#[Description('Recalcule les coûts de revient des produits (cout_revient = Σ recette.quantite × ingredient.prix_unitaire)')]
class RecalcProductCostsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔁 Recalcul des coûts de revient...');

        $productIds = collect();

        if ($this->option('ingredient')) {
            // Recalculer uniquement les produits utilisant cet ingrédient
            $ingredientId = (int) $this->option('ingredient');
            $ingredient = Ingredient::find($ingredientId);

            if (!$ingredient) {
                $this->error("❌ Ingrédient ID $ingredientId introuvable.");
                return 1;
            }

            $productIds = \App\Models\Recipe::where('ingredient_id', $ingredientId)
                ->distinct()
                ->pluck('product_id');

            $this->info("🎯 Recalcul des produits utilisant l'ingrédient: {$ingredient->nom} (ID: $ingredientId)");
        } else {
            // Recalculer tous les produits
            $productIds = Product::pluck('id');
            $this->info('📊 Recalcul de TOUS les produits');
        }

        $total = $productIds->count();
        if ($total === 0) {
            $this->warn('Aucun produit à recalculer.');
            return 0;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $recalculated = 0;
        $errors = 0;

        foreach ($productIds as $productId) {
            $product = Product::find($productId);
            if ($product) {
                try {
                    $oldCost = $product->cout_revient;
                    $product->recalculerCoutRevient();
                    $newCost = $product->cout_revient;

                    if (abs($oldCost - $newCost) > 0.001) {
                        $this->output->writeln("\n  ✅ {$product->nom}: {$oldCost}€ → {$newCost}€");
                    }

                    $recalculated++;
                } catch (\Exception $e) {
                    $this->output->writeln("\n  ❌ Erreur sur produit ID $productId: " . $e->getMessage());
                    $errors++;
                    Log::error('Erreur recalcul cout_revient', [
                        'product_id' => $productId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("✅ Recalcul terminé : $recalculated produits mis à jour");
        if ($errors > 0) {
            $this->warn("⚠️  $errors erreurs (voir logs)");
        }

        Log::info('Recalcul des coûts de revient exécuté', [
            'mode' => $this->option('ingredient') ? 'ingredient_id=' . $this->option('ingredient') : 'all',
            'total_products' => $total,
            'recalculated' => $recalculated,
            'errors' => $errors,
        ]);

        return 0;
    }
}
