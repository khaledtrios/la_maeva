<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * qte_vendue = calculé côté serveur uniquement
     */
    public function up(): void
    {
        Schema::create('ventes_jour', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->date('date');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('qte_recue');
            $table->integer('qte_reste');
            $table->integer('qte_vendue'); // calculé côté serveur uniquement
            $table->timestamps();
            $table->unique(['entity_id', 'date', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventes_jour');
    }
};
