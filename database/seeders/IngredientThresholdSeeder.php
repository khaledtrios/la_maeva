<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IngredientThresholdSeeder extends Seeder
{
    /**
     * Seed les seuils d'ingrédients par entité.
     *
     * Données basées sur le scénario initial du projet LE MAEVA:
     * Entity 1 (LABO) a des seuils définis pour tous les ingrédients.
     * Les boulangeries (2, 3, 4) n'ont pas de seuils d'ingrédients
     * car elles gèrent uniquement des produits finis (pas d'ingrédients bruts).
     */
    public function run(): void
    {
        // Entity 1 = LABO Cayenne - seuils pour 8 ingrédients
        $laboThresholds = [
            // [ingredient_id, seuil_minimum, stock_max]
            [1, 20.000, null],   // Farine T55 - seuil 20kg
            [2, 10.000, null],   // Beurre AOP - seuil 10kg (stock bas actuel)
            [3, 5.000, null],    // Sucre - seuil 5kg
            [4, 100.000, null],  // Oeufs - seuil 100 unités
            [5, null, null],     // Chocolat - pas de seuil
            [6, null, null],     // Lait - pas de seuil
            [7, 2.000, null],    // Levure - seuil 2kg
            [8, 1.000, null],    // Sel - seuil 1kg
        ];

        $now = now();

        foreach ($laboThresholds as [$ingredientId, $seuil, $stockMax]) {
            DB::table('ingredient_thresholds')->insert([
                'entity_id'     => 1,
                'ingredient_id' => $ingredientId,
                'seuil_minimum' => $seuil,
                'stock_max'     => $stockMax,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        // Option: créer des seuils pour les boulangeries si nécessaire
        // (actuellement pas utilisés car boulangeries ne gèrent pas d'ingrédients)
    }
}
