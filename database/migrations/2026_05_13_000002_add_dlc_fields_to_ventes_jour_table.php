<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Étape 1 — Retours
 * Enrichit la table ventes_jour (saisie 19h boutique) avec :
 *   - dlc_produit           : DLC du produit au moment de la saisie
 *   - quantite_vendable_j1  : invendus DLC encore valide → restent en boutique
 *   - quantite_perimee      : invendus DLC dépassée → déclenche retour Type B auto
 *
 * Note : qte_reste existant = quantite totale non vendue (conservé pour rétrocompat)
 * Les nouveaux champs nullable pour ne pas casser les lignes existantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventes_jour', function (Blueprint $table) {
            $table->date('dlc_produit')
                ->nullable()
                ->after('qte_reste')
                ->comment('DLC du produit au moment de la saisie 19h');

            $table->integer('quantite_vendable_j1')
                ->nullable()
                ->after('dlc_produit')
                ->comment('Invendus DLC valide → contribue suggestion J+1');

            $table->integer('quantite_perimee')
                ->nullable()
                ->after('quantite_vendable_j1')
                ->comment('Invendus DLC dépassée → génère retour Type B auto');

            $table->index(['entity_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('ventes_jour', function (Blueprint $table) {
            $table->dropIndex(['entity_id', 'date']);
            $table->dropColumn(['dlc_produit', 'quantite_vendable_j1', 'quantite_perimee']);
        });
    }
};
