<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute une contrainte unique sur expedition_line_id pour garantir la relation 1:1
     */
    public function up(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            // Supprimer d'abord l'index standard (s'il existe) pour éviter les conflits
            // Le nom par défaut généré par Laravel pour l'index sur expedition_line_id est:
            // reception_lines_expedition_line_id_index
            $indexName = 'reception_lines_expedition_line_id_index';
            // Utiliser DB::statement pour être sûr (compatibilité multi-SGBD)
            try {
                DB::statement("DROP INDEX IF EXISTS `{$indexName}` ON `reception_lines`");
            } catch (\Exception $e) {
                // Ignorer si l'index n'existe pas
            }
            // Créer l'index unique
            $table->unique('expedition_line_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->dropUnique(['expedition_line_id']);
            // Restaurer l'index standard (non unique) si besoin
            $table->index('expedition_line_id');
        });
    }
};
