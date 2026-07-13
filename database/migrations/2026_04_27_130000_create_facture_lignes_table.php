<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->onDelete('cascade');
            $table->foreignId('expedition_id')->constrained('expeditions')->onDelete('cascade');
            $table->foreignId('expedition_line_id')->constrained('expedition_lines')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantite');
            $table->decimal('prix_unitaire', 10, 2);
            $table->decimal('montant', 10, 2);
            $table->date('dlc')->nullable();
            $table->string('lot_reference')->nullable();
            $table->timestamps();

            // Une expédition ne peut être facturée qu'une fois
            $table->unique('expedition_id', 'facture_lignes_expedition_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
    }
};
