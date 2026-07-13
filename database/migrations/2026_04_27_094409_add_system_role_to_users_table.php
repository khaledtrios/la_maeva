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
        // Ajouter 'SYSTEM' à l'enum des rôles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'DIRECTION', 'RESP_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_LABO', 'EMPLOYE_VENTE', 'SYSTEM')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Retirer 'SYSTEM' de l'enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'DIRECTION', 'RESP_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_LABO', 'EMPLOYE_VENTE')");
    }
};
