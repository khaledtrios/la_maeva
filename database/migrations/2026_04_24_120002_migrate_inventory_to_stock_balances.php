<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Migre les données existantes de inventory_items vers stock_balances.
     * Chaque inventory_item devient un lot "INITIAL" avec DLC NULL.
     * Crée également les mouvements d'entrée correspondants.
     *
     * Cette migration doit être exécutée APRÈS la création des tables
     * stock_movements et stock_balances.
     */
    public function up(): void
    {
        // Vérifier que les tables existent
        if (!Schema::hasTable('stock_movements') || !Schema::hasTable('stock_balances')) {
            $this->command->error('Les tables stock_movements et stock_balances doivent être créées avant cette migration.');
            return;
        }

        DB::transaction(function () {
            // Récupérer tous les inventory_items actifs
            $items = DB::table('inventory_items')->get();

            foreach ($items as $item) {
                $lotNumber = 'INIT-MIGRATION-' . $item->entity_id . '-' . $item->ingredient_id;

                // 1. Créer la balance
                DB::table('stock_balances')->insertOrIgnore([
                    'entity_id'     => $item->entity_id,
                    'ingredient_id' => $item->ingredient_id,
                    'dlc'           => null,
                    'lot_number'    => $lotNumber,
                    'quantite'      => $item->quantite,
                    'updated_at'    => now(),
                ]);

                // 2. Créer le mouvement d'entrée correspondant
                DB::table('stock_movements')->insert([
                    'entity_id'     => $item->entity_id,
                    'ingredient_id' => $item->ingredient_id,
                    'type'          => 'ENTREE',
                    'quantite'      => $item->quantite,
                    'dlc'           => null,
                    'lot_number'    => $lotNumber,
                    'reference'     => 'Migration inventory_items -> stock_balances',
                    'created_by'    => 1, // Admin user par défaut
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * Supprime les données migrées (mouvements et balances) mais
     * conserve la table inventory_items originale.
     */
    public function down(): void
    {
        DB::transaction(function () {
            // Supprimer les balances créées par cette migration
            DB::table('stock_balances')
                ->where('lot_number', 'like', 'INIT-MIGRATION-%')
                ->delete();

            // Supprimer les mouvements créés par cette migration
            DB::table('stock_movements')
                ->where('reference', 'Migration inventory_items -> stock_balances')
                ->delete();
        });
    }
};
