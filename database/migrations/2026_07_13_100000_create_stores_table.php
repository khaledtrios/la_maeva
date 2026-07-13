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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('siret')->nullable();
            // Colonne string simple (pas d'enum DB) pour pouvoir ajouter de nouveaux statuts sans migration.
            // Le typage est assuré côté PHP par l'enum StoreStatus (cast sur le modèle).
            $table->string('status')->default('PENDING');
            $table->text('status_reason')->nullable();
            $table->foreignId('status_changed_by')->nullable()->constrained('super_admins')->nullOnDelete();
            $table->timestamp('status_changed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
