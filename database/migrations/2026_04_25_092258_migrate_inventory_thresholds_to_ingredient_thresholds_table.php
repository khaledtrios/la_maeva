<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Copier les seuils depuis inventory_items vers ingredient_thresholds
        DB::table('ingredient_thresholds')->insertUsing(
            ['entity_id', 'ingredient_id', 'seuil_minimum', 'stock_max', 'created_at', 'updated_at'],
            DB::table('inventory_items')
                ->select(
                    'entity_id',
                    'ingredient_id',
                    'seuil_minimum',
                    'stock_max',
                    DB::raw('NOW() as created_at'),
                    DB::raw('NOW() as updated_at')
                )
        );

        // Supprimer les doublons potentiels (au cas où, bien que PK devrait les empêcher)
        // La PK (entity_id, ingredient_id) gère déjà l'unicité
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer toutes les données migrées (ne pas toucher aux éventuelles données ultérieures)
        // En rollback, on vide la table (prudent car c'est une table de configuration)
        DB::table('ingredient_thresholds')->truncate();
    }
};
