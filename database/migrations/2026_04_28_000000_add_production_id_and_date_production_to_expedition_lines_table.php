<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajout des champs pour la traçabilité DLC:
     * - production_id: lien vers la production source (lot)
     * - date_production: date de fabrication du lot (copiée depuis productions.date)
     */
    public function up(): void
    {
        Schema::table('expedition_lines', function (Blueprint $table) {
            $table->foreignId('production_id')
                ->nullable()
                ->constrained('productions')
                ->onDelete('set null')
                ->after('quantite');
            $table->date('date_production')
                ->nullable()
                ->after('production_id');
            $table->index(['production_id', 'date_production']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expedition_lines', function (Blueprint $table) {
            $table->dropForeign(['production_id']);
            $table->dropIndex(['production_id', 'date_production']);
            $table->dropColumn(['production_id', 'date_production']);
        });
    }
};
