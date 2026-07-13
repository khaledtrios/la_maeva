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
        Schema::table('stock_balances', function (Blueprint $table) {

            $table->foreignId('expedition_line_id')
                ->nullable()
                ->constrained('expedition_lines')
                ->nullOnDelete()
                ->after('production_id');
        });
    }

    public function down(): void
    {
        Schema::table('stock_balances', function (Blueprint $table) {

            $table->dropForeign(['expedition_line_id']);
            $table->dropColumn('expedition_line_id');
        });
    }
};