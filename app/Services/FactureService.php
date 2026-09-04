<?php

namespace App\Services;

use App\Models\{
    Facture,
    FactureLigne,
    Expedition,
    Entity,
    User
};
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FactureService
{
    /**
     * Génère une facture pour une boulangerie sur une période donnée.
     * Utilisée pour la génération manuelle ET automatique.
     *
     * @param Entity $boulangerie  (cible)
     * @param Entity $labo         (émetteur)
     * @param string $periodeType  SEMAINE|MOIS|ANNEE|CUSTOM
     * @param string $dateDebut    Y-m-d
     * @param string $dateFin      Y-m-d
     * @param User|null $generator (null = automation)
     * @param bool $auto           true = génération auto
     * @return Facture
     *
     * @throws \Exception si expéditions existantes ou aucune expédition livrée/confirmée
     */
    public function genererFacture(
        Entity $boulangerie,
        Entity $labo,
        string $periodeType,
        string $dateDebut,
        string $dateFin,
        ?User $generator = null,
        bool $auto = false
    ): Facture {
        // Garde-fou (correctif P0, audit final multi-tenant, 2026-09-04) :
        // empêche toute création cross-store, quel que soit l'appelant. Avant
        // ce correctif, rien dans le service ne revérifiait que le labo
        // émetteur et la boulangerie destinataire appartiennent au même store
        // — seuls certains contrôleurs le faisaient, et jamais pour le rôle
        // ADMIN interne (dont `Entity::find()` n'est pas cloisonné). Ce garde
        // protège aussi les appels non-HTTP (job `FactureAutoGenerator`).
        if ($labo->store_id !== $boulangerie->store_id) {
            throw new \Exception(
                "Incohérence multi-tenant : le labo (store #{$labo->store_id}) et la boulangerie "
                . "(store #{$boulangerie->store_id}) n'appartiennent pas au même store."
            );
        }

        return DB::transaction(function () use (
            $boulangerie,
            $labo,
            $periodeType,
            $dateDebut,
            $dateFin,
            $generator,
            $auto
        ) {
            // 1. Vérifier pas de facture existante sur cette période (sauf annulées)
            $exists = Facture::where('entity_id', $labo->id)
                ->where('boulangerie_id', $boulangerie->id)
                ->where('periode_type', $periodeType)
                ->where('date_debut', $dateDebut)
                ->where('date_fin', $dateFin)
                ->whereNotIn('statut', ['ANNULEE'])
                ->exists();

            if ($exists) {
                throw new \Exception('Une facture existe déjà pour cette période.');
            }

            // 2. Récupérer expéditions RECUE + réception CONFIRMEE qui n'ont PAS encore été facturées
            $expeditions = Expedition::with(['lines.product', 'reception'])
                ->where('entity_id', $labo->id)
                ->where('boulangerie_id', $boulangerie->id)
                ->where('statut', 'RECUE')
                ->whereHas('reception', fn($q) => $q->where('statut', 'CONFIRMEE'))
                ->whereBetween('date', [$dateDebut, $dateFin])
                ->whereDoesntHave('factureLignes') // ← ne pas facturer une expédition déjà facturée
                ->orderBy('date')
                ->get();

            if ($expeditions->isEmpty()) {
                throw new \Exception('Aucune expédition livrée et confirmée sur cette période.');
            }

            // 3. Créer facture
            $facture = Facture::create([
                'numero'           => $this->generateNumero($periodeType, $dateDebut, $dateFin),
                'entity_id'        => $labo->id,
                'boulangerie_id'   => $boulangerie->id,
                'periode_type'     => $periodeType,
                'date_debut'       => $dateDebut,
                'date_fin'         => $dateFin,
                'montant_total'    => 0,
                'statut'           => 'BROUILLON',
                'generation_auto'  => $auto,
                'generated_by'     => $generator?->id,
                'validated_by'     => null,
            ]);

            // 4. Créer lignes
            $montantTotal = 0;
            foreach ($expeditions as $expedition) {
                foreach ($expedition->lines as $line) {
                    $prixUnitaire = (float) $line->product->prix_vente;
                    $montantLigne = $prixUnitaire * $line->quantite;

                    FactureLigne::create([
                        'facture_id'         => $facture->id,
                        'expedition_id'      => $expedition->id,
                        'expedition_line_id' => $line->id,
                        'product_id'         => $line->product_id,
                        'quantite'           => $line->quantite,
                        'prix_unitaire'      => $prixUnitaire,
                        'montant'            => $montantLigne,
                        'dlc'                => $line->dlc,
                        'lot_reference'      => $line->lot_reference,
                    ]);

                    $montantTotal += $montantLigne;
                }
            }

            // 5. Mettre à jour total
            $facture->update(['montant_total' => round($montantTotal, 2)]);

            return $facture;
        });
    }

    /**
     * Génère un numéro de facture unique : FAC-YYYY-NNNN (incrémental annuel)
     */
    private function generateNumero(string $periodeType, string $dateDebut, string $dateFin): string
    {
        $year = date('Y', strtotime($dateDebut));
        $last = Facture::whereYear('created_at', $year)->orderByDesc('id')->first();
        $next = $last ? str_pad($last->id + 1, 4, '0', STR_PAD_LEFT) : '0001';
        return "FAC-{$year}-{$next}";
    }

    /**
     * Annule une facture et crée un avoir (facture négative)
     */
    public function annulerFacture(Facture $facture, User $admin, string $raison = ''): Facture
    {
        return DB::transaction(function () use ($facture, $admin, $raison) {
            // Marquer facture originale annulée
            $facture->update(['statut' => 'ANNULEE']);

            // Créer l'avoir (facture négative)
            $avoir = Facture::create([
                'numero'           => 'AVOIR-' . $facture->numero,
                'entity_id'        => $facture->entity_id,
                'boulangerie_id'   => $facture->boulangerie_id,
                'periode_type'    => 'CUSTOM',
                'date_debut'      => $facture->date_debut,
                'date_fin'        => $facture->date_fin,
                'montant_total'   => -$facture->montant_total,
                'statut'          => 'EMISE',
                'generation_auto' => false,
                'generated_by'    => $admin->id,
                'notes'           => "Avoir pour facture {$facture->numero}. Raison : {$raison}",
            ]);

            // Dupliquer lignes avec montants négatifs
            foreach ($facture->lignes as $ligne) {
                FactureLigne::create([
                    'facture_id'         => $avoir->id,
                    'expedition_id'      => $ligne->expedition_id,
                    'expedition_line_id' => $ligne->expedition_line_id,
                    'product_id'         => $ligne->product_id,
                    'quantite'           => $ligne->quantite,
                    'prix_unitaire'      => $ligne->prix_unitaire,
                    'montant'            => -$ligne->montant,
                    'dlc'                => $ligne->dlc,
                    'lot_reference'      => $ligne->lot_reference,
                ]);
            }

            return $avoir;
        });
    }

    /**
     * Marque une facture comme payée
     */
    public function marquerPayee(Facture $facture, User $admin): Facture
    {
        $facture->update([
            'statut' => 'PAYEE',
            'paid_at' => now(),
            'paid_by' => $admin->id,
        ]);

        return $facture;
    }
}
