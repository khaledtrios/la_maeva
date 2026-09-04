<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3 — VAGUE ④ VENTES.
 *
 * Quatrième des 5 vagues. Les deux tables portent un `entity_id` UNIQUE
 * (`ventes_jour` = la boutique qui vend, `commandes_urgentes` = la boutique qui
 * commande), donc aucune ambiguïté inter-store possible : même profil de risque
 * que les vagues ① HACCP et ② Stocks.
 *
 * MÊMES RÈGLES QUE LES VAGUES PRÉCÉDENTES :
 *  - colonnes NULLABLES ; aucune contrainte NOT NULL (reportée en Phase 4) ;
 *  - `entity_id` CONSERVÉ : il reste la frontière d'isolation du code applicatif ;
 *  - aucune donnée touchée : remplissage par
 *    `php artisan tenancy:backfill-business ventes` (idempotent, --dry-run).
 *
 * NB : `ventes_jour` porte un index unique (entity_id, date, product_id). Il
 * n'est PAS modifié ici — l'ajout de `store_id` étant une dénormalisation, la
 * contrainte reste correcte telle quelle (l'entité détermine le store).
 */
return new class extends Migration
{
    private const TABLES = [
        'ventes_jour',
        'commandes_urgentes',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'store_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                // nullOnDelete : supprimer un store ne doit pas effacer en cascade
                // l'historique commercial (ventes, commandes).
                $blueprint->foreignId('store_id')
                    ->nullable()
                    ->after('entity_id')
                    ->constrained('stores')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'store_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['store_id']);
                $blueprint->dropColumn('store_id');
            });
        }
    }
};
