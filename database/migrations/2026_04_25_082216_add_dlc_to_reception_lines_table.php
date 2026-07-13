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
            $table->date('dlc')->nullable()->after('qte_recue');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->dropColumn('dlc');
        });
    }
};
