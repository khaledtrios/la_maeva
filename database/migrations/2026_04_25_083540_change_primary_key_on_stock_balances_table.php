<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Rien à faire :
        // la table create_stock_balances_table
        // contient déjà la colonne id et les indexes.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};