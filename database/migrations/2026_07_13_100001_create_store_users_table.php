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
        Schema::create('store_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            // Colonne string simple, typée côté PHP via l'enum StoreUserRole (une seule valeur STORE_ADMIN pour l'instant).
            $table->string('role')->default('STORE_ADMIN');
            $table->boolean('active')->default(true);
            $table->timestamp('email_verified_at')->nullable(); // réservé à une future vérification d'email
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_users');
    }
};
