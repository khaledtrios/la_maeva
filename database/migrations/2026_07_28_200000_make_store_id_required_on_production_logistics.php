<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 4 — VAGUE 3c : `store_id` obligatoire sur production/logistique.
 *
 * Tables : productions, expeditions, receptions, product_returns.
 *
 * PARTICULARITÉ DE CETTE VAGUE : `expeditions` (entity_id / boulangerie_id) et
 * `product_returns` (entity_id / labo_entity_id) relient DEUX entités. Le
 * `store_id` retenu (colonne `entity` de BackfillBusinessStore, vague ③ Phase 3)
 * est celui de l'entité PROPRIÉTAIRE du document (labo émetteur pour les
 * expéditions, boutique émettrice pour les retours). La garantie que les deux
 * entités appartiennent au même store a été vérifiée :
 *   - en amont, par le garde-fou de `tenancy:backfill-business production`
 *     (refuse d'écrire toute la vague si une ligne relie deux stores) ;
 *   - à nouveau ici, par l'audit préalable à cette migration (0 ligne inter-store
 *     sur les 33 lignes actuelles) ;
 *   - `receptions` n'a qu'un seul entity_id, mais est indirectement rattachée à
 *     une expédition : vérifié que reception.store_id === expedition.store_id.
 *
 * Audit préalable : 0 store_id NULL, 0 incohérence store_id↔entity_id, 0 ligne
 * inter-store, 0 orphelin. Le garde-fou ci-dessous refait la vérification NULL
 * à l'exécution.
 *
 * MÊME CONVERSION DE CLÉ ÉTRANGÈRE QU'EN VAGUES 3a/3b : ces tables étaient en
 * `ON DELETE SET NULL`, incompatible avec NOT NULL (erreur MySQL 1830). Passage
 * en `ON DELETE RESTRICT` : un store ayant des productions, expéditions,
 * réceptions ou retours ne peut plus être supprimé.
 *
 * RÉVERSIBILITÉ : `down()` remet nullable et restaure `ON DELETE SET NULL`.
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
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'store_id')) {
                throw new RuntimeException(
                    "Table « {$table} » absente ou sans colonne store_id : appliquez d'abord les migrations des phases 1 à 3."
                );
            }

            $nulls = DB::table($table)->whereNull('store_id')->count();

            if ($nulls > 0) {
                throw new RuntimeException(
                    "Impossible de rendre store_id obligatoire : « {$table} » contient {$nulls} ligne(s) à NULL. "
                    . 'Lancez tenancy:backfill-business production avant cette migration.'
                );
            }
        }

        // Garde-fou spécifique à cette vague : aucune ligne à deux entités ne
        // doit relier deux stores différents (sinon store_id serait arbitraire).
        $interExpeditions = DB::table('expeditions')
            ->join('entities as a', 'a.id', '=', 'expeditions.entity_id')
            ->join('entities as b', 'b.id', '=', 'expeditions.boulangerie_id')
            ->whereColumn('a.store_id', '!=', 'b.store_id')
            ->count();

        $interRetours = DB::table('product_returns')
            ->join('entities as a', 'a.id', '=', 'product_returns.entity_id')
            ->join('entities as b', 'b.id', '=', 'product_returns.labo_entity_id')
            ->whereColumn('a.store_id', '!=', 'b.store_id')
            ->count();

        if ($interExpeditions > 0 || $interRetours > 0) {
            throw new RuntimeException(
                "Ligne(s) inter-store détectée(s) : {$interExpeditions} expédition(s), {$interRetours} retour(s). "
                . 'store_id serait arbitraire pour ces lignes — corrigez le rattachement des entités avant cette migration.'
            );
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
