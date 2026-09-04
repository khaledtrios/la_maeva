<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Nettoie les Admin PIN existants et les convertit en EMAIL_PASSWORD
     */
    public function up(): void
    {
        // Tous les utilisateurs avec role='ADMIN' doivent avoir auth_type='EMAIL_PASSWORD'
        DB::table('users')
            ->where('role', 'ADMIN')
            ->update(['auth_type' => 'EMAIL_PASSWORD']);

        // Supprimer les utilisateurs SYSTEM (rôle invalide)
        DB::table('users')
            ->where('role', 'SYSTEM')
            ->delete();
    }

    /**
     * Revert the migrations.
     */
    public function down(): void
    {
        // Pas de rollback nécessaire
    }
};
