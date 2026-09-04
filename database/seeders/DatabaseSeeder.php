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
            // Structure : super admin, entités, stores, store admins, employés
            TestDataSeeder::class,

            // Catalogue + données métier CLOISONNÉS PAR STORE (Phase 2).
            // Remplace l'ancienne chaîne CategorySeeder / IngredientSeeder /
            // ProductSeeder / RecipeSeeder / IngredientThresholdSeeder /
            // ProductionSeeder / ExpeditionSeeder / ReceptionSeeder /
            // VenteJourSeeder / Haccp*Seeder : celle-ci produisait un catalogue
            // GLOBAL partagé et des flux traversant les stores (le labo #1
            // produisait ce que les stores #2 et #3 vendaient), incompatible
            // avec l'isolation multi-tenant. Les anciens seeders sont conservés
            // sur disque à titre de référence mais ne sont plus appelés.
            TenantIsolatedDemoSeeder::class,
        ]);
    }
}
