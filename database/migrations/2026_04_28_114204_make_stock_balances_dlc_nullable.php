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
        Schema::table('stock_balances', function (Blueprint $table) {
            // Rendre dlc nullable (la migration originale avait nullable() mais la DB peut
            // avoir été créée avec NOT NULL implicitement — d'où ce changement explicite)
            $table->date('dlc')->nullable()->change();
            $table->string('lot_number', 100)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {
            // Rétablir NOT NULL si nécessaire (mais normalement non)
            $table->date('dlc')->nullable(false)->change();
            $table->string('lot_number', 100)->nullable(false)->change();
        });
    }
};
