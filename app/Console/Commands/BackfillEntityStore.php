<?php

namespace App\Console\Commands;

use App\Models\Entity;
use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * PHASE 1 du plan multi-tenant — remplissage de `entities.store_id`.
 *
 * Source de vérité : `stores.entity_id` (l'entité principale de chaque store).
 *
 * La commande est IDEMPOTENTE : relancée, elle ne modifie que ce qui doit l'être
 * et ne réécrit jamais un rattachement déjà correct. Elle REFUSE d'écrire tant
 * qu'une ambiguïté subsiste (une entité revendiquée par plusieurs stores), afin
 * de ne jamais choisir un tenant à la place d'un humain.
 */
class BackfillEntityStore extends Command
{
    protected $signature = 'tenancy:backfill-entities
                            {--dry-run : Analyse et rapport, sans aucune écriture}
                            {--force : Écrire malgré des ambiguïtés (les entités ambiguës restent NULL)}';

    protected $description = 'Rattache les entités à leur store (entities.store_id) depuis stores.entity_id';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('=== Backfill entities.store_id — Phase 1 multi-tenant ===');
        $this->newLine();

        if ($dryRun) {
            $this->comment('Mode --dry-run : AUCUNE écriture ne sera effectuée.');
            $this->newLine();
        }

        // ── 1. Ambiguïtés : une entité revendiquée par plusieurs stores ──
        $ambiguous = DB::table('stores')
            ->whereNotNull('entity_id')
            ->select('entity_id', DB::raw('COUNT(*) as nb'))
            ->groupBy('entity_id')
            ->having('nb', '>', 1)
            ->get();

        // ── 2. Stores sans entité principale ──
        $storesSansEntite = Store::whereNull('entity_id')->get(['id', 'name']);

        // ── 3. Plan de rattachement (1 store ↔ 1 entité) ──
        $ambiguousIds = $ambiguous->pluck('entity_id')->all();

        $plan = Store::whereNotNull('entity_id')
            ->when($ambiguousIds, fn ($q) => $q->whereNotIn('entity_id', $ambiguousIds))
            ->get(['id', 'name', 'entity_id']);

        // ── 4. Entités qui resteront sans store ──
        $rattachables = $plan->pluck('entity_id')->all();
        $orphelines = Entity::when($rattachables, fn ($q) => $q->whereNotIn('id', $rattachables))
            ->get(['id', 'type', 'nom', 'store_id']);

        // ── RAPPORT ──
        $this->line('<options=bold>Rattachements prévus</>');

        if ($plan->isEmpty()) {
            $this->line('  (aucun)');
        }

        $aEcrire = 0;

        foreach ($plan as $store) {
            $entity = Entity::find($store->entity_id);

            if (!$entity) {
                $this->line("  <fg=red>✗</> store #{$store->id} « {$store->name} » → entité #{$store->entity_id} INTROUVABLE");
                continue;
            }

            if ((int) $entity->store_id === (int) $store->id) {
                $this->line("  <fg=gray>=</> {$entity->nom} → store #{$store->id} (déjà correct)");
                continue;
            }

            if ($entity->store_id !== null) {
                // Rattachement existant différent : on ne l'écrase jamais en silence
                $this->line("  <fg=yellow>!</> {$entity->nom} est déjà rattachée au store #{$entity->store_id}, "
                    . "or le store #{$store->id} la revendique — CONFLIT, ignorée");
                continue;
            }

            $this->line("  <fg=green>+</> {$entity->nom} ({$entity->type}) → store #{$store->id} « {$store->name} »");
            $aEcrire++;
        }

        $this->newLine();

        // Anomalies
        if ($ambiguous->isNotEmpty()) {
            $this->line('<options=bold;fg=red>Entités revendiquées par PLUSIEURS stores (bloquant)</>');
            foreach ($ambiguous as $row) {
                $entity = Entity::find($row->entity_id);
                $stores = Store::where('entity_id', $row->entity_id)->pluck('name', 'id');
                $this->line("  entité #{$row->entity_id} « " . ($entity->nom ?? '?') . " » revendiquée par {$row->nb} stores : "
                    . collect($stores)->map(fn ($n, $id) => "#{$id} {$n}")->implode(', '));
            }
            $this->newLine();
        }

        if ($storesSansEntite->isNotEmpty()) {
            $this->line('<options=bold;fg=yellow>Stores sans entité principale</>');
            foreach ($storesSansEntite as $store) {
                $this->line("  <fg=yellow>!</> store #{$store->id} « {$store->name} » — ses utilisateurs n'auront aucune donnée métier");
            }
            $this->newLine();
        }

        if ($orphelines->isNotEmpty()) {
            $this->line('<options=bold;fg=yellow>Entités qui resteront SANS store</>');
            foreach ($orphelines as $entity) {
                $etat = $entity->store_id ? "déjà rattachée au store #{$entity->store_id}" : 'store_id restera NULL';
                $this->line("  <fg=yellow>!</> #{$entity->id} {$entity->type} « {$entity->nom} » — {$etat}");
            }
            $this->newLine();
        }

        // ── Synthèse ──
        $this->line('<options=bold>Synthèse</>');
        $this->table(
            ['Indicateur', 'Valeur'],
            [
                ['Entités au total', Entity::count()],
                ['Entités déjà rattachées', Entity::whereNotNull('store_id')->count()],
                ['Rattachements à écrire', $aEcrire],
                ['Ambiguïtés bloquantes', $ambiguous->count()],
                ['Stores sans entité', $storesSansEntite->count()],
                ['Entités sans store après backfill', $orphelines->whereNull('store_id')->count()],
            ]
        );

        // ── Garde-fou ──
        if ($ambiguous->isNotEmpty() && !$this->option('force')) {
            $this->error('Backfill INTERROMPU : des entités sont revendiquées par plusieurs stores.');
            $this->line('Corrigez stores.entity_id, ou relancez avec --force pour traiter les cas non ambigus.');

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->comment("Terminé (dry-run) — {$aEcrire} écriture(s) auraient été effectuées.");

            return self::SUCCESS;
        }

        if ($aEcrire === 0) {
            $this->info('Rien à écrire : les rattachements sont déjà à jour.');

            return self::SUCCESS;
        }

        // ── Écriture ──
        $ecrites = 0;

        DB::transaction(function () use ($plan, &$ecrites) {
            foreach ($plan as $store) {
                $entity = Entity::find($store->entity_id);

                // On ne remplit QUE les NULL : jamais d'écrasement d'un
                // rattachement existant (idempotence + sécurité).
                if ($entity && $entity->store_id === null) {
                    $entity->store_id = $store->id;
                    $entity->save();
                    $ecrites++;
                }
            }
        });

        $this->info("Backfill terminé : {$ecrites} entité(s) rattachée(s).");

        $restantes = Entity::whereNull('store_id')->count();

        if ($restantes > 0) {
            $this->warn("{$restantes} entité(s) restent sans store — à traiter avant toute contrainte NOT NULL.");
        }

        return self::SUCCESS;
    }
}
