<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3 — VAGUE ② STOCKS : `store_id` sur les tables de stock et de seuils.
 *
 * Deuxième des 5 vagues (14 tables métier au total). Même profil que la vague ①
 * HACCP : chaque table porte un `entity_id` UNIQUE, la dérivation du store est
 * donc certaine et sans ambiguïté.
 *
 * PARTICULARITÉ — `ingredient_thresholds` n'a PAS de colonne `id` : sa clé
 * primaire est composite (entity_id, ingredient_id). L'ajout d'une colonne et
 * d'une clé étrangère y est sans effet de bord, mais on ne peut pas s'appuyer
 * sur un `id` pour les mises à jour (le backfill utilise un UPDATE ... JOIN,
 * qui fonctionne indépendamment de la présence d'une clé primaire simple).
 *
 * MÊMES RÈGLES QUE LES VAGUES PRÉCÉDENTES :
 *  - colonnes NULLABLES, sans valeur par défaut ;
 *  - aucune contrainte NOT NULL (reportée en Phase 4) ;
 *  - `entity_id` CONSERVÉ : il reste la frontière d'isolation du code applicatif ;
 *  - aucune donnée touchée : remplissage par
 *    `php artisan tenancy:backfill-business stocks` (idempotent, --dry-run).
 */
return new class extends Migration
{
    private const TABLES = [
        'stock_movements',
        'stock_balances',
        'ingredient_thresholds',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'store_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                // nullOnDelete : supprimer un store ne doit pas effacer en cascade
                // l'historique des mouvements de stock.
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
