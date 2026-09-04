<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 2 du plan multi-tenant — remplissage de `store_id` sur le catalogue
 * (products, recipes, categories, ingredients).
 *
 * PRINCIPE : on n'écrit QUE lorsque le rattachement est CERTAIN, c'est-à-dire
 * lorsque tous les usages connus d'un élément convergent vers un seul store.
 * Tout élément ambigu (plusieurs stores) ou sans aucun usage reste à NULL et
 * figure dans le rapport, pour rattachement manuel. Aucune heuristique du type
 * « prendre le store le plus ancien » : un mauvais rattachement de catalogue
 * exposerait la recette d'un Store à un autre.
 *
 * Ordre de résolution (chaque étape alimente la suivante) :
 *   1. products    — usages métier directs et indirects
 *   2. recipes     — dérivé du produit (une recette appartient à son produit)
 *   3. categories  — dérivé des produits de la catégorie (si convergence)
 *   4. ingredients — usages de stock + recettes
 *
 * IDEMPOTENT : ne remplit que les NULL, n'écrase jamais un rattachement existant.
 */
class BackfillCatalogueStore extends Command
{
    protected $signature = 'tenancy:backfill-catalogue
                            {--dry-run : Analyse et rapport, sans aucune écriture}';

    protected $description = 'Rattache le catalogue (produits, recettes, catégories, ingrédients) à son store, uniquement quand c\'est certain';

    /** Éléments non rattachables, par table, pour le rapport final. */
    private array $indetermines = [];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('=== Backfill catalogue store_id — Phase 2 multi-tenant ===');
        $this->newLine();

        if ($dryRun) {
            $this->comment('Mode --dry-run : AUCUNE écriture ne sera effectuée.');
            $this->newLine();
        }

        // Prérequis : la Phase 1 doit avoir rattaché les entités.
        $entitesSansStore = DB::table('entities')->whereNull('store_id')->count();

        if ($entitesSansStore > 0) {
            $this->warn("{$entitesSansStore} entité(s) sans store_id : les usages liés à ces "
                . 'entités ne pourront pas être résolus. Lancez d\'abord tenancy:backfill-entities.');
            $this->newLine();
        }

        $plan = [];

        // ── 1. PRODUITS ──
        $plan['products'] = $this->resoudre('products', $this->usagesProduits());

        // Les étapes suivantes s'appuient sur le rattachement des produits :
        // en dry-run, on projette le plan sans l'avoir écrit.
        $produitsStore = $this->projeter('products', $plan['products']);

        // ── 2. RECETTES (dérivé du produit) ──
        $usagesRecettes = [];
        foreach (DB::table('recipes')->select('id', 'product_id')->get() as $recipe) {
            if ($storeId = $produitsStore[$recipe->product_id] ?? null) {
                $usagesRecettes[$recipe->id][$storeId] = true;
            }
        }
        $plan['recipes'] = $this->resoudre('recipes', $usagesRecettes);

        // ── 3. CATÉGORIES (dérivé des produits) ──
        $usagesCategories = [];
        foreach (DB::table('products')->select('id', 'category_id')->get() as $product) {
            if (!$product->category_id) {
                continue;
            }
            if ($storeId = $produitsStore[$product->id] ?? null) {
                $usagesCategories[$product->category_id][$storeId] = true;
            }
        }
        $plan['categories'] = $this->resoudre('categories', $usagesCategories);

        // ── 4. INGRÉDIENTS (stock + recettes) ──
        $plan['ingredients'] = $this->resoudre('ingredients', $this->usagesIngredients($produitsStore));

        // ── RAPPORT ──
        $this->afficherPlan($plan);
        $this->afficherIndetermines();
        $this->afficherSynthese($plan);

        if ($dryRun) {
            $total = array_sum(array_map('count', $plan));
            $this->comment("Terminé (dry-run) — {$total} écriture(s) auraient été effectuées.");

            return self::SUCCESS;
        }

        // ── ÉCRITURE ──
        $totalEcrit = 0;

        DB::transaction(function () use ($plan, &$totalEcrit) {
            foreach ($plan as $table => $assignations) {
                foreach ($assignations as $id => $storeId) {
                    // whereNull : jamais d'écrasement (idempotence + sécurité)
                    $totalEcrit += DB::table($table)
                        ->where('id', $id)
                        ->whereNull('store_id')
                        ->update(['store_id' => $storeId]);
                }
            }
        });

        $this->info("Backfill terminé : {$totalEcrit} ligne(s) de catalogue rattachée(s).");
        $this->afficherRestants();

        return self::SUCCESS;
    }

    /**
     * Usages des produits → stores, via toutes les tables métier qui les référencent.
     *
     * @return array<int, array<int, true>> [product_id => [store_id => true]]
     */
    private function usagesProduits(): array
    {
        $map = [];

        // Usages directs : la table porte elle-même entity_id
        $directs = array_filter(
            [['productions', 'product_id'], ['ventes_jour', 'product_id'], ['stock_balances', 'product_id']],
            fn (array $couple) => Schema::hasTable($couple[0])
        );

        foreach ($directs as [$table, $col]) {
            $rows = DB::table($table)
                ->join('entities', 'entities.id', '=', "{$table}.entity_id")
                ->whereNotNull("{$table}.{$col}")
                ->whereNotNull('entities.store_id')
                ->select("{$table}.{$col} as item_id", 'entities.store_id')
                ->get();

            $this->fusionner($map, $rows);
        }

        // product_returns porte entity_id ET product_id
        $rows = DB::table('product_returns')
            ->join('entities', 'entities.id', '=', 'product_returns.entity_id')
            ->whereNotNull('product_returns.product_id')
            ->whereNotNull('entities.store_id')
            ->select('product_returns.product_id as item_id', 'entities.store_id')
            ->get();
        $this->fusionner($map, $rows);

        // Usages indirects : table fille -> parent porteur d'entity_id
        $indirects = [
            ['expedition_lines', 'expeditions', 'expedition_id'],
            ['facture_lignes', 'factures', 'facture_id'],
            ['return_lines', 'product_returns', 'return_id'],
            ['commandes_urgentes_lines', 'commandes_urgentes', 'commande_urgente_id'],
        ];

        $indirects = array_filter(
            $indirects,
            fn (array $chemin) => Schema::hasTable($chemin[0]) && Schema::hasTable($chemin[1])
        );

        foreach ($indirects as [$fille, $parent, $fk]) {
            $rows = DB::table($fille)
                ->join($parent, "{$parent}.id", '=', "{$fille}.{$fk}")
                ->join('entities', 'entities.id', '=', "{$parent}.entity_id")
                ->whereNotNull("{$fille}.product_id")
                ->whereNotNull('entities.store_id')
                ->select("{$fille}.product_id as item_id", 'entities.store_id')
                ->get();

            $this->fusionner($map, $rows);
        }

        return $map;
    }

    /**
     * Usages des ingrédients → stores (stock, seuils, mouvements, recettes).
     *
     * @param  array<int, int>  $produitsStore  [product_id => store_id]
     * @return array<int, array<int, true>>
     */
    private function usagesIngredients(array $produitsStore): array
    {
        $map = [];

        // NB: `inventory_items` a été supprimée par la migration
        // 2026_04_25_093136_drop_inventory_items_table (contenu repris dans
        // stock_balances et ingredient_thresholds). On filtre donc sur les tables
        // réellement présentes, pour rester robuste aux évolutions du schéma.
        $tables = array_filter(
            ['inventory_items', 'stock_movements', 'stock_balances', 'ingredient_thresholds'],
            fn (string $table) => Schema::hasTable($table)
        );

        foreach ($tables as $table) {
            $rows = DB::table($table)
                ->join('entities', 'entities.id', '=', "{$table}.entity_id")
                ->whereNotNull("{$table}.ingredient_id")
                ->whereNotNull('entities.store_id')
                ->select("{$table}.ingredient_id as item_id", 'entities.store_id')
                ->get();

            $this->fusionner($map, $rows);
        }

        // Indirect : un ingrédient utilisé dans la recette d'un produit rattaché
        foreach (DB::table('recipes')->select('ingredient_id', 'product_id')->get() as $recipe) {
            if ($storeId = $produitsStore[$recipe->product_id] ?? null) {
                $map[$recipe->ingredient_id][$storeId] = true;
            }
        }

        return $map;
    }

    /** Agrège des lignes {item_id, store_id} dans la carte des usages. */
    private function fusionner(array &$map, $rows): void
    {
        foreach ($rows as $row) {
            $map[$row->item_id][$row->store_id] = true;
        }
    }

    /**
     * Ne retient que les éléments dont TOUS les usages convergent vers un store,
     * et qui ne sont pas déjà rattachés. Le reste part au rapport.
     *
     * @return array<int, int> [id => store_id]
     */
    private function resoudre(string $table, array $usages): array
    {
        $assignations = [];

        $lignes = DB::table($table)
            ->select('id', 'store_id', $this->colonneLibelle($table))
            ->get();

        foreach ($lignes as $ligne) {
            if ($ligne->store_id !== null) {
                continue; // déjà rattaché : on n'y touche pas
            }

            $stores = array_keys($usages[$ligne->id] ?? []);
            $libelle = $ligne->{$this->colonneLibelle($table)} ?? "#{$ligne->id}";

            if (count($stores) === 1) {
                $assignations[$ligne->id] = $stores[0];
            } else {
                $this->indetermines[$table][] = [
                    'id' => $ligne->id,
                    'libelle' => $libelle,
                    'raison' => $stores === []
                        ? 'aucun usage — impossible de déduire le store'
                        : 'usages dans plusieurs stores : ' . implode(', ', $stores),
                ];
            }
        }

        return $assignations;
    }

    /** Projette le rattachement des produits (existant + plan) pour les étapes dérivées. */
    private function projeter(string $table, array $plan): array
    {
        $resultat = DB::table($table)
            ->whereNotNull('store_id')
            ->pluck('store_id', 'id')
            ->all();

        foreach ($plan as $id => $storeId) {
            $resultat[$id] = $storeId;
        }

        return $resultat;
    }

    /** Colonne servant de libellé lisible selon la table. */
    private function colonneLibelle(string $table): string
    {
        return $table === 'recipes' ? 'id' : 'nom';
    }

    private function afficherPlan(array $plan): void
    {
        foreach ($plan as $table => $assignations) {
            $this->line("<options=bold>{$table}</> — " . count($assignations) . ' rattachement(s) certain(s)');

            if ($assignations === []) {
                $this->line('  (aucun)');
                continue;
            }

            $parStore = [];
            foreach ($assignations as $storeId) {
                $parStore[$storeId] = ($parStore[$storeId] ?? 0) + 1;
            }

            foreach ($parStore as $storeId => $nb) {
                $nom = DB::table('stores')->where('id', $storeId)->value('name');
                $this->line("  <fg=green>+</> {$nb} vers store #{$storeId} « {$nom} »");
            }
        }

        $this->newLine();
    }

    private function afficherIndetermines(): void
    {
        if ($this->indetermines === []) {
            return;
        }

        $this->line('<options=bold;fg=yellow>À RATTACHER MANUELLEMENT (store_id reste NULL)</>');

        foreach ($this->indetermines as $table => $lignes) {
            $this->line("  <options=bold>{$table}</> (" . count($lignes) . ')');

            foreach ($lignes as $ligne) {
                $this->line("    <fg=yellow>!</> #{$ligne['id']} « {$ligne['libelle']} » — {$ligne['raison']}");
            }
        }

        $this->newLine();
    }

    private function afficherSynthese(array $plan): void
    {
        $rows = [];

        foreach (['categories', 'ingredients', 'products', 'recipes'] as $table) {
            $total = DB::table($table)->count();
            $dejaRattaches = DB::table($table)->whereNotNull('store_id')->count();
            $aEcrire = count($plan[$table] ?? []);

            $rows[] = [
                $table,
                $total,
                $dejaRattaches,
                $aEcrire,
                $total - $dejaRattaches - $aEcrire,
            ];
        }

        $this->line('<options=bold>Synthèse</>');
        $this->table(['Table', 'Total', 'Déjà rattachés', 'À écrire', 'Resteront NULL'], $rows);
    }

    private function afficherRestants(): void
    {
        foreach (['categories', 'ingredients', 'products', 'recipes'] as $table) {
            $restants = DB::table($table)->whereNull('store_id')->count();

            if ($restants > 0) {
                $this->warn("{$table} : {$restants} ligne(s) sans store — à rattacher avant toute contrainte NOT NULL (Phase 4).");
            }
        }
    }
}
