<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajoute l'index unique pour les produits finis si celui-ci n'existe pas déjà.
     */
    public function up(): void
    {
        // Vérifier si l'index existe déjà (cas d'un redéploiement ou migration déjà partiellement appliquée)
        $exists = DB::selectOne("
            SELECT COUNT(*) as cnt
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'stock_balances'
              AND index_name = 'stock_balances_product_unique'
        ");

        if ($exists && $exists->cnt > 0) {
            // L'index existe déjà, rien à faire
            return;
        }

        Schema::table('stock_balances', function (Blueprint $table) {
            $table->unique(
                ['entity_id', 'product_id', 'dlc', 'lot_number'],
                'stock_balances_product_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {
            try {
                $table->dropUnique('stock_balances_product_unique');
            } catch (\Throwable $e) {
                // L'index peut ne pas exister
            }
        });
    }
};
