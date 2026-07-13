<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * conforme = calculé côté serveur (HaccpService)
     */
    public function up(): void
    {
        Schema::create('haccp_controles_reception', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->string('fournisseur');
            $table->string('bl_number')->nullable();
            $table->enum('categorie', ['AMBIANT', 'FRAIS', 'SURGELE']);
            $table->decimal('temperature', 5, 1)->nullable();
            $table->boolean('conforme');
            $table->text('commentaire')->nullable();
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('haccp_controles_reception');
    }
};
