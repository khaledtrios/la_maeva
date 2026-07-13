<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajoute la colonne created_at à stock_balances pour permettre
     * le tri FIFO avec dlc ASC, created_at ASC (si même DLC, le plus ancien d'abord).
     */
    public function up(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable()->after('quantite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};
