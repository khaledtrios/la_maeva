<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajout de production_id à stock_balances pour traçabilité complète:
     * - production_id: lien vers la production source (quelle production a créé ce stock)
     * - Permet de retracer exactement quel lot a servi à quelle vente
     */
    public function up(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {
            $table->foreignId('production_id')
                ->nullable()
                ->constrained('productions')
                ->onDelete('set null')
                ->after('lot_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {
            $table->dropForeign(['production_id']);
            $table->dropColumn('production_id');
        });
    }
};
