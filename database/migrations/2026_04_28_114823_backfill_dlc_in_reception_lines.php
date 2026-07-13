<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Backfill DLC et date_production à partir des données d'expédition
        // Pour chaque reception_line sans dlc, on prend:
        //   date_production = production.date
        //   dlc = production.date + COALESCE(product.dlc, 7) jours
        DB::statement("
            UPDATE reception_lines rl
            JOIN expedition_lines el ON rl.expedition_line_id = el.id
            JOIN productions p ON el.production_id = p.id
            JOIN products pr ON p.product_id = pr.id
            SET
                rl.date_production = p.date,
                rl.dlc = DATE_ADD(p.date, INTERVAL COALESCE(pr.dlc, 7) DAY)
            WHERE (rl.dlc IS NULL OR rl.date_production IS NULL)
        ");

        // Pour les lignes sans production liée (production_id NULL), utiliser des valeurs par défaut
        DB::statement("
            UPDATE reception_lines rl
            LEFT JOIN expedition_lines el ON rl.expedition_line_id = el.id
            LEFT JOIN productions p ON el.production_id = p.id
            SET
                rl.date_production = CURDATE(),
                rl.dlc = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            WHERE p.id IS NULL AND rl.dlc IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            //
        });
    }
};
