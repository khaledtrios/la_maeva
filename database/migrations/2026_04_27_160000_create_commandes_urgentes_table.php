<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commandes_urgentes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained('entities')->onDelete('cascade'); // boutique qui commande
            $table->date('date');
            $table->enum('statut', ['ENVOYEE', 'PRISE_EN_CHARGE', 'EN_PREPARATION', 'EXPEDIEE'])->default('ENVOYEE');
            $table->integer('priorite')->default(1);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes_urgentes');
    }
};
