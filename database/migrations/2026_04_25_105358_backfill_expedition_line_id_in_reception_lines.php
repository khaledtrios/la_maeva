<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Backfill expedition_line_id pour les réceptions existantes
     * en matchant sur product_id (même produit dans l'expédition)
     */
    public function up(): void
    {
        // Récupérer toutes les reception_lines sans expedition_line_id
        $receptionLines = DB::table('reception_lines')
            ->whereNull('expedition_line_id')
            ->get();

        foreach ($receptionLines as $rl) {
            // Trouver la réception
            $reception = DB::table('receptions')->where('id', $rl->reception_id)->first();
            if (!$reception) continue;

            // Trouver la ligne d'expédition correspondante (même expedition_id et product_id)
            $expeditionLine = DB::table('expedition_lines')
                ->where('expedition_id', $reception->expedition_id)
                ->where('product_id', $rl->product_id)
                ->first();

            if ($expeditionLine) {
                DB::table('reception_lines')
                    ->where('id', $rl->id)
                    ->update(['expedition_line_id' => $expeditionLine->id]);
            }
        }
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
