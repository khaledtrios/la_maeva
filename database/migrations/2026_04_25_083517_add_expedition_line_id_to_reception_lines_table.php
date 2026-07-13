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
        Schema::table('reception_lines', function (Blueprint $table) {
            // Ajout de la FK vers expedition_lines pour traçabilité
            $table->foreignId('expedition_line_id')
                  ->nullable()
                  ->constrained('expedition_lines')
                  ->onDelete('cascade');
            // Index pour optimisation des requêtes par ligne d'expédition
            $table->index('expedition_line_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->dropForeign(['expedition_line_id']);
            $table->dropIndex(['expedition_line_id']);
            $table->dropColumn('expedition_line_id');
        });
    }
};
