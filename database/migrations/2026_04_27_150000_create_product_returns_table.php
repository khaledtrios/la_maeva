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
        Schema::create('product_returns', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique()->comment('Référence unique: RET-2026-0001');
            $table->foreignId('reception_id')->nullable()->constrained('receptions')->onDelete('set null');
            $table->foreignId('expedition_line_id')->constrained('expedition_lines')->onDelete('cascade');
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade')->comment('Boutique créatrice');
            $table->foreignId('labo_entity_id')->constrained('entities')->onDelete('cascade')->comment('Labo destinataire');
            $table->enum('cause', ['DEFECTUEUX', 'INVENDU_EXPIRE'])->comment('Cause du retour');
            $table->string('bl_number', 50)->nullable()->comment('N° BL d\'origine (copie)');
            $table->string('bl_fifo', 50)->nullable()->comment('N° BL FIFO si applicable');
            $table->date('dlc_display')->nullable()->comment('DLC du produit (copie historique)');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantite_attendue')->comment('Qté attendue à la réception');
            $table->integer('quantite_retournee')->comment('Qté retournée (≤ attendue)');
            $table->text('notes')->nullable()->comment('Notes boutique (optionnel)');
            $table->enum('status', [
                'BROUILLON',
                'ENVOYEE',
                'RECEUE_PAR_LABO',
                'TRAITEE',
                'CLOTUREE',
                'REJETEE'
            ])->default('BROUILLON');
            $table->boolean('labo_confirmed')->default(false);
            $table->dateTime('confirmed_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users');
            $table->string('treatment_action', 50)->nullable()->comment('brule, jete, recyclage, retour_stock, autre');
            $table->text('treatment_notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->dateTime('processed_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Index pour performance
            $table->index('status');
            $table->index('entity_id');
            $table->index('labo_entity_id');
            $table->index('reception_id');
            $table->index('expedition_line_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_returns');
    }
};
