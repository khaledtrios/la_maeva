<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corrige la contrainte unique: permet plusieurs lignes de facture par expédition (une par produit)
     * mais garantit qu'une ligne d'expédition ne peut être facturée qu'une seule fois.
     */
    public function up(): void
    {
        Schema::table('facture_lignes', function (Blueprint $table) {
            // 1. Supprimer la clé étrangère qui dépend de l'index
            $table->dropForeign('facture_lignes_expedition_id_foreign');
            // 2. Supprimer l'ancien index unique sur expedition_id seul
            $table->dropUnique('facture_lignes_expedition_unique');
            // 3. Créer l'index unique composé (expedition_id, expedition_line_id)
            $table->unique(['expedition_id', 'expedition_line_id'], 'facture_lignes_expedition_line_unique');
            // 4. Recréer la clé étrangère (elle utilisera automatiquement l'index composé car il commence par expedition_id)
            $table->foreign('expedition_id')->references('id')->on('expeditions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->dropUnique('facture_lignes_expedition_line_unique');
            $table->unique('expedition_id', 'facture_lignes_expedition_unique');
        });
    }
};
