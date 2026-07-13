<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Étape 1 — Retours
 * Ajoute les champs `type` et `origine` à la table product_returns.
 *
 * type   : RECEPTION (perte à la livraison) | FIN_COMMERCE (invendus 19h)
 * origine: auto | manuel | auto+manuel
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_returns', function (Blueprint $table) {
            // Type de retour — après la colonne "cause"
            $table->enum('type', ['RECEPTION', 'FIN_COMMERCE'])
                ->default('RECEPTION')
                ->after('cause')
                ->comment('RECEPTION = perte à la livraison | FIN_COMMERCE = invendus 19h');

            // Traçabilité de création
            $table->enum('origine', ['auto', 'manuel', 'auto+manuel'])
                ->default('manuel')
                ->after('type')
                ->comment('Comment le retour a été créé');

            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('product_returns', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn(['type', 'origine']);
        });
    }
};
