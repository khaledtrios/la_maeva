<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 4 — ÉTAPE 4 : recomposition des index uniques avec `store_id`.
 *
 * Depuis l'étape 3, `store_id` est NOT NULL sur toutes les tables métier : les
 * index globaux ci-dessous peuvent donc désormais être restreints au store,
 * sans le piège des NULL (chaque NULL étant traité comme distinct par MySQL,
 * ce qui aurait affaibli la contrainte tant que store_id était nullable).
 *
 * TROIS INDEX RECOMPOSÉS :
 *
 * 1. `products.code` : unique('code') -> unique(store_id, code).
 *    Décision validée en Phase 2 : « chaque Store possède ses propres produits »
 *    -> deux Stores indépendants doivent pouvoir réutiliser le même code produit.
 *
 * 2. `factures.numero` : unique('numero') -> unique(store_id, numero).
 *    Décision validée explicitement avant cette migration : chaque Store est une
 *    entreprise indépendante avec sa propre numérotation légale de facturation.
 *    Cohérent avec la convention déjà en place dans les données (FA-S1-*,
 *    FA-S2-*, FA-S3-* — le numéro intègre déjà l'identité du store).
 *
 * 3. `factures_periode_unique` (entity_id, boulangerie_id, periode_type,
 *    date_debut, date_fin) -> ajout de store_id en tête. Sémantiquement
 *    redondant (entity_id détermine déjà le store, vérifié à chaque vague
 *    précédente), mais ajouté explicitement pour la clarté du schéma et en
 *    défense en profondeur, comme demandé.
 *
 * Audit préalable : 0 doublon sous chacun des trois nouveaux régimes, sur les
 * données actuelles (12 produits, 3 factures).
 *
 * RÉVERSIBILITÉ : `down()` restaure les trois index globaux d'origine. Un
 * garde-fou vérifie qu'aucun doublon ne bloquerait ce retour en arrière (si des
 * codes/numéros identiques ont été créés dans des stores différents après le
 * passage en avant, le retour en arrière échouerait sinon silencieusement côté
 * MySQL).
 *
 * ⚠️ PIÈGE MySQL DÉCOUVERT EN TESTANT LE ROLLBACK (erreur 1553) :
 * `store_id` porte une contrainte FK (ON DELETE RESTRICT, étape 3). InnoDB
 * exige qu'une contrainte FK soit toujours couverte par UN index dont elle est
 * la colonne de tête. Une fois les index composites (store_id, code) et
 * (store_id, numero) créés, MySQL les utilise pour couvrir cette exigence — il
 * n'existe alors PLUS aucun autre index sur `store_id` seul. Un `down()` qui
 * supprime directement ces index composites échoue donc avec
 * « Cannot drop index … needed in a foreign key constraint ».
 * Solution : poser un index simple sur `store_id` AVANT de toucher aux index
 * composites (up() et down()), puis le retirer une fois qu'un autre index
 * recouvre à nouveau `store_id` — le schéma final reste inchangé dans les deux
 * sens, seule la transition est sécurisée.
 */
return new class extends Migration
{
    public function up(): void
    {
        // products.code
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_code_unique');
            $table->unique(['store_id', 'code'], 'products_store_code_unique');
        });

        // factures.numero
        Schema::table('factures', function (Blueprint $table) {
            $table->dropUnique('factures_numero_unique');
            $table->unique(['store_id', 'numero'], 'factures_store_numero_unique');
        });

        // factures_periode_unique (+ store_id)
        Schema::table('factures', function (Blueprint $table) {
            $table->dropUnique('factures_periode_unique');
            $table->unique(
                ['store_id', 'entity_id', 'boulangerie_id', 'periode_type', 'date_debut', 'date_fin'],
                'factures_periode_unique'
            );
        });

        // Filet de sécurité pour un ré-EXÉCUTE après rollback : down() a dû
        // laisser un index simple sur store_id pour garder la FK couverte
        // pendant sa propre transition. Les index composites ci-dessus
        // couvrent maintenant store_id à nouveau : l'index temporaire est donc
        // redondant. IMPORTANT : on ne le retire qu'APRÈS avoir créé les index
        // composites — le retirer avant ferait échouer la FK (même piège que
        // dans down(), en miroir).
        $this->dropIndexIfExists('products', 'products_store_id_index');
        $this->dropIndexIfExists('factures', 'factures_store_id_index');
    }

    public function down(): void
    {
        // Garde-fou : un doublon de code entre deux stores empêcherait de
        // revenir à une contrainte globale sur `code`.
        $doublonsCode = DB::table('products')
            ->select('code')
            ->groupBy('code')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($doublonsCode > 0) {
            throw new RuntimeException(
                "Rollback impossible : {$doublonsCode} code(s) produit dupliqué(s) entre stores depuis le passage à l'unicité par store."
            );
        }

        $doublonsNumero = DB::table('factures')
            ->select('numero')
            ->groupBy('numero')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($doublonsNumero > 0) {
            throw new RuntimeException(
                "Rollback impossible : {$doublonsNumero} numéro(s) de facture dupliqué(s) entre stores depuis le passage à l'unicité par store."
            );
        }

        // Index simples POSÉS AVANT toute suppression : garantissent que la FK
        // store_id reste couverte pendant toute la transition (cf. note ci-dessus).
        Schema::table('products', function (Blueprint $table) {
            $table->index('store_id', 'products_store_id_index');
        });
        Schema::table('factures', function (Blueprint $table) {
            $table->index('store_id', 'factures_store_id_index');
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->dropUnique('factures_periode_unique');
            $table->unique(
                ['entity_id', 'boulangerie_id', 'periode_type', 'date_debut', 'date_fin'],
                'factures_periode_unique'
            );
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->dropUnique('factures_store_numero_unique');
            $table->unique('numero', 'factures_numero_unique');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_store_code_unique');
            $table->unique('code', 'products_code_unique');
        });

        // Les index simples posés plus haut restent en place : plus aucun des
        // index restaurés ci-dessus ne couvre store_id, la FK en a toujours besoin.
    }

    /** Supprime un index s'il existe, sans erreur sinon (idempotence). */
    private function dropIndexIfExists(string $table, string $indexName): void
    {
        $exists = collect(DB::select("SHOW INDEX FROM {$table}"))
            ->contains(fn ($row) => $row->Key_name === $indexName);

        if ($exists) {
            Schema::table($table, fn (Blueprint $t) => $t->dropIndex($indexName));
        }
    }
};
