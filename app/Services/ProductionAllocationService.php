<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Production;
use App\Models\ExpeditionLine;
use App\Models\CommandeUrgente;
use App\Models\CommandeUrgenteLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class ProductionAllocationService
{
    /**
     * Vérifier si une commande urgente peut être allouée depuis les productions disponibles.
     * Utilise la date de la commande pour vérifier la disponibilité.
     *
     * @param CommandeUrgente $commande
     * @return array { 'ok': bool, 'shortages': array{product_id, nom, demande, disponible, manque}[] }
     */
    public static function checkCommandeAllocation(CommandeUrgente $commande): array
    {
        $shortages = [];
        $linesByProduct = $commande->lines->groupBy('product_id');

        // Utiliser la date de la commande (ou today si NULL)
        $date = $commande->date instanceof \DateTime
            ? $commande->date->format('Y-m-d')
            : ($commande->date ?? now()->toDateString());

        foreach ($linesByProduct as $productId => $lines) {
            $demande = $lines->sum('quantite');
            $disponible = self::getAvailableQuantity($productId, $commande->entity_id, $date);

            if ($demande > $disponible) {
                $product = Product::find($productId);
                $shortages[] = [
                    'product_id' => $productId,
                    'nom' => $product?->nom ?? 'Produit inconnu',
                    'demande' => $demande,
                    'disponible' => $disponible,
                    'manque' => $demande - $disponible,
                ];
            }
        }

        return [
            'ok' => empty($shortages),
            'shortages' => $shortages,
        ];
    }

    /**
     * Calculer la quantité disponible pour un produit dans un labo donné
     * pour une date spécifique (par défaut aujourd'hui).
     *
     * Disponible = somme(net des productions de la date) - somme(expéditions de cette date)
     *
     * @param int $productId
     * @param int $laboEntityId  entity_id du labo source (celui qui expédie)
     * @param string|null $date  Date au format Y-m-d (défaut: aujourd'hui)
     * @return int
     */
    public static function getAvailableQuantity(int $productId, int $laboEntityId, ?string $date = null): int
    {
        $date = $date ?? now()->toDateString();

        // 1. Quantité totale produite par CE labo à cette date (nette des pertes)
        $produite = Production::where('entity_id', $laboEntityId)
            ->where('product_id', $productId)
            ->whereDate('date', '=', $date)
            ->sum(DB::raw('quantite - quantite_pertes'));

        // 2. Quantité déjà expédiée/attribuée par ce labo à cette date
        // Toutes les expedition_lines qui ont une production_id liée
        $expediee = ExpeditionLine::whereHas('expedition', function($q) use ($laboEntityId, $date) {
                $q->where('entity_id', $laboEntityId)
                  ->whereDate('date', '=', $date);
            })
            ->where('product_id', $productId)
            ->whereNotNull('production_id')
            ->sum('quantite');

        return max(0, (int)$produite - (int)$expediee);
    }

    /**
     * Calculer la quantité totale disponible pour un produit dans un labo donné
     * (toutes dates confondues). Utilisé pour les alertes globales et reporting.
     *
     * Disponible = somme(net de toutes les productions) - somme(toutes les expéditions)
     *
     * @param int $productId
     * @param int $laboEntityId
     * @return int
     */
    public static function getTotalAvailableQuantity(int $productId, int $laboEntityId): int
    {
        // 1. Quantité totale produite par CE labo (toutes dates passées)
        $produite = Production::where('entity_id', $laboEntityId)
            ->where('product_id', $productId)
            ->whereDate('date', '<=', now()->toDateString())
            ->sum(DB::raw('quantite - quantite_pertes'));

        // 2. Quantité déjà expédiée/attribuée par ce labo (toutes dates)
        $expediee = ExpeditionLine::whereHas('expedition', fn($q) => $q->where('entity_id', $laboEntityId))
            ->where('product_id', $productId)
            ->whereNotNull('production_id')
            ->sum('quantite');

        return max(0, (int)$produite - (int)$expediee);
    }

    /**
     * Obtenir les productions disponibles pour un produit (FIFO: tri par date ASC).
     * Inclut le calcul du reste disponible par production.
     *
     * @param int $productId
     * @param int $laboEntityId
     * @param string|null $date  Date au format Y-m-d (défaut: aujourd'hui)
     * @return Collection<int, Production> avec 'reste_disponible' attaché
     */
    public static function getAvailableProductions(int $productId, int $laboEntityId, ?string $date = null): Collection
    {
        $date = $date ?? now()->toDateString();

        $productions = Production::with('product') // charger product pour DLC
            ->where('entity_id', $laboEntityId)
            ->where('product_id', $productId)
            ->whereDate('date', '=', $date) // uniquement productions de cette date
            ->orderBy('date', 'asc')
            ->get();

        // Calculer le reste disponible pour chaque production
        return $productions->map(function ($production) {
            $dejaExpediee = ExpeditionLine::where('production_id', $production->id)
                ->sum('quantite');
            $reste = $production->quantite - $production->quantite_pertes - $dejaExpediee;
            $production->reste_disponible = max(0, $reste);
            return $production;
        })->filter(fn($p) => $p->reste_disponible > 0);
    }

    /**
     * Allouer une quantité d'un produit aux productions disponibles (FIFO).
     *
     * @param int $productId
     * @param int $laboEntityId
     * @param int $quantiteAAllouer
     * @param string|null $date  Date au format Y-m-d (défaut: aujourd'hui)
     * @return array {production_id, date_production, dlc, quantite}[]
     */
    public static function allocateFifo(int $productId, int $laboEntityId, int $quantiteAAllouer, ?string $date = null): array
    {
        if ($quantiteAAllouer <= 0) {
            return [];
        }

        $productions = self::getAvailableProductions($productId, $laboEntityId, $date);
        $allocations = [];
        $reste = $quantiteAAllouer;

        foreach ($productions as $production) {
            if ($reste <= 0) break;

            $aPrelever = min($reste, $production->reste_disponible);
            if ($aPrelever <= 0) continue;

            // Calcul DLC = date_production + durée de vie du produit
            $produit = $production->product;
            $dlc = \Carbon\Carbon::parse($production->date)
                ->addDays($produit->dlc ?? 7)
                ->toDateString();

            $allocations[] = [
                'production_id'   => $production->id,
                'date_production' => $production->date,
                'dlc'             => $dlc,
                'quantite'        => $aPrelever,
                'lot_reference'   => $production->lot,
            ];

            $reste -= $aPrelever;
        }

        if ($reste > 0) {
            throw new \Exception(
                "Stock insuffisant pour le produit ID {$productId}. Manque : {$reste} unités."
            );
        }

        return $allocations;
    }

    /**
     * Vérifier les alertes de rupture pour le dashboard labo.
     *
     * @param int $laboEntityId
     * @return Collection{product_id, nom, stock_disponible, demandes_total, alertes}
     */
    public static function getStockAlerts(int $laboEntityId, string $date): Collection
    {
        // Tous les produits qui ont déjà été produits au moins une fois (productions passées)
        $produitsProduits = Production::where('entity_id', $laboEntityId)
            ->whereDate('date', '<=', now()->toDateString())
            ->distinct('product_id')
            ->pluck('product_id');

        $result = collect();

        foreach ($produitsProduits as $productId) {
            $product = Product::find($productId);
            if (!$product) continue;

            // Stock disponible pour la date donnée
            $stockDisponible = self::getAvailableQuantity($productId, $laboEntityId, $date);

            // Commandes urgentes en attente (ENVOYEE + PRISE_EN_CHARGE) POUR LA DATE
            $demandes = CommandeUrgenteLine::whereHas('commandeUrgente', function ($q) use ($date) {
                    $q->whereIn('statut', [CommandeUrgente::STATUT_ENVOYEE, CommandeUrgente::STATUT_PRISE_EN_CHARGE])
                      ->whereDate('date', $date);
                })
                ->where('product_id', $productId)
                ->sum('quantite');

            // Expéditions en brouillon (déjà allouées en stock mais pas encore parties) POUR LA DATE
            // Seules les lignes liées à une production consomment du disponible
            $enBrouillon = ExpeditionLine::whereHas('expedition', function ($q) use ($laboEntityId, $date) {
                    $q->where('entity_id', $laboEntityId)
                      ->where('statut', 'BROUILLON')
                      ->whereDate('date', $date);
                })
                ->where('product_id', $productId)
                ->whereNotNull('production_id')
                ->sum('quantite');

            $totalSollicitations = $demandes + $enBrouillon;
            $estEnAlerte = $stockDisponible < $totalSollicitations;

            $result->push([
                'product_id'       => $productId,
                'nom'              => $product->nom,
                'stock_disponible' => $stockDisponible,
                'commandes_attente'=> $demandes,
                'brouillon'        => $enBrouillon,
                'alertes'          => $estEnAlerte,
                'manque'           => $estEnAlerte ? $totalSollicitations - $stockDisponible : 0,
            ]);
        }

        return $result->sortBy('nom');
    }
}