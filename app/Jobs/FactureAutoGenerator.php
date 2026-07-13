<?php

namespace App\Jobs;

use App\Models\{
    Facture,
    FactureSetting,
    Entity,
    User
};
use App\Services\FactureService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FactureAutoGenerator implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
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

        // Récupérer toutes les boutiques
        $boutiques = Entity::where('type', 'BOULANGERIE')->get();

        // Récupérer le labo (unique)
        $labo = Entity::where('type', 'LABO')->first();
        if (!$labo) {
            Log::error('[FactureAuto] Aucun labo trouvé — abort.');
            return;
        }

        // Période : mois précédent
        $now = Carbon::now();
        $dateFin = $now->copy()->subMonth()->endOfMonth()->toDateString();
        $dateDebut = $now->copy()->subMonth()->startOfMonth()->toDateString();

        // User système (créer un user avec role 'SYSTEM' dans les seeds)
        $generator = User::where('role', 'SYSTEM')->first();
        if (!$generator) {
            Log::warning('[FactureAuto] User SYSTEM non trouvé, génération avec null.');
        }

        foreach ($boutiques as $boutique) {
            try {
                // Vérifier si facture existe déjà pour cette période
                $exists = Facture::where('boulangerie_id', $boutique->id)
                    ->where('periode_type', 'MOIS')
                    ->where('date_debut', $dateDebut)
                    ->where('date_fin', $dateFin)
                    ->whereNotIn('statut', ['ANNULEE'])
                    ->exists();

                if ($exists) {
                    Log::info("[FactureAuto] Facture MOIS déjà existante pour {$boutique->nom} — skip.");
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

                Log::info("[FactureAuto] Facture MOIS générée : {$facture->numero} pour {$boutique->nom}");
            } catch (\Exception $e) {
                Log::error("[FactureAuto] Erreur pour {$boutique->nom}: " . $e->getMessage());
            }
        }
    }
}
