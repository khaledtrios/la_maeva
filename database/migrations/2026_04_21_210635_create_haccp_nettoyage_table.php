<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * taches_json = [{"nom": "Sol labo", "fait": false}, ...]
     */
    public function up(): void
    {
        Schema::create('haccp_nettoyage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->date('date');
            $table->json('taches_json'); // [{"nom": "Sol labo", "fait": false}, ...]
            $table->enum('statut', ['EN_COURS', 'VALIDE'])->default('EN_COURS');
            $table->foreignId('valide_par')->nullable()->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('haccp_nettoyage');
    }
};
