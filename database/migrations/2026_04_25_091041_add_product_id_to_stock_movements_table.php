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
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('cascade')->after('ingredient_id');
            $table->index(['entity_id', 'product_id', 'dlc']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropIndex(['entity_id', 'product_id', 'dlc']);
            $table->dropColumn('product_id');
        });
    }
};
