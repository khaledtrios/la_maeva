<?php

namespace App\Http\Controllers;

use App\Models\Expedition;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Services\ExpeditionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ReceptionController extends Controller
{
    /**
     * Liste des réceptions (en attente + historique 7 jours)
     */
    public function index()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // Réceptions en attente
        $enAttente = Reception::with([
            'expedition.entity',
            'expedition.lines.product',
            'lines.product',
            'lines.expeditionLine.production',
        ])
            ->whereHas('expedition', fn($q) => $q->where('boulangerie_id', $entityId))
            ->where('statut', 'EN_ATTENTE')
            ->orderByDesc('date')
            ->get();

        // Historique 7 jours (confirmées)
        $historique = Reception::with([
            'expedition.entity',
            'lines.expeditionLine.production',
            'lines.product',
        ])
            ->whereHas('expedition', fn($q) => $q->where('boulangerie_id', $entityId))
            ->where('statut', 'CONFIRMEE')
            ->whereDate('date', '>=', now()->subDays(7))
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Receptions/Index', [
            'en_attente' => $enAttente,
            'historique' => $historique,
        ]);
    }

    /**
     * Confirmer une réception (saisie des quantités reçues)
     * Crée automatiquement les stock_balances avec traçabilité DLC/production
     */
    public function confirm(Request $request, Reception $reception)
    {
        $user = Auth::user();

        // Vérifier ownership
        if ($reception->entity_id !== $user->entity_id) {
            abort(403);
        }

        // Vérifier que la réception est en attente
        if ($reception->statut !== 'EN_ATTENTE') {
            return back()->with('error', 'Réception déjà confirmée.');
        }

        $validated = $request->validate([
            'lines' => ['required', 'array'],
            'lines.*.reception_line_id' => ['required', 'integer', 'exists:reception_lines,id'],
            'lines.*.qte_recue' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $reception, $user) {
            // 1. Mettre à jour chaque ligne de réception
            foreach ($validated['lines'] as $ligneData) {
                $line = ReceptionLine::find($ligneData['reception_line_id']);
                if ($line && $line->reception_id === $reception->id) {
                    $qteAttendue = $line->qte_attendue;
                    $qteRecue = $ligneData['qte_recue'];
                    $ecart = $qteRecue - $qteAttendue;

                    $line->update([
                        'qte_recue' => $qteRecue,
                        'ecart'     => $ecart,
                    ]);
                }
            }

            // 2. Passer la réception en CONFIRMEE
            $reception->update(['statut' => 'CONFIRMEE']);

            // 3. Créer les stock_balances pour chaque ligne reçue (qte_recue > 0)
            ExpeditionService::createStockBalancesFromReception($reception, $validated['lines']);

            // 4. Passer l'expédition en RECUE
            $expedition = $reception->expedition;
            if ($expedition) {
                $expedition->update(['statut' => 'RECUE']);
            }
        });

        return back()->with('success', "Réception #{$reception->id} confirmée et stock mis à jour avec " . count($validated['lines']) . " ligne(s).");
    }
}
