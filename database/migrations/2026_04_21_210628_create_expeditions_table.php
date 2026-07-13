<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * entity_id = LABO source, boulangerie_id = BOULANGERIE destination
     */
    public function up(): void
    {
        Schema::create('expeditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade'); // LABO source
            $table->foreignId('boulangerie_id')->constrained('entities')->onDelete('cascade'); // BOULANGERIE dest.
            $table->date('date');
            $table->enum('statut', ['BROUILLON', 'ENVOYEE', 'RECUE'])->default('BROUILLON');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expeditions');
    }
};
