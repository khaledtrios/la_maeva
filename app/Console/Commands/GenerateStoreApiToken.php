<?php

namespace App\Console\Commands;

use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * PHASE 3.5 (C2) — génère le jeton d'API d'un store pour son intégration caisse.
 *
 * La caisse doit ensuite envoyer ce jeton dans l'en-tête `X-Caisse-Token`
 * (ou `Authorization: Bearer <token>`) sur /api/sync-caisse.
 *
 * Le jeton n'est affiché qu'à la génération : il est stocké tel quel en base
 * (secret machine-à-machine), aucune récupération n'est proposée par l'API.
 */
class GenerateStoreApiToken extends Command
{
    protected $signature = 'store:api-token
                            {store? : ID ou slug du store (sinon tous ceux qui n\'en ont pas)}
                            {--force : Régénère le jeton même s\'il existe déjà (révoque l\'ancien)}';

    protected $description = 'Génère le jeton d\'API caisse d\'un store (en-tête X-Caisse-Token)';

    public function handle(): int
    {
        $reference = $this->argument('store');
        $force = (bool) $this->option('force');

        if ($reference) {
            $store = Store::where('id', $reference)->orWhere('slug', $reference)->first();

            if (!$store) {
                $this->error("Store introuvable : « {$reference} ».");

                return self::FAILURE;
            }

            $stores = collect([$store]);
        } else {
            // Sans argument : on ne touche qu'aux stores dépourvus de jeton, afin
            // de ne jamais révoquer par accident une intégration en service.
            $stores = Store::when(!$force, fn ($q) => $q->whereNull('api_token'))->orderBy('id')->get();
        }

        if ($stores->isEmpty()) {
            $this->info('Aucun store à traiter (tous ont déjà un jeton). Utilisez --force pour régénérer.');

            return self::SUCCESS;
        }

        foreach ($stores as $store) {
            if ($store->api_token && !$force) {
                $this->line("  <fg=gray>=</> store #{$store->id} « {$store->name} » a déjà un jeton (--force pour régénérer)");
                continue;
            }

            $ancien = $store->api_token;
            $token = 'caisse_' . Str::random(56);

            // api_token est hors $fillable : affectation directe volontaire.
            $store->api_token = $token;
            $store->save();

            $this->line("  <fg=green>+</> store #{$store->id} « {$store->name} »");
            $this->line("      jeton : <options=bold>{$token}</>");

            if ($ancien) {
                $this->warn('      L\'ancien jeton est révoqué : mettez à jour la caisse de cette boutique.');
            }
        }

        $this->newLine();
        $this->info('À configurer côté caisse : en-tête HTTP  X-Caisse-Token: <jeton>');

        return self::SUCCESS;
    }
}
