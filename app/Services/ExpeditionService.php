<?php

namespace App\Services;

use App\Models\Expedition;
use App\Models\ExpeditionLine;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Models\StockBalance;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExpeditionService
{
    /**
     * Créer une réception automatiquement quand une expédition passe à ENVOYEE
     * Les lignes de réception héritent de la DLC et production_id de l'expédition
     */
    public static function createReceptionFromExpedition(Expedition $expedition): Reception
    {
        $reception = Reception::create([
            'expedition_id' => $expedition->id,
            'entity_id'     => $expedition->boulangerie_id,
            'date'          => $expedition->date,
            'statut'        => 'EN_ATTENTE',
        ]);

        // Créer les lignes de réception basées sur les lignes d'expédition
        foreach ($expedition->lines as $expLine) {
            // Calculer DLC si manquante (fallback)
            $dlc = $expLine->dlc;
            if (!$dlc && $expLine->production && $expLine->date_production) {
                $dlc = \Carbon\Carbon::parse($expLine->date_production)
                    ->addDays($expLine->product?->dlc ?? 7)
                    ->toDateString();
            }
            if (!$dlc) {
                $dlc = now()->addDays(7)->toDateString();
            }

            // Lot number fallback
            $lotRef = $expLine->lot_reference ?: ($expLine->production?->lot ?? 'REC-' . $expLine->id);

            ReceptionLine::create([
                'reception_id'        => $reception->id,
                'expedition_line_id'  => $expLine->id,
                'product_id'          => $expLine->product_id,
                'qte_attendue'        => $expLine->quantite,
                'qte_recue'           => null,
                'ecart'               => null,
                'dlc'                 => $dlc,
                'date_production'     => $expLine->date_production,
                'lot_reference'       => $lotRef,
            ]);
        }

        return $reception;
    }

    /**
     * Créer les stocks (stock_balances) après confirmation de réception.
     * Chaque ligne reçue crée un lot en stock avec sa DLC et production_id.
     * Crée également le mouvement de stock (StockMovement) correspondant.
     *
     * @param Reception $reception
     * @param array $linesData  [{ reception_line_id, qte_recue }]
     */
    public static function createStockBalancesFromReception(Reception $reception, array $linesData): void
    {
        foreach ($linesData as $lineData) {
            $receptionLine = ReceptionLine::with(['expeditionLine.production.product'])
                ->findOrFail($lineData['reception_line_id']);

            // Vérifier que la ligne appartient bien à cette réception
            if ($receptionLine->reception_id !== $reception->id) {
                throw new \Exception('Ligne de réception invalide.');
            }

            $qteRecue = (int)$lineData['qte_recue'];
            if ($qteRecue <= 0) {
                continue; // Ne pas créer de stock pour quantité 0
            }

            $expeditionLine = $receptionLine->expeditionLine;
            $production = $expeditionLine?->production;

            // Calculer DLC et lot_number avec fallbacks
            $dlc = $receptionLine->dlc;
            $lotNumber = $receptionLine->lot_reference;

            // Si DLC manquante, la calculer à partir de la production + dlc du produit
            if (!$dlc && $production && $production->date) {
                $dlc = \Carbon\Carbon::parse($production->date)
                    ->addDays($production->product?->dlc ?? 7)
                    ->toDateString();
            }

            // Si toujours manquante, utiliser défaut 7 jours depuis aujourd'hui
            if (!$dlc) {
                $dlc = now()->addDays(7)->toDateString();
            }

            // Lot number: utiliser production->lot ou un fallback
            if (!$lotNumber && $production) {
                $lotNumber = $production->lot;
            }
            if (!$lotNumber) {
                $lotNumber = 'REC-' . $reception->id . '-' . $receptionLine->product_id;
            }

            // Créer le stock_balance
            StockBalance::create([
                'entity_id'          => $reception->entity_id,
                'product_id'         => $receptionLine->product_id,
                'ingredient_id'      => null,
                'dlc'                => $dlc,
                'lot_number'         => $lotNumber,
                'quantite'           => $qteRecue,
                'expedition_line_id' => $expeditionLine?->id,
                'production_id'      => $production?->id,
                'notes'              => null,
            ]);

            // Créer le mouvement de stock correspondant
            StockMovement::create([
                'entity_id'          => $reception->entity_id,
                'product_id'         => $receptionLine->product_id,
                'type'               => 'ENTREE',
                'quantite'           => $qteRecue,
                'dlc'                => $dlc,
                'lot_number'         => $lotNumber,
                'provenance'         => 'reception',
                'reference'          => "Réception #{$reception->id}",
                'reference_type'     => 'reception',
                'reference_id'      => $reception->id,
                'expedition_line_id' => $expeditionLine?->id,
                'production_id'      => $production?->id,
                'created_by'         => Auth::id(),
                'movement_date'      => $reception->date,
            ]);
        }
    }
}
