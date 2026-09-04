<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3 — VAGUE ③ PRODUCTION / LOGISTIQUE.
 *
 * Troisième des 5 vagues. C'est la première à toucher des tables qui relient
 * DEUX entités :
 *   - `expeditions`     : entity_id (labo émetteur) + boulangerie_id (destinataire)
 *   - `product_returns` : entity_id (boutique émettrice) + labo_entity_id
 *   - `receptions`      : entity_id seul (le lien vers l'expédition est contrôlé
 *                         indirectement via `expeditions`)
 *   - `productions`     : entity_id seul
 *
 * Le `store_id` retenu est celui de l'entité PROPRIÉTAIRE du document (voir la
 * constante VAGUES de App\Console\Commands\BackfillBusinessStore). Comme les
 * boulangeries appartiennent au Store qui les crée, ces flux sont INTRA-store :
 * les deux entités désignent donc le même store. La commande de backfill
 * VÉRIFIE cette invariante ligne par ligne et REFUSE d'écrire la vague si une
 * seule ligne relie deux stores différents — la garantie est permanente, elle
 * protégera aussi les données créées après cette migration.
 *
 * MÊMES RÈGLES QUE LES VAGUES PRÉCÉDENTES :
 *  - colonnes NULLABLES ; aucune contrainte NOT NULL (Phase 4) ;
 *  - `entity_id` et `boulangerie_id` / `labo_entity_id` CONSERVÉS ;
 *  - aucune donnée touchée : remplissage par
 *    `php artisan tenancy:backfill-business production` (idempotent, --dry-run).
 */
return new class extends Migration
{
    private const TABLES = [
        'productions',
        'expeditions',
        'receptions',
        'product_returns',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'store_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                // nullOnDelete : supprimer un store ne doit pas effacer en cascade
                // l'historique de production et de traçabilité logistique (DLC/lots).
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
