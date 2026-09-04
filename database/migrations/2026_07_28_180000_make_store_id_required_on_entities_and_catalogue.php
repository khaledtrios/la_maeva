<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 4 — VAGUE 3a : `store_id` devient OBLIGATOIRE sur les entités et le catalogue.
 *
 * Première vague du passage en NOT NULL, sur les tables fondatrices :
 *   entities, categories, ingredients, products, recipes.
 *
 * PRÉ-REQUIS VÉRIFIÉ AVANT ÉCRITURE : les 5 tables comptaient 0 ligne à NULL
 * (66 lignes au total). La migration REFUSE de s'exécuter si ce n'est plus le
 * cas, plutôt que de laisser MySQL convertir silencieusement les NULL en 0 —
 * ce qui créerait des lignes rattachées à un store inexistant.
 *
 * CE QUI REND CETTE ÉTAPE SÛRE : le trait BelongsToStore (Phase 3.5) renseigne
 * `store_id` à chaque création. Un point avait été détecté et corrigé juste
 * avant cette vague : l'ADMIN interne, non cloisonné en lecture, produisait des
 * catégories/ingrédients à NULL — d'où l'ajout de `CurrentStore::idForWriting()`.
 *
 * ⚠️ CHANGEMENT DE COMPORTEMENT DES CLÉS ÉTRANGÈRES, IMPOSÉ PAR MySQL :
 * les FK avaient été créées en `ON DELETE SET NULL` (nullOnDelete), ce que MySQL
 * refuse de combiner avec NOT NULL (erreur 1830 : « Column 'store_id' cannot be
 * NOT NULL: needed in a foreign key constraint … SET NULL »). Il fallait donc
 * choisir :
 *   - CASCADE  : supprimer un store effacerait ses données — INACCEPTABLE, cela
 *                détruirait des factures et relevés HACCP soumis à conservation ;
 *   - RESTRICT : interdit de supprimer un store tant qu'il a des données.
 * RESTRICT est retenu : la suppression d'un store devient un acte explicite qui
 * exige de traiter ses données d'abord (le cycle de vie prévoit d'ailleurs
 * SUSPENDED pour désactiver sans supprimer).
 *
 * RÉVERSIBILITÉ : `down()` remet les colonnes en nullable ET restaure le
 * comportement `ON DELETE SET NULL` d'origine. Aucune donnée n'est touchée dans
 * un sens comme dans l'autre. Un dump SQL a été pris avant exécution.
 *
 * NON MODIFIÉ ICI : les index uniques (`products_code_unique`, etc.), traités en
 * étape 4, et les autres tables métier, traitées en vagues 3b/3c/3d.
 */
return new class extends Migration
{
    private const TABLES = [
        'entities',
        'categories',
        'ingredients',
        'products',
        'recipes',
    ];

    public function up(): void
    {
        // Garde-fou : aucune ligne ne doit rester à NULL.
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
                    . 'Lancez tenancy:backfill-entities / tenancy:backfill-catalogue avant cette migration.'
                );
            }
        }

        foreach (self::TABLES as $table) {
            // 1. Retirer la FK ON DELETE SET NULL (bloque le NOT NULL)
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['store_id']);
            });

            // 2. Rendre la colonne obligatoire
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->unsignedBigInteger('store_id')->nullable(false)->change();
            });

            // 3. Recréer la FK en RESTRICT (compatible NOT NULL, non destructif)
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

            // Restauration du comportement d'origine (ON DELETE SET NULL)
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreign('store_id')->references('id')->on('stores')->nullOnDelete();
            });
        }
    }
};
