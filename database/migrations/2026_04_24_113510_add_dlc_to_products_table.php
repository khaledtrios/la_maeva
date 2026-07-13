<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajout du champ DLC (Durée de Limite de Consommation) en jours.
     * Ce nombre de jours est ajouté à la date de production pour obtenir
     * la date limite de consommation du lot.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('dlc')->nullable()->after('cout_revient');
            // dlc = nombre de jours après production où le produit est consommable
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('dlc');
        });
    }
};
