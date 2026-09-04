<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 4 — VAGUE 3d (DERNIÈRE VAGUE) : `store_id` obligatoire sur ventes et
 * facturation.
 *
 * Tables : ventes_jour, commandes_urgentes, factures.
 *
 * PARTICULARITÉ : `factures` relie DEUX entités (entity_id = LABO émetteur,
 * boulangerie_id = BOULANGERIE destinataire). Comme pour `expeditions` en vague
 * 3c, le `store_id` retenu est celui de l'entité PROPRIÉTAIRE (le labo émetteur).
 * La garantie que les deux entités appartiennent au même store est vérifiée :
 *   - en amont, par le garde-fou de `tenancy:backfill-business factures` ;
 *   - à nouveau ici, par l'audit préalable (0 ligne inter-store) ;
 *   - et par un garde-fou dédié dans cette migration, qui refuse d'exécuter si
 *     une facture relie deux stores différents.
 *
 * Audit préalable : 0 store_id NULL, 0 incohérence store_id↔entity_id, 0 facture
 * inter-store, 0 orphelin (sur 18 lignes après nettoyage de données de test
 * parasites détectées et retirées avant cette migration — cf. rapport).
 *
 * MÊME CONVERSION DE CLÉ ÉTRANGÈRE QU'AUX VAGUES PRÉCÉDENTES : ces tables
 * étaient en `ON DELETE SET NULL`, incompatible avec NOT NULL (erreur MySQL
 * 1830). Passage en `ON DELETE RESTRICT`.
 *
 * DERNIÈRE VAGUE DE L'ÉTAPE 3 : après cette migration, les 19 tables métier de
 * la Phase 4 ont toutes store_id NOT NULL + ON DELETE RESTRICT. Restent, en
 * étapes séparées à venir : la recomposition des index uniques
 * (products.code, factures.numero, factures_periode_unique) et l'activation
 * progressive de BelongsToStore/StoreScope.
 *
 * RÉVERSIBILITÉ : `down()` remet nullable et restaure `ON DELETE SET NULL`.
 */
return new class extends Migration
{
    private const TABLES = [
        'ventes_jour',
        'commandes_urgentes',
        'factures',
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
                    . 'Lancez tenancy:backfill-business ventes / factures avant cette migration.'
                );
            }
        }

        // Garde-fou spécifique : aucune facture ne doit relier deux stores.
        $interFactures = DB::table('factures')
            ->join('entities as a', 'a.id', '=', 'factures.entity_id')
            ->join('entities as b', 'b.id', '=', 'factures.boulangerie_id')
            ->whereColumn('a.store_id', '!=', 'b.store_id')
            ->count();

        if ($interFactures > 0) {
            throw new RuntimeException(
                "{$interFactures} facture(s) inter-store détectée(s) : store_id serait arbitraire pour ces lignes. "
                . 'Corrigez le rattachement des entités avant cette migration.'
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
