<?php

namespace Database\Seeders;

use App\Models\Recipe;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    /**
     * Seed les 4 recettes
     */
    public function run(): void
    {
        // Croissant (product_id:1) : Farine T55 0.100kg + Beurre AOP 0.050kg
        Recipe::create([
            'product_id' => 1,
            'ingredient_id' => 1,
            'quantite' => 0.100,
        ]);
        Recipe::create([
            'product_id' => 1,
            'ingredient_id' => 2,
            'quantite' => 0.050,
        ]);

        // Pain au chocolat (product_id:2) : Farine 0.100kg + Beurre 0.040kg + Chocolat 0.025kg
        Recipe::create([
            'product_id' => 2,
            'ingredient_id' => 1,
            'quantite' => 0.100,
        ]);
        Recipe::create([
            'product_id' => 2,
            'ingredient_id' => 2,
            'quantite' => 0.040,
        ]);
        Recipe::create([
            'product_id' => 2,
            'ingredient_id' => 5,
            'quantite' => 0.025,
        ]);

        // Chausson (product_id:3) : Farine 0.090kg + Beurre 0.035kg + Sucre 0.020kg
        Recipe::create([
            'product_id' => 3,
            'ingredient_id' => 1,
            'quantite' => 0.090,
        ]);
        Recipe::create([
            'product_id' => 3,
            'ingredient_id' => 2,
            'quantite' => 0.035,
        ]);
        Recipe::create([
            'product_id' => 3,
            'ingredient_id' => 3,
            'quantite' => 0.020,
        ]);

        // Baguette (product_id:4) : Farine 0.250kg + Levure 0.003kg + Sel 0.005kg
        Recipe::create([
            'product_id' => 4,
            'ingredient_id' => 1,
            'quantite' => 0.250,
        ]);
        Recipe::create([
            'product_id' => 4,
            'ingredient_id' => 7,
            'quantite' => 0.003,
        ]);
        Recipe::create([
            'product_id' => 4,
            'ingredient_id' => 8,
            'quantite' => 0.005,
        ]);
    }
}
