<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 1 du plan de migration multi-tenant — rattachement des entités au Store.
 *
 * Objectif : permettre à un Store de posséder PLUSIEURS entités (son labo + ses
 * futurs points de vente), ce que `stores.entity_id` (une seule valeur) ne peut
 * pas exprimer. Décision métier validée : « les boulangeries appartiennent au
 * Store qui les crée ».
 *
 * VOLONTAIREMENT NON DESTRUCTIF :
 *  - la colonne est NULLABLE et sans valeur par défaut ;
 *  - `stores.entity_id` est CONSERVÉ (aucune suppression à ce stade) ;
 *  - aucune contrainte NOT NULL : le code actuel continue de fonctionner à
 *    l'identique, l'isolation restant assurée par `entity_id`.
 *
 * Le remplissage est fait séparément par `php artisan tenancy:backfill-entities`
 * (idempotent, avec --dry-run), afin que schéma et données restent découplés.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            // nullOnDelete : la suppression d'un store ne doit pas effacer
            // l'historique métier rattaché à ses entités.
            $table->foreignId('store_id')
                ->nullable()
                ->after('id')
                ->constrained('stores')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            $table->dropForeign(['store_id']);
            $table->dropColumn('store_id');
        });
    }
};
