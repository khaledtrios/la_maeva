<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3 — VAGUE ⑤ FACTURES (dernière vague de la Phase 3).
 *
 * `factures` relie DEUX entités :
 *   - `entity_id`       = LABO émetteur  → retenu comme propriétaire du document
 *   - `boulangerie_id`  = BOULANGERIE destinataire → CONTRÔLÉE
 *
 * Le flux étant intra-store (les boulangeries appartiennent au Store qui les
 * crée), les deux entités doivent relever du même store. La commande
 * `tenancy:backfill-business factures` vérifie cette invariante ligne par ligne
 * et refuse d'écrire la vague entière si une seule facture relie deux stores.
 *
 * MÊMES RÈGLES QUE LES VAGUES PRÉCÉDENTES :
 *  - colonne NULLABLE ; aucune contrainte NOT NULL ;
 *  - `entity_id` et `boulangerie_id` CONSERVÉS ;
 *  - aucune donnée touchée (remplissage par la commande de backfill).
 *
 * ⚠️ INDEX UNIQUES VOLONTAIREMENT INCHANGÉS — à traiter en PHASE 4 :
 *   1. `factures_periode_unique` (entity_id, boulangerie_id, periode_type,
 *      date_debut, date_fin) : reste correct tel quel, l'entité déterminant le
 *      store. À recomposer avec `store_id` au passage en NOT NULL.
 *   2. `factures_numero_unique` (numero) : unicité GLOBALE du numéro de facture.
 *      À trancher en Phase 4 — un numéro doit-il être unique par store (chaque
 *      entreprise ayant sa propre numérotation légale) ou rester unique sur
 *      toute la plateforme ? Même piège que `products.code` : passer à
 *      `unique(store_id, numero)` tant que `store_id` est NULLABLE
 *      AFFAIBLIRAIT la contrainte (MySQL traite chaque NULL comme distinct).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('factures') || Schema::hasColumn('factures', 'store_id')) {
            return;
        }

        Schema::table('factures', function (Blueprint $table) {
            // nullOnDelete : supprimer un store ne doit pas effacer ses factures
            // (obligation légale de conservation des pièces comptables).
            $table->foreignId('store_id')
                ->nullable()
                ->after('entity_id')
                ->constrained('stores')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('factures') || !Schema::hasColumn('factures', 'store_id')) {
            return;
        }

        Schema::table('factures', function (Blueprint $table) {
            $table->dropForeign(['store_id']);
            $table->dropColumn('store_id');
        });
    }
};
