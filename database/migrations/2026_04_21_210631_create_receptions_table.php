<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * entity_id = BOULANGERIE qui reçoit
     */
    public function up(): void
    {
        Schema::create('receptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expedition_id')->constrained('expeditions')->onDelete('cascade');
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade'); // BOULANGERIE qui reçoit
            $table->date('date');
            $table->enum('statut', ['EN_ATTENTE', 'CONFIRMEE'])->default('EN_ATTENTE');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receptions');
    }
};
