<?php

namespace App\Http\Controllers;

use App\Models\HaccpControleReception;
use App\Models\HaccpNettoyage;
use App\Models\HaccpNonConformite;
use App\Models\HaccpTemperature;
use App\Services\HaccpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HaccpController extends Controller
{
    // ============================================
    // INDEX — PAGE HACCP UNIFIÉE
    // ============================================

    public function index()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // Charger toutes les données HACCP pour l'entité
        $temperatures = HaccpTemperature::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $plans = HaccpNettoyage::with('validateur')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $controles = HaccpControleReception::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Haccp/Index', [
            'temperatures' => $temperatures,
            'plans' => $plans,
            'controles' => $controles,
        ]);
    }

    // ============================================
    // TEMPÉRATURES
    // ============================================

    /**
     * Liste des relevés de température de l'entité
     * Redirige vers la page HACCP unifiée avec l'onglet "temperatures" actif
     */
    public function temperatures()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $temperatures = HaccpTemperature::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $plans = HaccpNettoyage::with('validateur')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $controles = HaccpControleReception::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Haccp/Index', [
            'temperatures' => $temperatures,
            'plans' => $plans,
            'controles' => $controles,
            'initialTab' => 'temperatures',
        ]);
    }

    /**
     * Enregistrer un relevé de température
     */
    public function storeTemperature(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $validated = $request->validate([
            'enceinte'      => ['required', 'string', 'max:255'],
            'temperature'   => ['required', 'numeric'],
            'date'          => ['required', 'date'],
        ]);

        HaccpTemperature::create([
            'entity_id'  => $entityId,
            'enceinte'   => $validated['enceinte'],
            'temperature' => $validated['temperature'],
            'date'       => $validated['date'],
            'created_by' => $user->id,
        ]);

        return back()->with('success', "Relevé de température enregistré : {$validated['enceinte']} à {$validated['temperature']}°C.");
    }

    // ============================================
    // NETTOYAGE
    // ============================================

    /**
     * Liste des plans de nettoyage
     * Redirige vers la page HACCP unifiée avec l'onglet "nettoyage" actif
     */
    public function nettoyage()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $temperatures = HaccpTemperature::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $plans = HaccpNettoyage::with('validateur')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $controles = HaccpControleReception::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Haccp/Index', [
            'temperatures' => $temperatures,
            'plans' => $plans,
            'controles' => $controles,
            'initialTab' => 'nettoyage',
        ]);
    }

    /**
     * Créer un plan de nettoyage vierge
     */
    public function storeNettoyage(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $validated = $request->validate([
            'date'          => ['required', 'date'],
            'taches_json'   => ['required', 'array'],
        ]);

        HaccpNettoyage::create([
            'entity_id'   => $entityId,
            'date'        => $validated['date'],
            'taches_json' => $validated['taches_json'],
            'statut'      => 'EN_COURS',
        ]);

        return back()->with('success', "Plan de nettoyage du {$validated['date']} créé avec " . count($validated['taches_json']) . " tâche(s).");
    }

    /**
     * Mettre à jour un plan de nettoyage (taches cochées + statut)
     */
    public function updateNettoyage(Request $request, HaccpNettoyage $nettoyage)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        if ($nettoyage->entity_id !== $entityId) {
            abort(403);
        }

        $validated = $request->validate([
            'taches_json' => ['required', 'array'],
            'statut'      => ['required', 'in:EN_COURS,VALIDE'],
        ]);

        $data = [
            'taches_json' => $validated['taches_json'],
            'statut'      => $validated['statut'],
        ];

        // Si validation, enregistrer le validateur
        if ($validated['statut'] === 'VALIDE') {
            $data['valide_par'] = $user->id;
        }

        $nettoyage->update($data);

        $statusText = $validated['statut'] === 'VALIDE' ? 'validé' : 'mis à jour';
        return back()->with('success', "Plan de nettoyage du {$nettoyage->date} {$statusText}.");
    }

    // ============================================
    // CONTRÔLES RÉCEPTION FOURNISSEURS
    // ============================================

    /**
     * Liste des contrôles de réception fournisseur
     * Redirige vers la page HACCP unifiée avec l'onglet "fournisseurs" actif
     */
    public function receptionsFournisseurs()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $temperatures = HaccpTemperature::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $plans = HaccpNettoyage::with('validateur')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        $controles = HaccpControleReception::with('creator')
            ->where('entity_id', $entityId)
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Haccp/Index', [
            'temperatures' => $temperatures,
            'plans' => $plans,
            'controles' => $controles,
            'initialTab' => 'fournisseurs',
        ]);
    }

    /**
     * Enregistrer un contrôle de réception fournisseur
     * La conformité est calculée automatiquement par le service
     * Si non conforme, une NC est créée automatiquement
     */
    public function storeReceptionFournisseur(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $validated = $request->validate([
            'fournisseur' => ['required', 'string', 'max:255'],
            'bl_number'   => ['nullable', 'string', 'max:100'],
            'categorie'   => ['required', 'in:AMBIANT,FRAIS,SURGELE'],
            'temperature' => ['nullable', 'numeric'],
            'commentaire' => ['nullable', 'string'],
            'date'        => ['required', 'date'],
        ]);

        DB::transaction(function () use ($validated, $user, $entityId) {
            $conforme = HaccpService::checkConformiteReception($validated['categorie'], $validated['temperature']);

            // Créer le contrôle
            $controle = HaccpControleReception::create([
                'entity_id'   => $entityId,
                'fournisseur' => $validated['fournisseur'],
                'bl_number'   => $validated['bl_number'],
                'categorie'   => $validated['categorie'],
                'temperature' => $validated['temperature'],
                'conforme'    => $conforme,
                'commentaire' => $validated['commentaire'],
                'date'        => $validated['date'],
                'created_by'  => $user->id,
            ]);

            // Si non conforme, créer une NC automatiquement
            if (!$conforme) {
                HaccpService::createNonConformiteFromReception($controle);
            }
        });

        $conforme = HaccpService::checkConformiteReception($validated['categorie'], $validated['temperature']);
        $status = $conforme ? 'conforme' : 'NON CONFORME';
        $ncMsg = !$conforme ? ' Une non-conformité a été créée automatiquement.' : '';
        return back()->with('success', "Contrôle réception {$validated['fournisseur']} enregistré : {$status}." . $ncMsg);
    }
}
