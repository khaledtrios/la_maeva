<?php

namespace Database\Seeders;

use App\Models\Reception;
use App\Models\VenteJour;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class VenteJourSeeder extends Seeder
{
    /**
     * Seed des ventes quotidiennes par boutique
     * Basé sur les réceptions CONFIRMEEE
     * qte_recue = quantité reçue (depuis reception_lines)
     * qte_reste = invendus (10-15% de qte_recue)
     * qte_vendue = qte_recue - qte_reste
     */
    public function run(): void
    {
        // Récupérer toutes les réceptions CONFIRMEEE (donc reçues)
        $receptions = Reception::where('statut', 'CONFIRMEE')
            ->with(['lines.product', 'entity'])
            ->get();

        foreach ($receptions as $reception) {
            $date = $reception->date;

            foreach ($reception->lines as $line) {
                $qteRecue = $line->qte_recue;
                if ($qteRecue === null) {
                    continue;
                }

                // Simuler des invendus : 10-15% de la quantité reçue
                $pourcentageInvendus = (rand(8, 18) / 100); // 8-18%
                $qteReste = max(0, (int) floor($qteRecue * $pourcentageInvendus));
                $qteVendue = $qteRecue - $qteReste;

                VenteJour::updateOrCreate(
                    [
                        'entity_id' => $reception->entity_id,
                        'date' => $date,
                        'product_id' => $line->product_id,
                    ],
                    [
                        'qte_recue' => $qteRecue,
                        'qte_reste' => $qteReste,
                        'qte_vendue' => $qteVendue,
                    ]
                );
            }
        }
    }
}
