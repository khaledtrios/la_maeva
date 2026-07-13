<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use App\Models\Product;
use App\Models\VenteJour;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ReportingController extends Controller
{
    /**
     * Page de reporting — accessible ADMIN + DIRECTION
     */
    public function index()
    {
        // Récupérer toutes les ventes avec produits
        $ventes = VenteJour::with('product')->get();

        // Calculs globaux
        $caTotal = 0;
        $margeGlobale = 0;

        foreach ($ventes as $v) {
            $prixVente = (float) ($v->product->prix_vente ?? 0);
            $coutRevient = (float) ($v->product->cout_revient ?? 0);
            $caTotal += $v->qte_vendue * $prixVente;
            $margeGlobale += $v->qte_vendue * ($prixVente - $coutRevient);
        }

        $tauxMarge = $caTotal > 0 ? round(($margeGlobale / $caTotal) * 100, 2) : 0;

        // Taux d'invendus global
        $totalRecu = $ventes->sum('qte_recue');
        $totalReste = $ventes->sum('qte_reste');
        $tauxInvendus = $totalRecu > 0 ? round(($totalReste / $totalRecu) * 100, 2) : 0;

        // Par boulangerie
        $boulangeries = Entity::where('type', 'BOULANGERIE')->get();
        $byBoulangerie = [];

        foreach ($boulangeries as $b) {
            $ventesBoutique = $ventes->where('entity_id', $b->id);
            $caBoutique = 0;
            $margeBoutique = 0;

            foreach ($ventesBoutique as $v) {
                $prixVente = (float) ($v->product->prix_vente ?? 0);
                $coutRevient = (float) ($v->product->cout_revient ?? 0);
                $caBoutique += $v->qte_vendue * $prixVente;
                $margeBoutique += $v->qte_vendue * ($prixVente - $coutRevient);
            }

            $totalRecu = $ventesBoutique->sum('qte_recue');
            $totalReste = $ventesBoutique->sum('qte_reste');
            $tauxInvBoutique = $totalRecu > 0 ? round(($totalReste / $totalRecu) * 100, 2) : 0;

            $byBoulangerie[] = [
                'entity'       => ['id' => $b->id, 'nom' => $b->nom],
                'ca'           => round($caBoutique, 2),
                'marge'        => round($margeBoutique, 2),
                'taux_marge'   => $caBoutique > 0 ? round(($margeBoutique / $caBoutique) * 100, 2) : 0,
                'taux_invendus' => $tauxInvBoutique,
                'nb_ventes'    => $ventesBoutique->count(),
            ];
        }

        // Top 5 produits par quantité vendue
        $topProducts = $ventes->groupBy('product_id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'product'    => $first->product,
                    'qte_vendue' => $group->sum('qte_vendue'),
                ];
            })
            ->sortByDesc('qte_vendue')
            ->take(5)
            ->values()
            ->all();

        return Inertia::render('Reporting/Index', [
            'ca_total'        => round($caTotal, 2),
            'marge_globale'   => round($margeGlobale, 2),
            'taux_marge'      => $tauxMarge,
            'taux_invendus'   => $tauxInvendus,
            'by_boulangerie'  => $byBoulangerie,
            'top_products'    => $topProducts,
        ]);
    }
}
