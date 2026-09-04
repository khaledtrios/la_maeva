<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\Expedition;
use App\Models\ExpeditionLine;
use App\Models\Production;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ExpeditionSeeder extends Seeder
{
    /**
     * Seed des expéditions du labo (entity_id=1) vers les boutiques
     * Une expédition par jour (par boutique) sur les derniers jours
     * Statuts : BROUILLON pour plus ancien, ENVOYEE, RECUE pour récents
     */
    public function run(): void
    {
        $bakeries = [2, 3]; // Maéva Paris, Maéva Marseille
        $createdBy = 1; // Chef Labo Cayenne

        // Jours d'expéditions : du 18 au 22 avril
        $dates = collect([
            ['date' => '2026-04-18', 'statut' => 'RECUE'],
            ['date' => '2026-04-19', 'statut' => 'RECUE'],
            ['date' => '2026-04-20', 'statut' => 'ENVOYEE'],
            ['date' => '2026-04-21', 'statut' => 'ENVOYEE'],
            ['date' => '2026-04-22', 'statut' => 'ENVOYEE'],
        ]);

        foreach ($dates as $day) {
            foreach ($bakeries as $boulangerieId) {
                $expedition = Expedition::create([
                    'entity_id' => 1, // LABO source
                    'boulangerie_id' => $boulangerieId,
                    'date' => $day['date'],
                    'statut' => $day['statut'],
                    'created_by' => $createdBy,
                ]);

                // Créer les lignes d'expédition basées sur les productions du jour
                // On duplicate大致ment la production du labo de ce jour
                $productions = Production::where('entity_id', 1)
                    ->whereDate('date', $day['date'])
                    ->get();

                // Si pas de production ce jour-là (rare), on saute
                if ($productions->isEmpty()) {
                    continue;
                }

                foreach ($productions as $prod) {
                    // Calcul DLC: date production + dlc du produit
                    $product = $prod->product;
                    $productionDate = Carbon::parse($prod->date);
                    $dlc = $product->dlc
                        ? $productionDate->copy()->addDays($product->dlc)->toDateString()
                        : $productionDate->copy()->addDays(7)->toDateString();

                    ExpeditionLine::create([
                        'expedition_id' => $expedition->id,
                        'product_id' => $prod->product_id,
                        'quantite' => $prod->quantiteNette(), // quantité nette expédiée
                        'dlc' => $dlc,
                        'lot_reference' => $prod->lot ?? null,
                    ]);
                }
            }
        }
    }
}
