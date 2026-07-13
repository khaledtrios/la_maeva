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
        Schema::create('ingredient_thresholds', function (Blueprint $table) {
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->decimal('seuil_minimum', 10, 3)->nullable();
            $table->decimal('stock_max', 10, 3)->nullable();
            $table->timestamps();

            $table->primary(['entity_id', 'ingredient_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredient_thresholds');
    }
};
