<?php

namespace App\Http\Controllers;

use App\Models\CommandeUrgente;
use App\Models\CommandeUrgenteLine;
use App\Models\Product;
use App\Models\Entity;
use App\Models\User;
use App\Services\CommandeUrgenteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class CommandeUrgenteController extends Controller
{
    /**
     * Liste des commandes urgentes (fil_tree par rôle)
     *
     * Boutique : ses propres commandes
     * Labo : toutes les commandes des boutiques
     * Admin/Direction : tout
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = CommandeUrgente::with([
            'entity',
            'creator',
            'lines.product',
        ]);

        // Filtrage par rôle
        if (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE'])) {
            // Boutique : voit seulement ses propres commandes
            $query->where('entity_id', $user->entity_id);
        } elseif (in_array($user->role, ['RESP_LABO', 'EMPLOYE_LABO'])) {
            // Labo : voit toutes les commandes sauf les siennes
            $query->where('entity_id', '!=', $user->entity_id);
        }
        // ADMIN et DIRECTION voient tout

        // Filtres
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->priorite) {
            $query->where('priorite', $request->priorite);
        }

        $commandes = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        // Stats
        $stats = [
            'total' => $query->count(),
            'en_attente' => CommandeUrgente::where('statut', 'ENVOYEE')->count(),
            'prise_en_charge' => CommandeUrgente::where('statut', 'PRISE_EN_CHARGE')->count(),
            'expediees' => CommandeUrgente::where('statut', 'EXPEDIEE')->count(),
        ];

        // Liste des produits pour le formulaire (pour la création BL)
        $products = Product::with('category')->orderBy('nom')->get();

        return Inertia::render('CommandesUrgentes/Index', [
            'commandes' => $commandes,
            'stats' => $stats,
            'products' => $products,
            'filters' => [
                'statut' => $request->statut,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'priorite' => $request->priorite,
            ],
            'statuts' => CommandeUrgente::STATUT_LABELS,
        ]);
    }

    /**
     * Créer une commande urgente (boutique)
     */
    /**
     * Afficher le formulaire de création (boutique)
     */
    public function create()
    {
        $user = Auth::user();

        // Seules les boutiques peuvent accéder
        if (!in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN'])) {
            abort(403, 'Action non autorisée.');
        }

        // Liste des produits avec leur catégorie
        $products = Product::with('category')->orderBy('nom')->get();

        return Inertia::render('CommandesUrgentes/Create', [
            'products' => $products,
        ]);
    }

    /**
     * Créer une commande urgente (boutique)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Seules les boutiques peuvent créer
        if (!in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN'])) {
            abort(403, 'Action non autorisée.');
        }

        $validated = $request->validate([
            'date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'priorite' => 'nullable|integer|min:1|max:5',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|integer|exists:products,id',
            'lines.*.quantite' => 'required|integer|min:1',
        ]);

        $commande = CommandeUrgenteService::create([
            'entity_id'  => $user->entity_id,
            'date'       => $validated['date'] ?? now()->toDateString(),
            'notes'      => $validated['notes'] ?? null,
            'priorite'   => $validated['priorite'] ?? 1,
            'lines'      => $validated['lines'],
            'created_by' => $user->id,
        ]);

        return redirect()
            ->route('commandes-urgentes.index')
            ->with('success', "Commande urgente créée avec " . count($validated['lines']) . " produit(s).");
    }

    /**
     * Prendre en charge une commande (labo)
     */
    public function take(int $id)
    {
        $user = Auth::user();

        // Seul le labo peut prendre en charge
        if (!in_array($user->role, ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'])) {
            abort(403, 'Action non autorisée.');
        }

        try {
            CommandeUrgenteService::takeOwnership($id, $user);
            return back()->with('success', "Commande #{$id} prise en charge par le labo.");
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Mettre à jour le statut d'une commande
     */
    public function updateStatus(Request $request, int $id)
    {
        $user = Auth::user();

        // Seul le labo (ou admin) peut changer le statut
        if (!in_array($user->role, ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'])) {
            abort(403, 'Action non autorisée.');
        }

        $validated = $request->validate([
            'statut' => 'required|string|in:ENVOYEE,PRISE_EN_CHARGE,EXPEDIEE',
        ]);

        try {
            CommandeUrgenteService::updateStatus($id, $validated['statut']);
            return back()->with('success', "Statut de la commande #{$id} mis à jour en « {$validated['statut']} ».");
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Créer un BL (expedition) directement depuis une commande urgente
     * Pas de formulaire intermédiaire : les produits de la commande sont
     * automatiquement transférés dans le BL.
     */
    public function createBl(int $commandeId)
    {
        $user = Auth::user();

        // Seul le labo peut créer un BL
        if (!in_array($user->role, ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'])) {
            abort(403, 'Action non autorisée.');
        }

        $commande = CommandeUrgente::with(['entity', 'lines.product'])->findOrFail($commandeId);

        // Vérifier que la commande appartient à une boutique (pas au labo)
        if ($commande->entity_id === $user->entity_id) {
            abort(403, 'Vous ne pouvez pas créer un BL pour vos propres commandes.');
        }

        try {
            // Créer le BL automatiquement via le service
            $expedition = CommandeUrgenteService::createBlFromCommande($commandeId, $user->id);

            // Rediriger vers la page Show du BL créé
            return redirect()
                ->route('expeditions.show', $expedition->id)
                ->with('success', "Bon de livraison créé avec succès pour la commande #{$commandeId}.");
        } catch (ValidationException $e) {
            // Retourner vers la page Index avec erreur formatée
            $errors = $e->errors();
            $message = collect($errors)->flatten()->first() ?: 'Stock insuffisant pour cette commande.';
            return back()->with('error', $message);
        } catch (\Exception $e) {
            // Autres erreurs inattendues
            return back()->with('error', 'Erreur lors de la création du BL : ' . $e->getMessage());
        }
    }

    /**
     * Afficher le détail d'une commande urgente
     */
    public function show(int $id)
    {
        $user = Auth::user();

        $commande = CommandeUrgente::with([
            'entity',
            'creator',
            'lines.product.category',
        ])->findOrFail($id);

        // Vérification d'accès par rôle
        if (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE'])) {
            // Boutique : ne voit que ses propres commandes
            if ($commande->entity_id !== $user->entity_id) {
                abort(403, 'Accès non autorisé.');
            }
        }
        // Labo : voit toutes les commandes des boutiques (pas de restriction)
        // Admin/Direction : voient tout

        return Inertia::render('CommandesUrgentes/Show', [
            'commande' => $commande,
        ]);
    }
}
