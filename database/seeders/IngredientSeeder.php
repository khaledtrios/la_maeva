<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    /**
     * Seed 8 ingrédients
     */
    public function run(): void
    {
        Ingredient::create([
            'id' => 1,
            'nom' => 'Farine T55',
            'unite' => 'kg',
            'prix_unitaire' => 0.80,
        ]);

        Ingredient::create([
            'id' => 2,
            'nom' => 'Beurre AOP',
            'unite' => 'kg',
            'prix_unitaire' => 8.50,
        ]);

        Ingredient::create([
            'id' => 3,
            'nom' => 'Sucre',
            'unite' => 'kg',
            'prix_unitaire' => 1.20,
        ]);

        Ingredient::create([
            'id' => 4,
            'nom' => 'Oeufs',
            'unite' => 'unité',
            'prix_unitaire' => 0.25,
        ]);

        Ingredient::create([
            'id' => 5,
            'nom' => 'Chocolat noir 70%',
            'unite' => 'kg',
            'prix_unitaire' => 12.00,
        ]);

        Ingredient::create([
            'id' => 6,
            'nom' => 'Lait entier',
            'unite' => 'L',
            'prix_unitaire' => 0.95,
        ]);

        Ingredient::create([
            'id' => 7,
            'nom' => 'Levure boulangère',
            'unite' => 'kg',
            'prix_unitaire' => 4.50,
        ]);

        Ingredient::create([
            'id' => 8,
            'nom' => 'Sel fin',
            'unite' => 'kg',
            'prix_unitaire' => 0.60,
        ]);
    }
}
