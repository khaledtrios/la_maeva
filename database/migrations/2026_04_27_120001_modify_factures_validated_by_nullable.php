<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Rendre validated_by et paid_by nullable pour correspondre à la migration originale
        DB::statement('ALTER TABLE factures MODIFY validated_by BIGINT UNSIGNED NULL;');
        DB::statement('ALTER TABLE factures MODIFY paid_by BIGINT UNSIGNED NULL;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revenir à NOT NULL (pour rollback)
        DB::statement('ALTER TABLE factures MODIFY validated_by BIGINT UNSIGNED NOT NULL;');
        DB::statement('ALTER TABLE factures MODIFY paid_by BIGINT UNSIGNED NOT NULL;');
    }
};
