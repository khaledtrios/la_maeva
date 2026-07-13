<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajout de date_production à reception_lines pour traçabilité DLC.
     * Copié depuis expedition_lines.date_production.
     */
    public function up(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->date('date_production')
                ->nullable()
                ->after('dlc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->dropColumn(['date_production']);
        });
    }
};
