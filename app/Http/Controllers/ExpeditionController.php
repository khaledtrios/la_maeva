<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use App\Models\Expedition;
use App\Models\Product;
use App\Models\ExpeditionLine;
use App\Models\Production;
use App\Services\ExpeditionService;
use App\Services\ProductionAllocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ExpeditionController extends Controller
{
    /**
     * Liste des expéditions
     */
    public function index()
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        $expeditions = Expedition::with(['entity', 'boulangerie', 'lines.product', 'creator', 'reception'])
            ->when($user->role !== 'ADMIN' && $user->role !== 'DIRECTION', function ($q) use ($entityId) {
                $q->where('entity_id', $entityId);
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        $boulangeries = Entity::where('type', 'BOULANGERIE')->orderBy('nom')->get();

        // Produits disponibles (stock > 0) avec leur quantité disponible
        $availableProducts = $this->getAvailableProducts($entityId);

        return Inertia::render('Expeditions/Index', [
            'expeditions'      => $expeditions,
            'boulangeries'     => $boulangeries,
            'availableProducts' => $availableProducts,
        ]);
    }

    /**
     * API: retourne les produits disponibles (stock > 0) pour le labo connecté
     * Chaque produit apparaît une seule fois avec sa quantité disponible totale
     * Format attendu par le frontend:
     *   [{ id, nom, category: {nom}, prix_vente, dlc, disponible: number }]
     */
    public function getAvailableProducts(int $entityId)
    {
        $user = $this->getCurrentUser();

        // Labo uniquement (+ Store Admin)
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO', 'EMPLOYE_LABO', 'STORE_ADMIN'])) {
            abort(403);
        }

        // Récupérer UNIQUEMENT les productions d'aujourd'hui
        $today = now()->toDateString();
        $productions = Production::where('entity_id', $entityId)
            ->whereDate('date', '=', $today)
            ->with('product.category')
            ->get();

        // Grouper par produit
        $disponibleParProduit = [];
        foreach ($productions as $production) {
            $pid = $production->product_id;
            if (!isset($disponibleParProduit[$pid])) {
                $disponibleParProduit[$pid] = [
                    'product' => $production->product,
                    'total_produit' => 0,
                    'total_expedie' => 0,
                ];
            }
            $disponibleParProduit[$pid]['total_produit'] += $production->quantite - $production->quantite_pertes;
        }

        // Soustraire toutes les expedition_lines d'aujourd'hui qui ont une production_id
        $today = now()->toDateString();
        $expediees = ExpeditionLine::whereHas('expedition', function($q) use ($entityId, $today) {
                $q->where('entity_id', $entityId)
                  ->whereDate('date', '=', $today);
            })
            ->whereNotNull('production_id')
            ->select('product_id', DB::raw('SUM(quantite) as total'))
            ->groupBy('product_id')
            ->get();

        foreach ($expediees as $exp) {
            if (isset($disponibleParProduit[$exp->product_id])) {
                $disponibleParProduit[$exp->product_id]['total_expedie'] = $exp->total;
            }
        }

        // Filtrer et formater
        $result = [];
        foreach ($disponibleParProduit as $data) {
            $disponible = $data['total_produit'] - $data['total_expedie'];
            if ($disponible > 0) {
                $p = $data['product'];
                $result[] = [
                    'id' => $p->id,
                    'nom' => $p->nom,
                    'category' => ['nom' => $p->category?->nom ?? '-'],
                    'prix_vente' => (float)$p->prix_vente,
                    'dlc' => (int)$p->dlc,
                    'disponible' => $disponible,
                ];
            }
        }

        // Trier par nom
        usort($result, fn($a, $b) => strcmp($a['nom'], $b['nom']));

        return $result;
    }

    /**
     * Détail d'une expédition (BL)
     */
    public function show(Expedition $expedition)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // Accès global : ADMIN + DIRECTION (guard "web") uniquement. Le Store
        // Admin reste cloisonné à l'entité de son store.
        $seesAllEntities = !$this->isStoreAdmin()
            && in_array($user->role, ['ADMIN', 'DIRECTION']);

        if (!$seesAllEntities && $expedition->entity_id !== $entityId) {
            abort(403, 'Accès non autorisé.');
        }

        $expedition->load([
            'entity',
            'boulangerie',
            'lines.product.category',
            'creator',
            'reception.lines.product',
        ]);

        return Inertia::render('Expeditions/Show', [
            'expedition' => $expedition,
        ]);
    }

    /**
     * Créer une expédition avec allocation FIFO des stocks.
     * Chaque ligne d'expédition est liée à une production spécifique (FIFO).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'boulangerie_id' => ['required', 'integer', 'exists:entities,id'],
            'date'           => ['required', 'date'],
            'lines'          => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'lines.*.quantite'   => ['required', 'integer', 'min:1'],
        ]);

        $user = $this->getCurrentUser();
        $laboEntityId = $this->getCurrentEntityId();

        // Intégrité + cloisonnement : `exists:entities,id` ne garantit ni le type
        // ni la cohérence de la destination. On vérifie que la cible est bien une
        // BOULANGERIE, distincte de l'entité émettrice.
        // NB : restreindre en plus aux boulangeries rattachées au store nécessite
        // un lien store -> boulangeries autorisées, absent du schéma actuel.
        $boulangerie = Entity::find($validated['boulangerie_id']);

        if (!$boulangerie || $boulangerie->type !== 'BOULANGERIE') {
            throw ValidationException::withMessages([
                'boulangerie_id' => 'La destination doit être une boulangerie valide.',
            ]);
        }

        if ((int) $validated['boulangerie_id'] === (int) $laboEntityId) {
            throw ValidationException::withMessages([
                'boulangerie_id' => 'Impossible d\'expédier vers votre propre entité.',
            ]);
        }

        // Valider la disponibilité du stock pour chaque ligne avant la transaction
        foreach ($validated['lines'] as $index => $ligne) {
            $productId = $ligne['product_id'];
            $quantiteDemandee = $ligne['quantite'];
            $disponible = ProductionAllocationService::getAvailableQuantity($productId, $laboEntityId, $validated['date']);
            if ($quantiteDemandee > $disponible) {
                $product = Product::find($productId);
                $nomProduit = $product?->nom ?? "Produit #{$productId}";
                throw ValidationException::withMessages([
                    "lines.{$index}.quantite" => "Stock insuffisant pour {$nomProduit}. Disponible: {$disponible}, demandé: {$quantiteDemandee}",
                ]);
            }
        }

        $lines = $validated['lines'];

        DB::transaction(function () use ($validated, $user, $laboEntityId) {
            $expedition = Expedition::create([
                'entity_id'      => $laboEntityId,
                'boulangerie_id' => $validated['boulangerie_id'],
                'date'           => $validated['date'],
                'statut'         => 'BROUILLON',
                'created_by'     => $user->id,
            ]);

            foreach ($validated['lines'] as $ligne) {
                $productId = $ligne['product_id'];
                $quantiteDemandee = $ligne['quantite'];

                // Allouer selon FIFO (maintenant sûr car déjà vérifié)
                $allocations = ProductionAllocationService::allocateFifo(
                    $productId,
                    $laboEntityId,
                    $quantiteDemandee,
                    $validated['date']
                );

                // Créer les lignes d'expédition pour chaque allocation
                foreach ($allocations as $alloc) {
                    ExpeditionLine::create([
                        'expedition_id'   => $expedition->id,
                        'product_id'      => $productId,
                        'production_id'   => $alloc['production_id'],
                        'date_production' => $alloc['date_production'],
                        'quantite'        => $alloc['quantite'],
                        'dlc'             => $alloc['dlc'],
                        'lot_reference'   => $alloc['lot_reference'],
                    ]);
                }
            }
        });

        $boulangerieNom = $validated['boulangerie_id'] ? Entity::find($validated['boulangerie_id'])?->nom : 'Boulangerie';
        return back()->with('success', "Expédition vers « {$boulangerieNom} » créée avec " . count($lines) . " produit(s).");
    }

    /**
     * Mettre à jour le statut d'une expédition
     */
    public function updateStatus(Request $request, Expedition $expedition)
    {
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

        // Vérifier ownership (ADMIN/DIRECTION peut tout faire, autres doivent vérifier leur entity_id)
        if (!in_array($user->role, ['ADMIN', 'DIRECTION']) && $expedition->entity_id !== $entityId) {
            abort(403);
        }

        $validated = $request->validate([
            'statut' => ['required', 'in:ENVOYEE,RECUE'],
        ]);

        DB::transaction(function () use ($expedition, $validated) {
            $expedition->update(['statut' => $validated['statut']]);

            // Si passage à ENVOYEE, créer réception automatiquement
            if ($validated['statut'] === 'ENVOYEE' && !$expedition->reception) {
                ExpeditionService::createReceptionFromExpedition($expedition);
            }
        });

        $statutLabel = $validated['statut'] === 'ENVOYEE' ? 'envoyée' : 'marquée reçue';
        return back()->with('success', "Expédition #{$expedition->id} {$statutLabel}.");
    }
}