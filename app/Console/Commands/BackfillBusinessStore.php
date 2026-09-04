<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3 — remplissage de `store_id` sur les tables métier, VAGUE PAR VAGUE.
 *
 * Règle de dérivation : store_id = entities.store_id, via la colonne d'entité
 * de référence de chaque table. C'est un backfill CERTAIN (et non une déduction
 * d'usage comme pour le catalogue en Phase 2) : chaque ligne métier porte déjà
 * l'entité à laquelle elle appartient, et la Phase 1 a rattaché les entités à
 * leur store.
 *
 * IDEMPOTENT : ne remplit que les `store_id` NULL, ne réécrit jamais une valeur
 * existante. Une ligne dont l'entité n'a pas de store reste NULL et est comptée
 * dans le rapport (aucune supposition n'est faite à sa place).
 */
class BackfillBusinessStore extends Command
{
    protected $signature = 'tenancy:backfill-business
                            {wave : Vague à traiter (haccp, stocks, production, ventes, factures)}
                            {--dry-run : Analyse et rapport, sans aucune écriture}';

    protected $description = 'Remplit store_id sur les tables métier d\'une vague, dérivé de entity_id -> entities.store_id';

    /**
     * Vagues de la Phase 3.
     *
     * Format par table : 'entity' = colonne d'entité faisant foi (propriétaire de
     * la ligne), 'check' = seconde colonne d'entité à CONTRÔLER lorsqu'elle existe.
     *
     * Pourquoi un 'check' : certaines tables relient deux entités (labo émetteur
     * et boutique destinataire). Depuis la décision « les boulangeries
     * appartiennent au Store qui les crée », ces flux sont INTRA-store : les deux
     * entités doivent donc appartenir au MÊME store. Si ce n'est pas le cas, le
     * `store_id` de la ligne serait arbitraire — la commande refuse alors d'écrire
     * la vague entière et produit un rapport, plutôt que de choisir à notre place.
     *
     * Colonnes retenues comme propriétaires :
     *  - expeditions / factures : `entity_id` = LABO émetteur (propriétaire du document)
     *  - product_returns        : `entity_id` = boutique émettrice du retour
     *  - receptions             : `entity_id` = destinataire (une seule colonne ;
     *    le lien vers l'expédition n'est pas contrôlé ici, il l'est indirectement
     *    par le contrôle porté sur `expeditions`)
     */
    private const VAGUES = [
        'haccp' => [
            'haccp_temperatures' => ['entity' => 'entity_id'],
            'haccp_nettoyage' => ['entity' => 'entity_id'],
            'haccp_controles_reception' => ['entity' => 'entity_id'],
            'haccp_non_conformites' => ['entity' => 'entity_id'],
        ],
        'stocks' => [
            'stock_movements' => ['entity' => 'entity_id'],
            'stock_balances' => ['entity' => 'entity_id'],
            'ingredient_thresholds' => ['entity' => 'entity_id'],
        ],
        'production' => [
            'productions' => ['entity' => 'entity_id'],
            'expeditions' => ['entity' => 'entity_id', 'check' => 'boulangerie_id'],
            'receptions' => ['entity' => 'entity_id'],
            'product_returns' => ['entity' => 'entity_id', 'check' => 'labo_entity_id'],
        ],
        'ventes' => [
            'ventes_jour' => ['entity' => 'entity_id'],
            'commandes_urgentes' => ['entity' => 'entity_id'],
        ],
        'factures' => [
            'factures' => ['entity' => 'entity_id', 'check' => 'boulangerie_id'],
        ],
    ];

    public function handle(): int
    {
        $vague = $this->argument('wave');
        $dryRun = (bool) $this->option('dry-run');

        if (!isset(self::VAGUES[$vague])) {
            $this->error("Vague inconnue « {$vague} ». Vagues disponibles : " . implode(', ', array_keys(self::VAGUES)));

            return self::FAILURE;
        }

        $tables = self::VAGUES[$vague];

        $this->info("=== Backfill store_id — Phase 3, vague « {$vague} » ===");
        $this->newLine();

        if ($dryRun) {
            $this->comment('Mode --dry-run : AUCUNE écriture ne sera effectuée.');
            $this->newLine();
        }

        // Prérequis Phase 1 : sans entités rattachées, rien n'est dérivable.
        $entitesSansStore = DB::table('entities')->whereNull('store_id')->count();

        if ($entitesSansStore > 0) {
            $this->error("{$entitesSansStore} entité(s) sans store_id : lancez d'abord tenancy:backfill-entities.");

            return self::FAILURE;
        }

        $lignes = [];
        $totalAEcrire = 0;
        $totalNonResolvable = 0;
        $ambiguites = [];

        foreach ($tables as $table => $config) {
            $colonneEntite = $config['entity'];
            $colonneControle = $config['check'] ?? null;

            if (!Schema::hasTable($table)) {
                $this->warn("{$table} : table absente, ignorée.");
                continue;
            }

            if (!Schema::hasColumn($table, 'store_id')) {
                $this->error("{$table} : colonne store_id absente — migration de la vague non appliquée.");

                return self::FAILURE;
            }

            // CONTRÔLE INTRA-STORE : les deux entités de la ligne doivent
            // appartenir au même store, sinon le store_id serait arbitraire.
            $nbAmbigus = 0;

            if ($colonneControle && Schema::hasColumn($table, $colonneControle)) {
                $nbAmbigus = DB::table($table)
                    ->join('entities as e_prop', 'e_prop.id', '=', "{$table}.{$colonneEntite}")
                    ->join('entities as e_ctrl', 'e_ctrl.id', '=', "{$table}.{$colonneControle}")
                    ->whereColumn('e_prop.store_id', '!=', 'e_ctrl.store_id')
                    ->count();

                if ($nbAmbigus > 0) {
                    $ambiguites[$table] = [
                        'nb' => $nbAmbigus,
                        'colonnes' => "{$colonneEntite} / {$colonneControle}",
                    ];
                }
            }

            $total = DB::table($table)->count();
            $dejaRempli = DB::table($table)->whereNotNull('store_id')->count();

            // Résolvables : store_id NULL et entité rattachée à un store
            $aEcrire = DB::table($table)
                ->join('entities', 'entities.id', '=', "{$table}.{$colonneEntite}")
                ->whereNull("{$table}.store_id")
                ->whereNotNull('entities.store_id')
                ->count();

            // Non résolvables : store_id NULL et entité sans store (ou entité absente)
            $nonResolvable = $total - $dejaRempli - $aEcrire;

            $lignes[] = [
                $table,
                $colonneEntite,
                $colonneControle ? "{$colonneControle} : " . ($nbAmbigus > 0 ? "{$nbAmbigus} AMBIGU" : 'OK') : '—',
                $total,
                $dejaRempli,
                $aEcrire,
                $nonResolvable,
            ];
            $totalAEcrire += $aEcrire;
            $totalNonResolvable += $nonResolvable;
        }

        $this->table(
            ['Table', 'Colonne entité', 'Contrôle 2e entité', 'Total', 'Déjà rempli', 'À écrire', 'Non résolvable'],
            $lignes
        );

        // ── GARDE-FOU : ambiguïté inter-store => aucune écriture ──
        if ($ambiguites !== []) {
            $this->error('AMBIGUÏTÉ DÉTECTÉE — écriture refusée pour toute la vague.');
            $this->newLine();

            foreach ($ambiguites as $table => $info) {
                $this->line("  <fg=red>✗</> {$table} : {$info['nb']} ligne(s) dont les deux entités "
                    . "({$info['colonnes']}) appartiennent à des stores DIFFÉRENTS.");
            }

            $this->newLine();
            $this->line('Ces lignes relient deux stores : leur store_id serait arbitraire. Corrigez le');
            $this->line('rattachement des entités concernées, ou tranchez la règle métier, avant de relancer.');

            return self::FAILURE;
        }

        if ($totalNonResolvable > 0) {
            $this->warn("{$totalNonResolvable} ligne(s) non résolvable(s) : leur entité n'a pas de store. "
                . 'Elles resteront à NULL et devront être traitées avant la Phase 4 (NOT NULL).');
            $this->newLine();
        }

        if ($dryRun) {
            $this->comment("Terminé (dry-run) — {$totalAEcrire} ligne(s) auraient été mises à jour.");

            return self::SUCCESS;
        }

        if ($totalAEcrire === 0) {
            $this->info('Rien à écrire : les store_id de cette vague sont déjà à jour.');

            return self::SUCCESS;
        }

        // ── ÉCRITURE ──
        $totalEcrit = 0;

        DB::transaction(function () use ($tables, &$totalEcrit) {
            foreach ($tables as $table => $config) {
                $colonneEntite = $config['entity'];

                if (!Schema::hasTable($table)) {
                    continue;
                }

                // UPDATE ... JOIN : dérive store_id de l'entité, uniquement sur
                // les lignes encore NULL (idempotence).
                $totalEcrit += DB::table($table)
                    ->join('entities', 'entities.id', '=', "{$table}.{$colonneEntite}")
                    ->whereNull("{$table}.store_id")
                    ->whereNotNull('entities.store_id')
                    ->update(["{$table}.store_id" => DB::raw('entities.store_id')]);
            }
        });

        $this->info("Backfill terminé : {$totalEcrit} ligne(s) mise(s) à jour.");
        $this->afficherRepartition($tables);

        return self::SUCCESS;
    }

    /** Contrôle visuel : répartition des lignes par store après écriture. */
    private function afficherRepartition(array $tables): void
    {
        $this->newLine();
        $this->line('<options=bold>Répartition par store</>');

        foreach ($tables as $table => $config) {
            if (!Schema::hasTable($table) || DB::table($table)->count() === 0) {
                continue;
            }

            $repartition = DB::table($table)
                ->whereNotNull('store_id')
                ->groupBy('store_id')
                ->select('store_id', DB::raw('COUNT(*) as total'))
                ->pluck('total', 'store_id')
                ->all();

            $restants = DB::table($table)->whereNull('store_id')->count();
            $detail = collect($repartition)->map(fn ($n, $id) => "store #{$id}: {$n}")->implode(', ');

            $this->line("  {$table} — {$detail}" . ($restants > 0 ? " | <fg=yellow>{$restants} sans store</>" : ''));
        }
    }
}
