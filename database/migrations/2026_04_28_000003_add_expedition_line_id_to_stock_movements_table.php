<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajout de expedition_line_id à stock_movements pour traçabilité complète:
     * - Pour les entrées de produits: lien vers la ligne d'expédition d'origine
     * - Permet de remonter à l'expédition et donc à la commande urgente
     */
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('expedition_line_id')
                ->nullable()
                ->constrained('expedition_lines')
                ->onDelete('set null')
                ->after('production_id');
            $table->index(['expedition_line_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['expedition_line_id']);
            $table->dropIndex(['expedition_line_id']);
            $table->dropColumn('expedition_line_id');
        });
    }
};
