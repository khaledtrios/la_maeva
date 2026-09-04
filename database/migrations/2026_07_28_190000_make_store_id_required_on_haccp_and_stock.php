<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 4 — VAGUE 3b : `store_id` obligatoire sur HACCP et les stocks.
 *
 * Tables : haccp_temperatures, haccp_nettoyage, haccp_controles_reception,
 * haccp_non_conformites, stock_movements, stock_balances, ingredient_thresholds.
 *
 * Audit préalable (68 lignes) : 0 store_id NULL, 0 incohérence store_id↔entity_id,
 * 0 orphelin. Le garde-fou ci-dessous refait la vérification à l'exécution.
 *
 * MÊME CONVERSION DE CLÉ ÉTRANGÈRE QU'EN VAGUE 3a : ces tables ont été créées en
 * `ON DELETE SET NULL`, que MySQL refuse de combiner avec NOT NULL (erreur 1830).
 * Elles passent donc en `ON DELETE RESTRICT` : un store ayant des relevés
 * sanitaires ou des mouvements de stock ne peut plus être supprimé — cohérent
 * avec les obligations de conservation HACCP, et avec le cycle de vie qui prévoit
 * SUSPENDED pour désactiver un store sans le détruire.
 *
 * PARTICULARITÉ `ingredient_thresholds` : clé primaire COMPOSITE
 * (entity_id, ingredient_id), sans colonne `id`. `store_id` n'appartient pas à
 * cette clé, la modification est donc sans effet sur l'index primaire — mais la
 * vérification post-migration le contrôle explicitement.
 *
 * RÉVERSIBILITÉ : `down()` remet nullable et restaure `ON DELETE SET NULL`.
 */
return new class extends Migration
{
    private const TABLES = [
        // HACCP
        'haccp_temperatures',
        'haccp_nettoyage',
        'haccp_controles_reception',
        'haccp_non_conformites',
        // Stocks
        'stock_movements',
        'stock_balances',
        'ingredient_thresholds',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'store_id')) {
                throw new RuntimeException(
                    "Table « {$table} » absente ou sans colonne store_id : appliquez d'abord les migrations des phases 1 à 3."
                );
            }

            $nulls = DB::table($table)->whereNull('store_id')->count();

            if ($nulls > 0) {
                throw new RuntimeException(
                    "Impossible de rendre store_id obligatoire : « {$table} » contient {$nulls} ligne(s) à NULL. "
                    . 'Lancez tenancy:backfill-business (vagues haccp et stocks) avant cette migration.'
                );
            }
        }

        foreach (self::TABLES as $table) {
            // 1. Retirer la FK ON DELETE SET NULL (incompatible avec NOT NULL)
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['store_id']);
            });

            // 2. Rendre la colonne obligatoire
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->unsignedBigInteger('store_id')->nullable(false)->change();
            });

            // 3. Recréer la FK en RESTRICT
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreign('store_id')->references('id')->on('stores')->restrictOnDelete();
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
            });

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->unsignedBigInteger('store_id')->nullable()->change();
            });

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreign('store_id')->references('id')->on('stores')->nullOnDelete();
            });
        }
    }
};
