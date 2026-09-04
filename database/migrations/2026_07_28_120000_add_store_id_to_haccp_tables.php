<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3 — VAGUE ① HACCP : `store_id` sur les tables de traçabilité sanitaire.
 *
 * Première des 5 vagues de la Phase 3 (14 tables métier au total). HACCP est
 * volontairement traitée en premier : ces 4 tables portent un `entity_id` UNIQUE
 * et très peu de logique applicative, ce qui permet de valider la méthode
 * (migration → backfill → vérification d'isolation → tests) à faible risque
 * avant de l'appliquer aux vagues plus sensibles (stocks, logistique, factures).
 *
 * MÊMES RÈGLES QUE LES PHASES 1 ET 2 :
 *  - colonnes NULLABLES, sans valeur par défaut ;
 *  - aucune contrainte NOT NULL (reportée en Phase 4) ;
 *  - `entity_id` CONSERVÉ : il reste la frontière d'isolation utilisée par le
 *    code applicatif. `store_id` est ajouté en dénormalisation, pour permettre
 *    plus tard l'activation du global scope (défense en profondeur).
 *  - aucune donnée touchée : remplissage par
 *    `php artisan tenancy:backfill-business haccp` (idempotent, --dry-run).
 */
return new class extends Migration
{
    private const TABLES = [
        'haccp_temperatures',
        'haccp_nettoyage',
        'haccp_controles_reception',
        'haccp_non_conformites',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'store_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                // nullOnDelete : supprimer un store ne doit pas effacer des
                // relevés sanitaires (obligation de conservation HACCP).
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
