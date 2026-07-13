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
        Schema::create('return_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('product_returns')->onDelete('cascade');
            $table->foreignId('reception_line_id')->nullable()->constrained('reception_lines')->onDelete('set null');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantite_attendue')->comment('Qté attendue à la réception');
            $table->integer('quantite_retournee')->comment('Qté retournée');
            $table->date('dlc')->nullable()->comment('DLC du produit (copie)');
            $table->string('lot_reference', 100)->nullable()->comment('Réf lot/expédition');
            $table->enum('cause', ['DEFECTUEUX', 'INVENDU_EXPIRE'])->comment('Cause du retour par ligne');
            $table->text('notes')->nullable()->comment('Note par ligne (optionnel)');
            $table->timestamps();

            // Index pour performance
            $table->index('return_id');
            $table->index('reception_line_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_lines');
    }
};
