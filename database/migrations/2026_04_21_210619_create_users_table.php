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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->string('nom');
            $table->string('pin'); // hash('sha256', '1234')
            $table->enum('role', ['ADMIN', 'DIRECTION', 'RESP_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_LABO', 'EMPLOYE_VENTE']);
            $table->boolean('active')->default(true);
            // pas de timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
