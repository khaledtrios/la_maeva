<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table de balances de stock par lot (matérialisée pour performance).
     * Synchronisée avec stock_movements via logique applicative
     * ou triggers SQL.
     */
    public function up(): void
    {
        Schema::create('stock_balances', function (Blueprint $table) {

            $table->id();

            // Entité
            $table->foreignId('entity_id')
                ->constrained('entities')
                ->cascadeOnDelete();

            // Ingrédient (nullable pour produits finis)
            $table->foreignId('ingredient_id')
                ->nullable()
                ->constrained('ingredients')
                ->nullOnDelete();

            // Produit fini (nullable pour ingrédients)
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            // Informations lot
            $table->date('dlc')->nullable();
            $table->string('lot_number', 100)->nullable();

            // Quantité stockée
            $table->decimal('quantite', 10, 3)->default(0);

            $table->timestamp('updated_at')->nullable();

            /**
             * Index FIFO / recherche rapide
             */
            $table->index([
                'entity_id',
                'ingredient_id',
                'dlc'
            ], 'stock_balances_fifo_index');

            $table->index([
                'entity_id',
                'product_id',
                'dlc'
            ], 'stock_balances_product_fifo_index');

            /**
             * Unicité métier
             */
            $table->unique([
                'entity_id',
                'ingredient_id',
                'product_id',
                'dlc',
                'lot_number'
            ], 'stock_balances_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_balances');
    }
};