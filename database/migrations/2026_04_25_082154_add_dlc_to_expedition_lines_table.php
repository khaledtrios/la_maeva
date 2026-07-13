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
        Schema::table('expedition_lines', function (Blueprint $table) {
            $table->date('dlc')->nullable()->after('quantite');
            $table->string('lot_reference')->nullable()->after('dlc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expedition_lines', function (Blueprint $table) {
            $table->dropColumn(['dlc', 'lot_reference']);
        });
    }
};
