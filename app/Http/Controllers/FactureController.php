<?php

namespace App\Http\Controllers;

use App\Models\{
    Facture,
    FactureLigne,
    Entity,
    Expedition,
    Product,
    User
};
use App\Services\FactureService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;

class FactureController extends Controller
{
    public function __construct(protected FactureService $service) {}

    /**
     * Liste des factures avec filtres
     */
    public function index(Request $request)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();
        $query = Facture::with([
            'entity',
            'boulangerie',
            'generator',
            'validator',
            'payer',
            'lignes.product.category',
        ]);

        // Filtrage par rôle
        if ($user->role === 'RESP_LABO') {
            $query->where('entity_id', $entityId);
        } elseif (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'STORE_ADMIN'])) {
            $query->where('boulangerie_id', $entityId);
            // Les boutiques et Store Admin ne peuvent pas filtrer par une autre entité
            $request->merge(['boulangerie_id' => $entityId]);
        }
        // ADMIN voit tout

        // Filtres
        if ($request->boulangerie_id) {
            $query->where('boulangerie_id', $request->boulangerie_id);
        }
        if ($request->periode_type) {
            $query->where('periode_type', $request->periode_type);
        }
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }
        if ($request->date_from) {
            $query->where('date_debut', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('date_fin', '<=', $request->date_to);
        }

        $factures = $query->orderByDesc('date_debut')->paginate(15)->withQueryString();

        // Boutiques : seulement leur propre boutique (ou toutes pour ADMIN/LABO)
        if (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE'])) {
            $boutiques = Entity::where('type', 'BOULANGERIE')
                ->where('id', $user->entity_id)
                ->orderBy('nom')
                ->get(['id', 'nom']);
        } else {
            $boutiques = Entity::where('type', 'BOULANGERIE')->orderBy('nom')->get(['id', 'nom']);
        }

        $labos = Entity::where('type', 'LABO')->orderBy('nom')->get(['id', 'nom']);

        return Inertia::render('Factures/Index', [
            'factures'     => $factures,
            'boutiques'    => $boutiques,
            'labos'        => $labos,
            'filters'      => $request->only(['boulangerie_id', 'periode_type', 'statut', 'date_from', 'date_to']),
            'periodeTypes' => ['SEMAINE', 'MOIS', 'ANNEE', 'CUSTOM'],
            'statuts'      => ['BROUILLON', 'EMISE', 'PAYEE', 'ANNULEE'],
        ]);
    }

    /**
     * Formulaire de création manuelle
     */
    public function create(Request $request)
    {
        // Cloisonnement multi-tenant : un Store Admin ne doit pas découvrir les
        // entités des autres stores — il ne voit que la sienne.
        $isScoped = $this->isStoreAdmin();
        $scopedEntityId = $isScoped ? $this->getCurrentEntityId() : null;

        $boutiques = Entity::where('type', 'BOULANGERIE')
            ->when($isScoped, fn ($q) => $q->where('id', $scopedEntityId))
            ->orderBy('nom')->get(['id', 'nom']);
        $labos = Entity::where('type', 'LABO')
            ->when($isScoped, fn ($q) => $q->where('id', $scopedEntityId))
            ->orderBy('nom')->get(['id', 'nom']);

        return Inertia::render('Factures/Create', [
            'boutiques'    => $boutiques,
            'labos'        => $labos,
            'periodeTypes' => ['SEMAINE', 'MOIS', 'ANNEE', 'CUSTOM'],
        ]);
    }

    /**
     * Stocker nouvelle facture (génération)
     */
    public function store(Request $request)
    {
        $request->validate([
            'boulangerie_id' => ['required', 'integer', 'exists:entities,id'],
            'entity_id'      => ['required', 'integer', 'exists:entities,id'],
            'periode_type'   => ['required', 'in:SEMAINE,MOIS,ANNEE,CUSTOM'],
            'date_debut'     => ['required', 'date'],
            'date_fin'       => ['required', 'date', 'after_or_equal:date_debut'],
            'notes'          => ['nullable', 'string'],
        ]);

        // Cloisonnement multi-tenant : un Store Admin ne peut générer une facture
        // qu'impliquant SA propre entité (émettrice ou destinataire). Sans ce
        // contrôle, `exists:entities,id` laisse facturer pour le compte d'un tiers.
        if ($this->isStoreAdmin()) {
            $entityId = $this->getCurrentEntityId();

            if ((int) $request->boulangerie_id !== $entityId && (int) $request->entity_id !== $entityId) {
                abort(403, 'Vous ne pouvez générer une facture que pour votre propre entité.');
            }
        }

        try {
            $boulangerie = Entity::findOrFail($request->boulangerie_id);
            $labo = Entity::findOrFail($request->entity_id);

            $facture = $this->service->genererFacture(
                $boulangerie,
                $labo,
                $request->periode_type,
                $request->date_debut,
                $request->date_fin,
                $this->getCurrentUser(),
                false // manuel
            );

            if ($request->notes) {
                $facture->update(['notes' => $request->notes]);
            }

            return redirect()->route('factures.show', $facture)
                ->with('success', "Facture {$facture->numero} générée pour {$boulangerie->nom} (période: {$request->periode_type}).");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Afficher facture détaillée
     */
    public function show(Facture $facture)
    {
        $this->authorizeView($facture);

        $facture->load([
            'entity',
            'boulangerie',
            'generator',
            'validator',
            'payer',
            'lignes.product.category',
            'lignes.expedition' => fn($q) => $q->with(['creator', 'reception']),
        ]);

        return Inertia::render('Factures/Show', [
            'facture' => $facture,
        ]);
    }

    /**
     * Générer PDF de la facture
     */
    public function pdf(Facture $facture)
    {
        $this->authorizeView($facture);

        $facture->load([
            'entity',
            'boulangerie',
            'lignes.product.category',
            'generator',
            'validator',
        ]);

        $pdf = PDF::loadView('factures.pdf', [
            'facture' => $facture,
            'company' => [
                'name'    => config('app.name'),
                'address' => 'Zone Industrielle, Cayenne',
                'siret'   => '123 456 789 00010',
                'tva'     => 'FR12345678901',
            ],
        ]);

        $filename = "facture-{$facture->numero}.pdf";

        return response($pdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Valider (émettre) la facture : BROUILLON → EMISE
     */
    public function validateFacture(Request $request, Facture $facture)
    {
        $this->authorizeView($facture);

        if ($facture->statut !== 'BROUILLON') {
            return back()->withErrors(['error' => 'Seules les factures en brouillon peuvent être validées.']);
        }

        $facture->update([
            'statut'        => 'EMISE',
            'validated_by'  => $this->getCurrentUser()->id,
        ]);

        return back()->with('success', "Facture {$facture->numero} émise.");
    }

    /**
     * Marquer facture comme payée : BROUILLON/EMISE → PAYEE
     */
    public function pay(Request $request, Facture $facture)
    {
        $user = $this->getCurrentUser();
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO', 'STORE_ADMIN'])) {
            return back()->withErrors(['error' => 'Action non autorisée.']);
        }

        // Cloisonnement : interdit d'agir sur la facture d'une autre entité/store
        $this->authorizeView($facture);

        if (!in_array($facture->statut, ['BROUILLON', 'EMISE'])) {
            return back()->withErrors(['error' => 'Seules les factures en brouillon ou émise peuvent être marquées payées.']);
        }

        $this->service->marquerPayee($facture, $user);

        return back()->with('success', "Facture {$facture->numero} marquée comme payée.");
    }

    /**
     * Annuler une facture (crée un avoir)
     */
    public function cancel(Request $request, Facture $facture)
    {
        $user = $this->getCurrentUser();
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO', 'STORE_ADMIN'])) {
            return back()->withErrors(['error' => 'Action non autorisée.']);
        }

        // Cloisonnement : interdit d'annuler la facture d'une autre entité/store
        $this->authorizeView($facture);

        $request->validate(['raison' => ['required', 'string']]);

        $avoir = $this->service->annulerFacture($facture, $user, $request->raison);

        return redirect()->route('factures.show', $avoir)
            ->with('success', "Facture {$facture->numero} annulée. Avoir généré : {$avoir->numero}.");
    }

    /**
     * Supprimer une facture (seulement si BROUILLON)
     */
    public function destroy(Facture $facture)
    {
        // Cette action n'avait AUCUN contrôle : ni rôle, ni appartenance. Un
        // compte du guard "store" pouvait supprimer le brouillon de n'importe
        // quel store en itérant l'id d'URL.
        $user = $this->getCurrentUser();
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO', 'STORE_ADMIN'])) {
            return back()->withErrors(['error' => 'Action non autorisée.']);
        }

        $this->authorizeView($facture);

        if ($facture->statut !== 'BROUILLON') {
            return back()->withErrors(['error' => 'Seules les factures en brouillon peuvent être supprimées.']);
        }

        $facture->delete();

        return redirect()->route('factures.index')->with('success', "Facture {$facture->numero} supprimée.");
    }

    /**
     * Historique des factures d'une boulangerie
     * PROTECTION : les boutiques ne voient que leurs propres factures
     */
    public function boutiqueHistory(Entity $boutique)
    {
        if ($boutique->type !== 'BOULANGERIE') {
            abort(404);
        }

        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // Autorisation : boutiques et Store Admin ne voient que leurs propres factures
        if (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'STORE_ADMIN']) && $boutique->id !== $entityId) {
            abort(403, 'Accès non autorisé à cette boutique.');
        }

        $factures = Facture::with(['lignes.product', 'entity'])
            ->where('boulangerie_id', $boutique->id)
            ->orderByDesc('date_fin')
            ->paginate(20);

        return Inertia::render('Factures/BoutiqueHistory', [
            'boutique' => $boutique,
            'factures' => $factures,
        ]);
    }

    // ========================================
    // HELPERS
    // ========================================

    /**
     * Vérifie que l'utilisateur peut voir cette facture
     */
    private function authorizeView(Facture $facture): void
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // Accès global : ADMIN interne (guard "web") uniquement — jamais un
        // Store Admin, qui reste cloisonné à son entité.
        if ($this->hasGlobalEntityAccess()) {
            return;
        }

        // RESP_LABO : factures de son labo
        if ($user->role === 'RESP_LABO' && $facture->entity_id === $entityId) {
            return;
        }

        // Boutique et Store Admin : factures qui leur sont destinées
        if (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'STORE_ADMIN']) && $facture->boulangerie_id === $entityId) {
            return;
        }

        abort(403, 'Accès non autorisé à cette facture.');
    }

    /**
     * Devine la période selon le type demandé
     */
    private function guessPeriod(string $type, ?string $date = null): array
    {
        $base = $date ? \Carbon\Carbon::parse($date) : \Carbon\Carbon::now();

        return match ($type) {
            'SEMAINE' => [
                'debut' => $base->copy()->startOfWeek()->toDateString(),
                'fin'   => $base->copy()->endOfWeek()->toDateString(),
            ],
            'MOIS' => [
                'debut' => $base->copy()->startOfMonth()->toDateString(),
                'fin'   => $base->copy()->endOfMonth()->toDateString(),
            ],
            'ANNEE' => [
                'debut' => $base->copy()->startOfYear()->toDateString(),
                'fin'   => $base->copy()->endOfYear()->toDateString(),
            ],
            default => [
                'debut' => $base->toDateString(),
                'fin'   => $base->toDateString(),
            ],
        };
    }
}
