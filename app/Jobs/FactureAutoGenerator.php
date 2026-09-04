<?php

namespace App\Jobs;

use App\Models\{
    Facture,
    FactureSetting,
    Entity,
    Store,
    User
};
use App\Services\FactureService;
use App\Support\CurrentStore;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FactureAutoGenerator implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     *
     * Correctif P0 (audit final multi-tenant, 2026-09-04) : ce job tourne en
     * queue, donc `CurrentStore::id()` vaut null (aucun guard authentifié) et
     * le `StoreScope` d'`Entity`/`Facture` ne filtre rien. La version précédente
     * prenait `Entity::where('type','LABO')->first()` — UN SEUL labo arbitraire
     * sur toute la plateforme — et bouclait sur TOUTES les boulangeries tous
     * stores confondus, produisant des factures mêlant le labo d'un store aux
     * boulangeries d'un autre. Le traitement est désormais strictement
     * store-par-store : chaque store résout SON PROPRE labo et SES PROPRES
     * boulangeries via `CurrentStore::for()`, qui active `StoreScope` pour la
     * durée du callback exactement comme le fait une requête HTTP normale.
     */
    public function handle(): void
    {
        // Vérifier si l'auto-génération est activée
        $enabled = FactureSetting::get('auto_generation_enabled', 'false');
        if ($enabled !== 'true') {
            Log::info('[FactureAuto] Génération auto désactivée — skip.');
            return;
        }

        $service = app(FactureService::class);

        // Période : mois précédent (identique pour tous les stores)
        $now = Carbon::now();
        $dateFin = $now->copy()->subMonth()->endOfMonth()->toDateString();
        $dateDebut = $now->copy()->subMonth()->startOfMonth()->toDateString();

        // User système (créer un user avec role 'SYSTEM' dans les seeds)
        $generator = User::where('role', 'SYSTEM')->first();
        if (!$generator) {
            Log::warning('[FactureAuto] User SYSTEM non trouvé, génération avec null.');
        }

        foreach (Store::all() as $store) {
            if (!$store->isActive()) {
                continue;
            }

            CurrentStore::for($store->id, function () use ($store, $service, $dateDebut, $dateFin, $generator) {
                $labo = Entity::where('type', 'LABO')->first();
                if (!$labo) {
                    Log::warning("[FactureAuto] Aucun labo pour le store #{$store->id} ({$store->name}) — skip.");
                    return;
                }

                $boutiques = Entity::where('type', 'BOULANGERIE')->get();

                foreach ($boutiques as $boutique) {
                    try {
                        // Vérifier si facture existe déjà pour cette période
                        $exists = Facture::where('entity_id', $labo->id)
                            ->where('boulangerie_id', $boutique->id)
                            ->where('periode_type', 'MOIS')
                            ->where('date_debut', $dateDebut)
                            ->where('date_fin', $dateFin)
                            ->whereNotIn('statut', ['ANNULEE'])
                            ->exists();

                        if ($exists) {
                            Log::info("[FactureAuto] Facture MOIS déjà existante pour {$boutique->nom} (store #{$store->id}) — skip.");
                            continue;
                        }

                        $facture = $service->genererFacture(
                            $boutique,
                            $labo,
                            'MOIS',
                            $dateDebut,
                            $dateFin,
                            $generator,
                            true
                        );

                        Log::info("[FactureAuto] Facture MOIS générée : {$facture->numero} pour {$boutique->nom} (store #{$store->id})");
                    } catch (\Exception $e) {
                        Log::error("[FactureAuto] Erreur pour {$boutique->nom} (store #{$store->id}): " . $e->getMessage());
                    }
                }
            });
        }
    }
}
