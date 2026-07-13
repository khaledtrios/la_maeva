<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');      // LABO émetteur
            $table->foreignId('boulangerie_id')->constrained('entities')->onDelete('cascade'); // BOULANGERIE destinataire
            $table->enum('periode_type', ['SEMAINE', 'MOIS', 'ANNEE', 'CUSTOM']);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->decimal('montant_total', 12, 2);
            $table->enum('statut', ['BROUILLON', 'EMISE', 'PAYEE', 'ANNULEE'])->default('BROUILLON');
            $table->boolean('generation_auto')->default(false);
            $table->foreignId('generated_by')->constrained('users')->nullable();
            $table->foreignId('validated_by')->constrained('users')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('paid_by')->constrained('users')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['entity_id', 'date_debut', 'date_fin']);
            $table->index(['boulangerie_id', 'statut']);

            // Empêcher double facturation sur même période
            $table->unique(['entity_id', 'boulangerie_id', 'periode_type', 'date_debut', 'date_fin'], 'factures_periode_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
