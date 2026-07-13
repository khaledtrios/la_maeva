<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajoute la FK return_id pour tracer les mouvements de stock liés aux retours
     */
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('return_id')
                ->nullable()
                ->after('production_id')
                ->constrained('product_returns')
                ->onDelete('set null');
            $table->index('return_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['return_id']);
            $table->dropColumn('return_id');
        });
    }
};
