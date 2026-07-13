<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->string('description')->nullable();
            // pas de timestamps dans ce modèle
        });

        // Seed initial
        DB::table('facture_settings')->insert([
            'key' => 'auto_generation_enabled',
            'value' => 'false',
            'description' => 'Active/désactive la génération automatique des factures périodiques',
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_settings');
    }
};
