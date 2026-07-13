<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            EntitySeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            IngredientSeeder::class,
            ProductSeeder::class,
            RecipeSeeder::class,
            IngredientThresholdSeeder::class,
            ProductionSeeder::class,
            ExpeditionSeeder::class,
            ReceptionSeeder::class,
            VenteJourSeeder::class,
            HaccpTemperatureSeeder::class,
            HaccpNettoyageSeeder::class,
            HaccpControleReceptionSeeder::class,
            HaccpNonConformiteSeeder::class,
        ]);
    }
}
