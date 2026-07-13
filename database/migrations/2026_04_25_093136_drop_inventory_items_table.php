<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Suppression de la table inventory_items devenue obsolète.
     * Les seuils sont désormais stockés dans ingredient_thresholds.
     * Les quantités de stock proviennent de stock_balances.
     */
    public function up(): void
    {
        Schema::dropIfExists('inventory_items');
    }

    /**
     * Reverse the migrations.
     *
     * Recréation de la table inventory_items si rollback (pour rétrocompatibilité legacy).
     * Note: les données ne seront pas restaurées automatiquement.
     */
    public function down(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->decimal('quantite', 10, 3)->default(0);
            $table->decimal('seuil_minimum', 10, 3)->nullable();
            $table->decimal('stock_max', 10, 3)->nullable();
            $table->timestamps();

            $table->unique(['entity_id', 'ingredient_id']);
        });
    }
};
