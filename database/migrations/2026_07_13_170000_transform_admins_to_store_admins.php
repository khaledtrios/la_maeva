<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Transforme les Admin/boutique existants en Store Admin.
     * Ajoute : store_id, email, password, auth_type
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // store_id : pour lier l'Admin à son Store
            $table->foreignId('store_id')->nullable()->constrained('stores')->nullOnDelete();

            // email : pour l'authentification email/password du Store Admin
            $table->string('email')->nullable()->unique();

            // password : pour l'authentification email/password du Store Admin
            $table->string('password')->nullable();

            // auth_type : PIN (défaut) ou EMAIL_PASSWORD
            $table->enum('auth_type', ['PIN', 'EMAIL_PASSWORD'])->default('PIN');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Store::class);
            $table->dropColumn(['store_id', 'email', 'password', 'auth_type']);
        });
    }
};
