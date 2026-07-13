<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\Expedition;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Services\StockMovementService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ReceptionSeeder extends Seeder
{
    /**
     * Seed des réceptions dans les boutiques
     * Pour chaque expédition ENVOYEE ou RECUE, créer une réception
     * Certaines CONFIRMEE, certaines EN_ATTENTE
     */
    public function run(): void
    {
        // Récupérer toutes les expéditions ENVOYEE ou RECUE
        $expeditions = Expedition::whereIn('statut', ['ENVOYEE', 'RECUE'])
            ->orderBy('date')
            ->get();

        foreach ($expeditions as $expedition) {
            $entityId = $expedition->boulangerie_id; // boutique destinataire

            // Créer la réception (normalement créerReceptionFromExpedition l'aurait fait automatiquement)
            $reception = Reception::create([
                'expedition_id' => $expedition->id,
                'entity_id' => $entityId,
                'date' => $expedition->date,
                'statut' => $expedition->statut === 'RECUE' ? 'CONFIRMEE' : 'EN_ATTENTE',
            ]);

            // Copier les lignes d'expédition en lignes de réception
            foreach ($expedition->lines as $line) {
                $qteAttendue = $line->quantite;
                $qteRecue = $reception->statut === 'CONFIRMEE'
                    ? $qteAttendue - rand(0, 3) // petits écarts réalistes (0-3 unités manquantes)
                    : null;

                ReceptionLine::create([
                    'reception_id' => $reception->id,
                    'expedition_line_id' => $line->id,
                    'product_id' => $line->product_id,
                    'qte_attendue' => $qteAttendue,
                    'qte_recue' => $qteRecue,
                    'ecart' => $qteRecue !== null ? $qteRecue - $qteAttendue : null,
                    'dlc' => $line->dlc, // propagation DLC depuis expédition
                ]);

                // Si réception confirmée et quantité reçue > 0, créer stock_balance + movement
                if ($reception->statut === 'CONFIRMEE' && $qteRecue > 0) {
                    $dlc = $line->dlc
                        ? Carbon::parse($line->dlc)
                        : Carbon::parse($reception->date)->addDays(7);

                    $lotNumber = "REC-SEED-{$reception->id}-L{$line->id}";
                    if (!$expedition->created_by) {
                        echo "{$expedition->created_by}";
                    }
                    StockMovementService::createProductEntree(
                        $entityId,
                        $line->product_id,
                        $qteRecue,
                        $dlc,
                        [
                            'lot_number' => $lotNumber,
                            'provenance' => 'reception',
                            'reference' => "Réception #{$reception->id} (seed)",
                            'notes' => "Créé par seeder",
                            'movement_date' => $reception->date,
                            'created_by' => $expedition->created_by ?? 1,
                        ]
                    );

                    // Si écart (manquant), créer mouvement WASTE
                    if ($qteAttendue > $qteRecue) {
                        $shortage = $qteAttendue - $qteRecue;
                        \App\Models\StockMovement::create([
                            'entity_id' => $entityId,
                            'product_id' => $line->product_id,
                            'type' => 'WASTE',
                            'quantite' => -$shortage,
                            'dlc' => $dlc,
                            'lot_number' => "SHORTAGE-EXP-{$expedition->id}",
                            'provenance' => 'reception_shortage',
                            'reference' => "Réception #{$reception->id} (seed)",
                            'notes' => "Manquant à réception: {$shortage} unités non reçues",
                            'created_by' => $expedition->created_by,
                            'movement_date' => $reception->date,
                        ]);
                    }
                }
            }
        }
    }
}