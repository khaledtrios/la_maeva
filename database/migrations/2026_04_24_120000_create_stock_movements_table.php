<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table des mouvements de stock (immutable) :
     * - ENTRÉE : réception d'un lot
     * - SORTIE : consommation (production, vente, ajustement)
     * - AJUSTEMENT : correction manuelle
     */
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade');
            $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->onDelete('cascade');
            $table->enum('type', ['ENTREE', 'SORTIE', 'AJUSTEMENT', 'WASTE']);
            $table->decimal('quantite', 10, 3); // + pour entrée, - pour sortie
            $table->date('dlc')->nullable(); // Date Limite de Consommation du lot
            $table->string('lot_number', 100)->nullable(); // N° lot / fournisseur / BL
            $table->string('provenance', 255)->nullable(); // Fournisseur / origine
            $table->string('reference', 255)->nullable(); // Référence document (BL, commande)
            $table->text('notes')->nullable();
            $table->dateTime('movement_date')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('production_id')->nullable()->constrained('productions')->onDelete('set null'); // Traçabilité FIFO
            $table->timestamps();

            // Index pour requêtes FIFO et filtres
            $table->index(['entity_id', 'ingredient_id', 'dlc']);
            $table->index(['entity_id', 'dlc']);
            $table->index(['production_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};