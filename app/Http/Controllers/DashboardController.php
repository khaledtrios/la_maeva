<?php

namespace App\Http\Controllers;

use App\Models\Production;
use App\Models\Reception;
use App\Models\Facture;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Vérifier si c'est un Store Admin (store guard) ou un utilisateur interne (web guard)
        $storeAdmin = Auth::guard('store')->user();

        if ($storeAdmin) {
            // Rediriger le Store Admin vers son dashboard
            return redirect()->route('store.dashboard');
        }

        // Utilisateur interne (employé) - utiliser entity_id
        $user = Auth::user();
        $entityId = $user->entity_id;
        $entityType = $user->entity->type;

        // Alertes stock ingrédients (labo)
        $alerts = InventoryService::getAlerts($entityId);

        // Données spécifiques par type d'entité
        $laboData     = null;
        $boutiqueData = null;

        if ($entityType === 'LABO') {
            $today       = now()->toDateString();
            $productions = Production::where('entity_id', $entityId)
                ->whereDate('date', $today)
                ->with('product')
                ->get();

            $laboData = [
                'count'           => $productions->count(),
                'total_unites'    => $productions->sum('quantite'),
                'total_pertes'    => $productions->sum('quantite_pertes'),
                'productions'     => $productions,
            ];
        } elseif ($entityType === 'BOULANGERIE') {
            // 1. Réceptions en attente
            $receptionsEnAttente = Reception::whereHas('expedition', function ($q) use ($entityId) {
                $q->where('boulangerie_id', $entityId);
            })
                ->where('statut', 'EN_ATTENTE')
                ->count();

            // 2. Alertes DLC pour boulangerie
            $today = now()->toDateString();
            $expiredCount = \App\Models\StockBalance::where('entity_id', $entityId)
                ->where('product_id', '!=', null)
                ->whereNotNull('dlc')
                ->where('dlc', '<=', $today)
                ->where('quantite', '>', 0)
                ->count();

            $expiringSoonCount = \App\Models\StockBalance::where('entity_id', $entityId)
                ->where('product_id', '!=', null)
                ->whereNotNull('dlc')
                ->where('dlc', '>', $today)
                ->where('dlc', '<=', now()->addDays(3)->toDateString())
                ->where('quantite', '>', 0)
                ->count();

            // 3. Retours en attente (BROUILLON) pour la boutique
            $returnsEnAttente = \App\Models\ProductReturn::where('entity_id', $entityId)
                ->where('status', 'BROUILLON')
                ->count();

            // 3. Résumé stock boulangerie
            $stockSummary = DB::table('stock_balances')
                ->where('entity_id', $entityId)
                ->where('product_id', '!=', null)
                ->where('quantite', '>', 0)
                ->join('products', 'products.id', 'stock_balances.product_id')
                ->select(
                    DB::raw('SUM(stock_balances.quantite) as total_quantity'),
                    DB::raw('SUM(stock_balances.quantite * products.cout_revient) as total_value'),
                )
                ->first();

            $boutiqueData = [
                'receptions_en_attente' => $receptionsEnAttente,
                'returns_en_attente'    => $returnsEnAttente,
                'expired_count'         => $expiredCount,
                'expiring_soon_count'   => $expiringSoonCount,
                'stock_summary' => [
                    'total_quantity' => (float) ($stockSummary->total_quantity ?? 0),
                    'total_value'    => (float) ($stockSummary->total_value ?? 0),
                ],
            ];
        }

        return Inertia::render('Dashboard', [
            'alerts'       => $alerts,
            'laboData'     => $laboData,
            'boutiqueData' => $boutiqueData,
            'factureStats' => $this->factureStats(),
        ]);
    }

    /**
     * Statistiques facturation pour le dashboard
     */
    public function factureStats(): array
    {
        // Vérifier si c'est un Store Admin
        $storeAdmin = Auth::guard('store')->user();

        if ($storeAdmin) {
            // Store Admin - utiliser l'entity_id du store
            $entityId = $storeAdmin->store->entity_id;
            $factures = Facture::where('entity_id', $entityId);
        } else {
            // Utilisateur interne
            $user = Auth::user();

            if ($user->role === 'RESP_BOUTIQUE' || $user->role === 'EMPLOYE_VENTE') {
                $factures = Facture::where('boulangerie_id', $user->entity_id);
            } elseif (in_array($user->role, ['RESP_LABO', 'ADMIN'])) {
                $factures = Facture::where('entity_id', $user->entity_id);
            } else {
                return [];
            }
        }

        return [
            'factures_brouillon' => (clone $factures)->where('statut', 'BROUILLON')->count(),
            'factures_emises_mois' => (clone $factures)->where('statut', 'EMISE')->whereMonth('date_debut', now()->month)->count(),
            'montant_en_cours' => (float) (clone $factures)->whereIn('statut', ['BROUILLON', 'EMISE'])->sum('montant_total'),
        ];
    }
}
