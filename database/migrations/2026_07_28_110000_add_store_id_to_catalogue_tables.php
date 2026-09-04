<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 2 du plan de migration multi-tenant — catalogue propre à chaque Store.
 *
 * Décision métier validée : chaque Store possède ses propres produits, catégories,
 * ingrédients et recettes. Les recettes et paramètres de fabrication sont privés
 * au Store ; aucun Store ne doit voir ni modifier le catalogue d'un autre.
 *
 * VOLONTAIREMENT NON DESTRUCTIF (mêmes règles que la Phase 1) :
 *  - colonnes NULLABLES, sans valeur par défaut ;
 *  - aucune contrainte d'unicité modifiée (voir la note ci-dessous) ;
 *  - aucune donnée touchée : le remplissage est fait séparément par
 *    `php artisan tenancy:backfill-catalogue` (idempotent, --dry-run), qui
 *    n'écrit QUE lorsque le rattachement est certain.
 *
 * POURQUOI `products.code` RESTE UNIQUE GLOBALEMENT À CE STADE :
 * l'objectif final est `unique(store_id, code)` (deux Stores pourront réutiliser
 * le même code). Mais tant que `store_id` est NULLABLE, MySQL considère chaque
 * NULL comme distinct dans un index composite : `unique(store_id, code)`
 * autoriserait alors plusieurs lignes (NULL, 'PAI-001'). Basculer maintenant
 * AFFAIBLIRAIT donc la contrainte pendant toute la transition. La refonte de
 * l'unicité est reportée en Phase 4, au moment du passage en NOT NULL.
 */
return new class extends Migration
{
    /** Tables du catalogue recevant `store_id`. */
    private const TABLES = ['categories', 'ingredients', 'products', 'recipes'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                // nullOnDelete : supprimer un store ne doit pas effacer en cascade
                // des lignes de catalogue encore référencées par de l'historique.
                $blueprint->foreignId('store_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('stores')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['store_id']);
                $blueprint->dropColumn('store_id');
            });
        }
    }
};
