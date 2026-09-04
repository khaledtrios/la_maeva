<?php

namespace App\Http\Controllers;

use App\Models\{
    ProductReturn,
    ReturnLine,
    ReturnPhoto,
    Reception,
    ReceptionLine,
    Expedition,
    ExpeditionLine,
    Product,
    Entity,
    StockMovement,
    VenteJour,
    User
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReturnController extends Controller
{
    // ============================================
    // LISTE DES RETOURS
    // ============================================

    public function index(Request $request)
    {
        $user = $this->getCurrentUser();
        $query = ProductReturn::with([
            'entity',
            'laboEntity',
            'product',
            'creator',
            'receiver',
            'processor',
            'lines.product',
            'lines.photos',
        ]);

        switch ($user->role) {
            case 'RESP_BOUTIQUE':
            case 'EMPLOYE_VENTE':
            case 'STORE_ADMIN':
                $query->where('entity_id', $this->getCurrentEntityId());
                break;
            case 'RESP_LABO':
                $query->where('labo_entity_id', $this->getCurrentEntityId())
                    ->where('status', '!=', 'BROUILLON'); // Le labo ne voit pas les brouillons
                break;
        }

        if ($request->status)    $query->where('status', $request->status);
        if ($request->cause)     $query->where('cause', $request->cause);
        if ($request->date_from) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to)   $query->whereDate('created_at', '<=', $request->date_to);

        $returns = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('Returns/Index', [
            'returns'    => $returns,
            'filters'    => $request->only(['status', 'cause', 'date_from', 'date_to']),
            'statuses'   => [
                'BROUILLON'       => 'Brouillon',
                'ENVOYEE'         => 'Envoyée',
                'RECEUE_PAR_LABO' => 'Reçue par labo',
                'TRAITEE'         => 'Traitée',
                'CLOTUREE'        => 'Clôturée',
                'REJETEE'         => 'Rejetée',
            ],
            'causes'     => [
                'DEFECTUEUX'     => 'Défectueux',
                'INVENDU_EXPIRE' => 'Invendu (DLC expirée)',
            ],
            // STORE_ADMIN retiré : create() et store() (comme canView()) ne
            // l'autorisent pas -> le bouton menait à un 403. On masque plutôt que
            // d'élargir les droits. DÉCISION MÉTIER EN ATTENTE : si le Store Admin
            // doit pouvoir créer/consulter ses retours, l'ajouter dans create(),
            // store() et canView() (le scoping entity_id de index() est déjà bon).
            'canCreate'  => in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN']),
            'canConfirm' => in_array($user->role, ['ADMIN', 'RESP_LABO']),
            'canProcess' => in_array($user->role, ['ADMIN', 'RESP_LABO']),
        ]);
    }

    // ============================================-
    // CRÉATION
    // ============================================

    public function create(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN'])) {
            abort(403);
        }

        $receptionId = $request->query('reception_id');
        $reception   = null;

        if ($receptionId) {
            $reception = Reception::with([
                'expedition.entity',
                'lines.expeditionLine',
                'lines.product',
            ])->findOrFail($receptionId);

            if ($reception->entity_id !== $user->entity_id) abort(403);
            if ($reception->statut !== 'CONFIRMEE') {
                return back()->with('error', 'Seules les réceptions confirmées peuvent générer un retour.');
            }
        }

        $receptions = Reception::with([
            'expedition.entity',
            'lines.expeditionLine',
            'lines.product',
        ])
            ->where('entity_id', $user->entity_id)
            ->where('statut', 'CONFIRMEE')
            ->where(function ($q) use ($receptionId) {
                $q->whereDate('date', '>=', now()->subDays(30));
                // Toujours inclure la réception preselected même si > 30 jours
                if ($receptionId) {
                    $q->orWhere('id', $receptionId);
                }
            })
            ->orderByDesc('date')
            ->get();

        // Produits en stock expirés (DLC <= aujourd'hui) pour la boutique
        $expiredStock = \App\Models\StockBalance::with('product.category')
            ->where('entity_id', $user->entity_id)
            ->where('product_id', '!=', null)
            ->whereNotNull('dlc')
            ->where('dlc', '<=', now()->toDateString())
            ->where('quantite', '>', 0)
            ->get()
            ->map(function ($balance) {
                return [
                    'balance_id' => $balance->id, // unique identifier for stock balance batch
                    'product_id' => $balance->product_id,
                    'nom' => $balance->product->nom,
                    'category' => $balance->product->category,
                    'code' => $balance->product->code,
                    'quantite' => (int) $balance->quantite, // cast to integer
                    'dlc' => $balance->dlc,
                    'lot_reference' => $balance->lot_number ?? null,
                ];
            });

        return Inertia::render('Returns/Create', [
            'reception'   => $reception,
            'receptions'  => $receptions,
            'products'    => Product::with('category')->orderBy('nom')->get(['id', 'nom', 'code', 'category_id']),
            'expiredStock' => $expiredStock,
        ]);
    }

    /**
     * Stocker un retour.
     *
     * Le frontend envoie :
     *   - reception_id (nullable)
     *   - notes, bl_number (optionnels)
     *   - lines[] : chaque ligne a product_id, quantite_attendue, quantite_retournee,
     *               cause, dlc, lot_reference, notes, reception_line_id (nullable),
     *               origine ('auto'|'manuel')
     *
     * Le type est dérivé ici : si reception_id → RECEPTION, sinon FIN_COMMERCE.
     * L'origine globale est calculée depuis les lignes.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN'])) {
            abort(403);
        }

        $validated = $request->validate([
            'reception_id'               => ['nullable', 'integer', 'exists:receptions,id'],
            'bl_number'                  => ['nullable', 'string', 'max:50'],
            'notes'                      => ['nullable', 'string', 'max:1000'],
            'lines'                      => ['required', 'array', 'min:1'],
            'lines.*.product_id'         => ['required', 'integer', 'exists:products,id'],
            'lines.*.quantite_attendue'  => ['nullable', 'integer', 'min:0'], // optionnel pour les lignes manuelles
            'lines.*.quantite_retournee' => ['required', 'integer', 'min:1'],
            'lines.*.cause'              => ['required', 'in:DEFECTUEUX,INVENDU_EXPIRE,AUTRE'],
            'lines.*.dlc'                => ['nullable', 'date'],
            'lines.*.lot_reference'      => ['nullable', 'string', 'max:100'],
            'lines.*.notes'              => ['nullable', 'string', 'max:500'],
            'lines.*.reception_line_id'  => ['nullable', 'integer', 'exists:reception_lines,id'],
            'lines.*.origine'            => ['nullable', 'in:auto,manuel'],
            'photos'                     => ['nullable', 'array'],
            'photos.*'                   => ['file', 'image', 'max:5120'],
        ]);

        return DB::transaction(function () use ($validated, $request, $user) {
            $entityId = $user->entity_id;

            // Dériver le type depuis la présence d'une réception
            $type = isset($validated['reception_id']) && $validated['reception_id']
                ? 'RECEPTION'
                : 'FIN_COMMERCE';

            // Calculer l'origine globale depuis les lignes
            $origines = collect($validated['lines'])->pluck('origine')->unique()->filter()->values();
            if ($origines->count() >= 2 || $origines->contains('auto') && $origines->contains('manuel')) {
                $origineGlobale = 'auto+manuel';
            } elseif ($origines->contains('auto')) {
                $origineGlobale = 'auto';
            } else {
                $origineGlobale = 'manuel';
            }

            // Trouver le labo destinataire
            $laboEntityId = null;
            if ($type === 'RECEPTION' && isset($validated['reception_id'])) {
                $reception = Reception::with('expedition')->findOrFail($validated['reception_id']);
                if ($reception->entity_id !== $entityId) abort(403);
                $laboEntityId = $reception->expedition?->entity_id ?? null;
            }
            if (!$laboEntityId) {
                // Chercher un labo par défaut
                $labo = Entity::where('type', 'LABO')->first();
                if (!$labo) {
                    return back()->with('error', 'Aucun laboratoire configuré dans le système. Contactez l\'administrateur.');
                }
                $laboEntityId = $labo->id;
            }

            // Vérifier que le labo existe encore (pas orphelin)
            if (!Entity::find($laboEntityId)) {
                return back()->with('error', 'Le laboratoire destinataire n\'existe plus. Vérifiez la configuration.');
            }

            // Cause principale = cause de la première ligne (ou la plus fréquente)
            $causePrincipale = collect($validated['lines'])
                ->groupBy('cause')
                ->sortByDesc(fn($g) => $g->count())
                ->keys()
                ->first() ?? 'DEFECTUEUX';

            // Produit principal = premier produit
            $firstLine       = $validated['lines'][0];
            $productIdGlobal = $firstLine['product_id'];

            // Calculer quantite_attendue globale : si null, on utilise quantite_retournee
            $qteAttendue = 0;
            foreach ($validated['lines'] as $ligne) {
                $qteAttendue += ($ligne['quantite_attendue'] ?? $ligne['quantite_retournee']);
            }
            $qteRetournee = collect($validated['lines'])->sum('quantite_retournee');

            // Ligne d'expédition principale (première ligne avec reception_line_id)
            $expeditionLineId = null;
            foreach ($validated['lines'] as $l) {
                if (!empty($l['reception_line_id'])) {
                    $rl = ReceptionLine::find($l['reception_line_id']);
                    if ($rl && $rl->expedition_line_id) {
                        $expeditionLineId = $rl->expedition_line_id;
                        break;
                    }
                }
            }

            $reference = ProductReturn::generateReference();

            $productReturn = ProductReturn::create([
                'reference'          => $reference,
                'type'               => $type,
                'origine'            => $origineGlobale,
                'reception_id'       => $validated['reception_id'] ?? null,
                'expedition_line_id' => $expeditionLineId,
                'entity_id'          => $entityId,
                'labo_entity_id'     => $laboEntityId,
                'cause'              => $causePrincipale,
                'bl_number'          => $validated['bl_number'] ?? null,
                'product_id'         => $productIdGlobal,
                'quantite_attendue'  => $qteAttendue,
                'quantite_retournee' => $qteRetournee,
                'notes'              => $validated['notes'] ?? null,
                'status'             => 'BROUILLON',
                'created_by'         => $user->id,
            ]);

            // Créer les lignes + déduire le stock boutique pour chaque ligne
            foreach ($validated['lines'] as $ligneData) {
                $returnLine = ReturnLine::create([
                    'return_id'          => $productReturn->id,
                    'reception_line_id'  => $ligneData['reception_line_id'] ?? null,
                    'product_id'         => $ligneData['product_id'],
                    'quantite_attendue'  => $ligneData['quantite_attendue'] ?? $ligneData['quantite_retournee'],
                    'quantite_retournee' => $ligneData['quantite_retournee'],
                    'dlc'                => $ligneData['dlc'] ?? null,
                    'lot_reference'      => $ligneData['lot_reference'] ?? null,
                    'cause'              => $ligneData['cause'],
                    'notes'              => $ligneData['notes'] ?? null,
                ]);

                // Déduire du stock boutique
                $this->deduireStockBoutique(
                    entityId: $entityId,
                    productId: $ligneData['product_id'],
                    quantite: $ligneData['quantite_retournee'],
                    dlc: $ligneData['dlc'] ?? null,
                    lotReference: $ligneData['lot_reference'] ?? null,
                    returnId: $productReturn->id,
                    returnLineId: $returnLine->id,
                    userId: $user->id,
                    reference: "RETOUR {$reference}",
                );
            }

            // Photos
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photoFile) {
                    $path = $photoFile->store('return_photos', 'public');
                    ReturnPhoto::create([
                        'return_id'      => $productReturn->id,
                        'return_line_id' => null,
                        'photo_path'     => $path,
                        'uploaded_by'    => $user->id,
                    ]);
                }
            }

            return redirect()
                ->route('returns.show', $productReturn)
                ->with('success', "Retour « {$reference} » créé — {$qteRetournee} unité(s) à retourner.");
        });
    }

    // ============================================
    // AFFICHER UN RETOUR
    // ============================================

    public function show(ProductReturn $productReturn)
    {
        $user = Auth::user();
        if (!$this->canView($productReturn, $user)) abort(403);

        $productReturn->load([
            'entity',
            'laboEntity',
            'product.category',
            'expeditionLine.expedition',
            'expeditionLine.product',
            'lines.product',
            'lines.photos',
            'creator',
            'receiver',
            'processor',
            'photos',
        ]);

        return Inertia::render('Returns/Show', [
            'return'        => $productReturn,
            'canSend'       => in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN']) && $productReturn->status === 'BROUILLON',
            'canConfirm'    => in_array($user->role, ['ADMIN', 'RESP_LABO']) && $productReturn->status === 'ENVOYEE',
            'canReject'     => in_array($user->role, ['ADMIN', 'RESP_LABO']) && in_array($productReturn->status, ['ENVOYEE', 'RECEUE_PAR_LABO']),
            'canProcess'    => in_array($user->role, ['ADMIN', 'RESP_LABO']) && $productReturn->status === 'RECEUE_PAR_LABO',
            'canCancel'     => in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN']) && $productReturn->status === 'BROUILLON',
            'canAddPhotos'  => in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN', 'RESP_LABO']),
            'canEdit'       => $productReturn->status === 'BROUILLON' && in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN']) && $productReturn->created_by === $user->id,
        ]);
    }

    public function edit(ProductReturn $productReturn)
    {
        $user = Auth::user();

        // Seul le créateur peut éditer, et seulement si BROUILLON
        if ($productReturn->status !== 'BROUILLON') {
            return back()->with('error', 'Seuls les retours en brouillon peuvent être modifiés.');
        }
        if ($productReturn->created_by !== $user->id && !in_array($user->role, ['ADMIN'])) {
            abort(403, 'Vous ne pouvez modifier que vos propres retours.');
        }

        $productReturn->load([
            'lines.product',
            'lines.photos',
        ]);

        // Produits en stock expirés (DLC <= aujourd'hui) pour la boutique
        $expiredStock = \App\Models\StockBalance::with('product.category')
            ->where('entity_id', $user->entity_id)
            ->where('product_id', '!=', null)
            ->whereNotNull('dlc')
            ->where('dlc', '<=', now()->toDateString())
            ->where('quantite', '>', 0)
            ->get()
            ->map(function ($balance) {
                return [
                    'balance_id'    => $balance->id,
                    'product_id'    => $balance->product_id,
                    'nom'           => $balance->product->nom,
                    'category'      => $balance->product->category,
                    'code'          => $balance->product->code,
                    'quantite'      => (int) $balance->quantite,
                    'dlc'           => $balance->dlc,
                    'lot_reference' => $balance->lot_number ?? null,
                ];
            });

        return Inertia::render('Returns/Edit', [
            'return'      => $productReturn,
            'products'    => Product::with('category')->orderBy('nom')->get(['id', 'nom', 'code', 'category_id']),
            'expiredStock' => $expiredStock,
        ]);
    }

    public function update(Request $request, ProductReturn $productReturn)
    {
        $user = Auth::user();

        // Vérifications
        if ($productReturn->status !== 'BROUILLON') {
            return back()->with('error', 'Seuls les retours en brouillon peuvent être modifiés.');
        }
        if ($productReturn->created_by !== $user->id && !in_array($user->role, ['ADMIN'])) {
            abort(403, 'Vous ne pouvez modifier que vos propres retours.');
        }

        $validated = $request->validate([
            'lines'                      => ['required', 'array', 'min:1'],
            'lines.*.product_id'         => ['required', 'integer', 'exists:products,id'],
            'lines.*.quantite_attendue'  => ['nullable', 'integer', 'min:0'],
            'lines.*.quantite_retournee' => ['required', 'integer', 'min:1'],
            'lines.*.cause'              => ['required', 'in:DEFECTUEUX,INVENDU_EXPIRE,AUTRE'],
            'lines.*.dlc'                => ['nullable', 'date'],
            'lines.*.lot_reference'      => ['nullable', 'string', 'max:100'],
            'lines.*.notes'              => ['nullable', 'string', 'max:500'],
            'lines.*.reception_line_id'  => ['nullable', 'integer', 'exists:reception_lines,id'],
            'bl_number'                  => ['nullable', 'string', 'max:50'],
            'notes'                      => ['nullable', 'string', 'max:1000'],
        ]);

        // Cast integer values
        foreach ($validated['lines'] as &$line) {
            $line['quantite_attendue'] = isset($line['quantite_attendue']) ? (int) $line['quantite_attendue'] : null;
            $line['quantite_retournee'] = (int) $line['quantite_retournee'];
        }

        return DB::transaction(function () use ($validated, $request, $productReturn, $user) {
            $entityId = $user->entity_id;

            // 1. Restaurer le stock pour toutes les anciennes lignes
            $productReturn->load('lines');
            foreach ($productReturn->lines as $oldLine) {
                $this->restaurerStockBoutique(
                    entityId: $entityId,
                    productId: $oldLine->product_id,
                    quantite: $oldLine->quantite_retournee,
                    dlc: $oldLine->dlc ? $oldLine->dlc->toDateString() : null,
                    lotReference: $oldLine->lot_reference,
                    returnId: $productReturn->id,
                    userId: $user->id,
                    reference: "EDIT RETOUR {$productReturn->reference} (restauration)",
                );
            }

            // 2. Recalculer les totaux du header depuis les nouvelles lignes
            $newQteAttendue  = 0;
            foreach ($validated['lines'] as $ligne) {
                $newQteAttendue += ($ligne['quantite_attendue'] ?? $ligne['quantite_retournee']);
            }
            $newQteRetournee = collect($validated['lines'])->sum('quantite_retournee');

            $newCause = collect($validated['lines'])
                ->groupBy('cause')
                ->sortByDesc(fn($g) => $g->count())
                ->keys()
                ->first() ?? $productReturn->cause;

            $newProductId = $validated['lines'][0]['product_id'];

            // Mettre à jour les champs du header
            $productReturn->update([
                'bl_number'          => $validated['bl_number'] ?? null,
                'notes'              => $validated['notes'] ?? null,
                'quantite_attendue'  => $newQteAttendue,
                'quantite_retournee' => $newQteRetournee,
                'cause'              => $newCause,
                'product_id'         => $newProductId,
            ]);

            // 3. Supprimer les anciennes lignes
            ReturnLine::where('return_id', $productReturn->id)->delete();

            // 4. Re-créer les nouvelles lignes + déduire stock
            foreach ($validated['lines'] as $ligneData) {
                $returnLine = ReturnLine::create([
                    'return_id'          => $productReturn->id,
                    'reception_line_id'  => $ligneData['reception_line_id'] ?? null,
                    'product_id'         => $ligneData['product_id'],
                    'quantite_attendue'  => $ligneData['quantite_attendue'] ?? $ligneData['quantite_retournee'],
                    'quantite_retournee' => $ligneData['quantite_retournee'],
                    'dlc'                => $ligneData['dlc'] ?? null,
                    'lot_reference'      => $ligneData['lot_reference'] ?? null,
                    'cause'              => $ligneData['cause'],
                    'notes'              => $ligneData['notes'] ?? null,
                ]);

                $this->deduireStockBoutique(
                    entityId: $entityId,
                    productId: $ligneData['product_id'],
                    quantite: $ligneData['quantite_retournee'],
                    dlc: $ligneData['dlc'] ?? null,
                    lotReference: $ligneData['lot_reference'] ?? null,
                    returnId: $productReturn->id,
                    returnLineId: $returnLine->id,
                    userId: $user->id,
                    reference: "EDIT RETOUR {$productReturn->reference}",
                );
            }

            return redirect()->route('returns.show', $productReturn)
                ->with('success', 'Retour modifié avec succès — stock mis à jour.');
        });
    }

    // ============================================
    // WORKFLOW
    // ============================================

    public function send(Request $request, ProductReturn $productReturn)
    {
        $user = Auth::user();
        if ($productReturn->created_by !== $user->id && !in_array($user->role, ['ADMIN'])) abort(403);
        if ($productReturn->status !== 'BROUILLON') return back()->with('error', 'Seuls les brouillons peuvent être envoyés.');
        $productReturn->update(['status' => 'ENVOYEE']);
        return redirect()->route('returns.show', $productReturn)->with('success', "Retour {$productReturn->reference} envoyé au labo.");
    }

    public function confirm(Request $request, ProductReturn $productReturn)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO'])) abort(403);
        if ($productReturn->labo_entity_id !== $user->entity_id) abort(403);
        if (!$productReturn->canBeConfirmed()) return back()->with('error', 'Ce retour ne peut pas être confirmé.');

        $productReturn->update([
            'status'         => 'RECEUE_PAR_LABO',
            'labo_confirmed' => true,
            'confirmed_at'   => now(),
            'received_by'    => $user->id,
        ]);
        return back()->with('success', "Retour {$productReturn->reference} confirmé comme reçu.");
    }

    public function reject(Request $request, ProductReturn $productReturn)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO'])) abort(403);
        if ($productReturn->labo_entity_id !== $user->entity_id) abort(403);

        $validated = $request->validate(['rejection_reason' => ['required', 'string', 'max:1000']]);
        $productReturn->update([
            'status'          => 'REJETEE',
            'treatment_notes' => 'REJETÉ : ' . $validated['rejection_reason'],
        ]);
        return back()->with('success', "Retour {$productReturn->reference} rejeté.");
    }

    public function process(Request $request, ProductReturn $productReturn)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['ADMIN', 'RESP_LABO'])) abort(403);
        if ($productReturn->labo_entity_id !== $user->entity_id) abort(403);
        if (!$productReturn->canBeProcessed()) return back()->with('error', 'Ce retour ne peut être traité que s\'il est marqué comme reçu.');

        $validated = $request->validate([
            'treatment_action' => ['required', 'in:brule,jete,recyclage,retour_stock,autre'],
            'treatment_notes'  => ['nullable', 'string', 'max:1000'],
        ]);

        $productReturn->update([
            'status'           => 'TRAITEE',
            'treatment_action' => $validated['treatment_action'],
            'treatment_notes'  => $validated['treatment_notes'],
            'processed_by'     => $user->id,
            'processed_at'     => now(),
        ]);

        if ($validated['treatment_action'] !== 'retour_stock') {
            $this->createWasteMovement($productReturn, $user);
        }

        return back()->with('success', "Retour {$productReturn->reference} traité.");
    }

    private function createWasteMovement(ProductReturn $productReturn, User $user): void
    {
        $earliestDlc = $productReturn->lines->min('dlc') ?? now();
        StockMovement::create([
            'entity_id'     => $productReturn->labo_entity_id,
            'product_id'    => $productReturn->product_id,
            'type'          => 'WASTE',
            'quantite'      => -$productReturn->quantite_retournee,
            'dlc'           => $earliestDlc,
            'lot_number'    => "RET-{$productReturn->reference}",
            'provenance'    => 'product_return',
            'reference'     => "Retour {$productReturn->reference}",
            'notes'         => $productReturn->treatment_notes ?? $productReturn->getCauseLabelAttribute(),
            'created_by'    => $user->id,
            'movement_date' => now(),
            'return_id'     => $productReturn->id,
        ]);
    }

    // ============================================
    // PHOTOS
    // ============================================

    public function addPhoto(Request $request, ProductReturn $productReturn)
    {
        $user = Auth::user();
        if (!$this->canView($productReturn, $user)) abort(403);
        $request->validate([
            'photo'          => ['required', 'file', 'image', 'max:5120'],
            'return_line_id' => ['nullable', 'integer', 'exists:return_lines,id'],
        ]);
        $path = $request->file('photo')->store('return_photos', 'public');
        ReturnPhoto::create([
            'return_id'      => $productReturn->id,
            'return_line_id' => $request->return_line_id,
            'photo_path'     => $path,
            'uploaded_by'    => $user->id,
        ]);
        return back()->with('success', "Photo ajoutée.");
    }

    public function deletePhoto(ReturnPhoto $photo)
    {
        $user   = Auth::user();
        $return = $photo->productReturn;
        if (!$this->canView($return, $user)) abort(403);
        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();
        return back()->with('success', "Photo supprimée.");
    }

    // ============================================
    // ANNULER
    // ============================================

    public function cancel(ProductReturn $productReturn)
    {
        $user = Auth::user();
        if (!$productReturn->canBeCancelled()) return back()->with('error', 'Seuls les brouillons peuvent être annulés.');
        if ($productReturn->created_by !== $user->id && !in_array($user->role, ['ADMIN'])) abort(403);

        DB::transaction(function () use ($productReturn, $user) {
            // Remettre le stock boutique pour chaque ligne
            $productReturn->load('lines');
            foreach ($productReturn->lines as $line) {
                $this->restaurerStockBoutique(
                    entityId: $productReturn->entity_id,
                    productId: $line->product_id,
                    quantite: $line->quantite_retournee,
                    dlc: $line->dlc ? $line->dlc->toDateString() : null,
                    lotReference: $line->lot_reference,
                    returnId: $productReturn->id,
                    userId: $user->id,
                    reference: "ANNUL RETOUR {$productReturn->reference}",
                );
            }

            foreach ($productReturn->photos as $photo) {
                Storage::disk('public')->delete($photo->photo_path);
            }
            $productReturn->delete();
        });

        return redirect()->route('returns.index')->with('success', "Retour {$productReturn->reference} annulé — stock restauré.");
    }

    // ============================================
    // SAISIE 19H
    // ============================================

    public function saisir19h(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN'])) abort(403);

        $validated = $request->validate([
            'date'                => ['required', 'date'],
            'lines'               => ['required', 'array', 'min:1'],
            'lines.*.product_id'  => ['required', 'integer', 'exists:products,id'],
            'lines.*.dlc_produit' => ['required', 'date'],
            'lines.*.qte_reste'   => ['required', 'integer', 'min:0'],
            'lines.*.notes'       => ['nullable', 'string', 'max:500'],
        ]);

        $entityId       = $user->entity_id;
        $date           = $validated['date'];
        $laboId         = Entity::where('type', 'LABO')->value('id');
        $createdReturns = [];

        DB::transaction(function () use ($validated, $user, $entityId, $date, $laboId, &$createdReturns) {
            foreach ($validated['lines'] as $line) {
                $productId  = $line['product_id'];
                $dlc        = $line['dlc_produit'];
                $qteReste   = $line['qte_reste'];
                $dlcDate    = \Carbon\Carbon::parse($dlc);
                $saisieDate = \Carbon\Carbon::parse($date);
                $isExpired  = $dlcDate->lte($saisieDate);
                $vendableJ1 = $isExpired ? 0 : $qteReste;
                $perimee    = $isExpired ? $qteReste : 0;

                VenteJour::updateOrCreate(
                    ['entity_id' => $entityId, 'date' => $date, 'product_id' => $productId],
                    [
                        'qte_reste' => $qteReste,
                        'qte_vendue' => 0,
                        'qte_recue' => 0,
                        'dlc_produit' => $dlc,
                        'quantite_vendable_j1' => $vendableJ1,
                        'quantite_perimee' => $perimee
                    ]
                );

                if ($perimee > 0) {
                    $reference = ProductReturn::generateReference();
                    $ret = ProductReturn::create([
                        'reference'          => $reference,
                        'type'               => 'FIN_COMMERCE',
                        'origine'            => 'auto',
                        'entity_id'          => $entityId,
                        'labo_entity_id'     => $laboId,
                        'product_id'         => $productId,
                        'cause'              => 'INVENDU_EXPIRE',
                        'dlc_display'        => $dlc,
                        'quantite_attendue'  => $qteReste,
                        'quantite_retournee' => $perimee,
                        'notes'              => $line['notes'] ?? 'Retour automatique saisie 19h — DLC expirée',
                        'status'             => 'BROUILLON',
                        'created_by'         => $user->id,
                    ]);
                    ReturnLine::create([
                        'return_id'          => $ret->id,
                        'product_id'         => $productId,
                        'quantite_attendue'  => $qteReste,
                        'quantite_retournee' => $perimee,
                        'dlc'                => $dlc,
                        'cause'              => 'INVENDU_EXPIRE',
                        'notes'              => 'DLC expirée le ' . $dlcDate->format('d/m/Y'),
                    ]);
                    $createdReturns[] = $reference;
                }
            }
        });

        $msg = count($createdReturns) > 0
            ? 'Saisie 19h enregistrée. Retours créés : ' . implode(', ', $createdReturns)
            : 'Saisie 19h enregistrée. Aucun produit périmé.';

        return back()->with('success', $msg);
    }

    // ============================================
    // HELPERS STOCK BOUTIQUE
    // ============================================

    /**
     * Déduire la quantité retournée du stock boutique (StockBalance + StockMovement SORTIE).
     * On cible le lot exact (dlc + lot_reference) si disponible, sinon FIFO tous lots.
     */
    private function deduireStockBoutique(
        int $entityId,
        int $productId,
        int $quantite,
        ?string $dlc,
        ?string $lotReference,
        int $returnId,
        int $returnLineId,
        int $userId,
        string $reference
    ): void {
        // Construire la requête de base sur stock_balances boutique
        $query = DB::table('stock_balances')
            ->where('entity_id', $entityId)
            ->where('product_id', $productId)
            ->where('quantite', '>', 0)
            ->lockForUpdate();

        // Si on a une DLC précise, cibler ce lot
        if ($dlc) {
            $query->where('dlc', $dlc);
        }
        if ($lotReference) {
            $query->where('lot_number', $lotReference);
        }

        // FIFO : lots les plus anciens en premier
        $lots = $query->orderBy('dlc', 'asc')->orderBy('created_at', 'asc')->get();

        $reste = $quantite;

        foreach ($lots as $lot) {
            if ($reste <= 0) break;

            $preleve = min($lot->quantite, $reste);

            // StockMovement SORTIE traçable
            StockMovement::create([
                'entity_id'      => $entityId,
                'product_id'     => $productId,
                'type'           => 'SORTIE',
                'quantite'       => -$preleve,
                'dlc'            => $lot->dlc,
                'lot_number'     => $lot->lot_number,
                'provenance'     => 'product_return',
                'reference'      => $reference,
                'notes'          => "Retour boutique — ligne #{$returnLineId}",
                'created_by'     => $userId,
                'movement_date'  => now()->toDateString(),
                'return_id'      => $returnId,
            ]);

            $newQty = $lot->quantite - $preleve;
            if ($newQty <= 0.0001) {
                DB::table('stock_balances')->where('id', $lot->id)->delete();
            } else {
                DB::table('stock_balances')->where('id', $lot->id)
                    ->update(['quantite' => $newQty, 'updated_at' => now()]);
            }

            $reste -= $preleve;
        }

        // Si reste > 0 après tous les lots : stock insuffisant mais on ne bloque pas
        // (le retour est quand même enregistré, le stock va juste à 0)
        if ($reste > 0) {
            \Illuminate\Support\Facades\Log::warning('ReturnController: stock boutique insuffisant pour la déduction', [
                'entity_id'  => $entityId,
                'product_id' => $productId,
                'manquant'   => $reste,
                'return_id'  => $returnId,
            ]);
        }
    }

    /**
     * Remettre la quantité dans le stock boutique (StockBalance + StockMovement ENTREE).
     * Appelé lors de l'annulation d'un retour.
     */
    private function restaurerStockBoutique(
        int $entityId,
        int $productId,
        int $quantite,
        ?string $dlc,
        ?string $lotReference,
        int $returnId,
        int $userId,
        string $reference
    ): void {
        // StockMovement ENTREE traçable
        StockMovement::create([
            'entity_id'     => $entityId,
            'product_id'    => $productId,
            'type'          => 'ENTREE',
            'quantite'      => $quantite,
            'dlc'           => $dlc,
            'lot_number'    => $lotReference,
            'provenance'    => 'product_return_cancel',
            'reference'     => $reference,
            'notes'         => "Restauration stock — annulation retour",
            'created_by'    => $userId,
            'movement_date' => now()->toDateString(),
            'return_id'     => $returnId,
        ]);

        // Remettre dans stock_balances (upsert sur entity+product+dlc+lot)
        $balanceDlc = $dlc ?? '2099-12-31';
        DB::table('stock_balances')->updateOrInsert(
            [
                'entity_id'  => $entityId,
                'product_id' => $productId,
                'dlc'        => $balanceDlc,
                'lot_number' => $lotReference,
            ],
            [
                'quantite'   => DB::raw('COALESCE(quantite, 0) + ' . $quantite),
                'updated_at' => now(),
            ]
        );
    }

    // ============================================
    // HELPERS
    // ============================================

    private function canView(ProductReturn $return, User $user): bool
    {
        if (in_array($user->role, ['ADMIN', 'DIRECTION'])) return true;

        // Le RESP_LABO ne peut voir que les retours qui ne sont PAS en BROUILLON et qui lui sont destinés
        if ($user->role === 'RESP_LABO' && $return->labo_entity_id === $user->entity_id && $return->status !== 'BROUILLON') {
            return true;
        }

        if (in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE']) && $return->entity_id === $user->entity_id) {
            return true;
        }

        return false;
    }
}
