<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajout du seuil maximum de stock (stock_max) pour éviter les sur-stockages.
     * Complémentaire de seuil_minimum : alerte si quantite > stock_max (quand stock_max est défini).
     */
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->decimal('stock_max', 10, 3)->nullable()->after('seuil_minimum');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('stock_max');
        });
    }
};
