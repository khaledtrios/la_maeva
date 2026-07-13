<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entity;
use App\Models\Product;
use App\Models\Reception;
use App\Models\VenteJour;
use App\Models\StockMovement;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Reçoit les exports de la caisse (Atoo Leo, via watch_export.py) et les
 * répercute dans le SYSTEME REEL de l'app (VenteJour + stock_balances FIFO),
 * c'est-à-dire exactement le même système que SaleController::store().
 *
 * Différence clé avec une saisie manuelle : la caisse envoie à chaque sync
 * le TOTAL CUMULE vendu depuis le début de la journée pour chaque produit
 * (le fichier Export.txt est réécrit en entier par la caisse). On ne peut
 * donc pas faire un simple +=, il faut calculer le delta par rapport à ce
 * qui a déjà été consommé en stock pour cette vente.
 */
class SyncCaisseController extends Controller
{
    /**
     * Seuil de similarité (en %) en-dessous duquel on considère qu'il n'y a pas
     * de correspondance fiable entre le nom du produit côté caisse et celui en base.
     */
    private const MATCH_THRESHOLD = 80;

    public function getEtab(Request $request)
    {
        $etabs = Entity::select('id', 'nom', 'adresse')->get();

        return response()->json([
            'message' => 'Establishment data retrieved successfully',
            'etabs' => $etabs,
        ]);
    }

    /**
     * Synchronise les ventes du jour envoyées par la caisse avec le système
     * réel (VenteJour + consommation FIFO du stock).
     */
    public function syncDataVente(Request $request)
    {
        $validated = $request->validate([
            'entity_id' => 'required|integer|exists:entities,id',
            'date' => 'required|date_format:Y-m-d',
            'produits' => 'required|array',
            'produits.*.nom_produit' => 'required|string',
            'produits.*.nproduit' => 'nullable|string',
            'produits.*.famille' => 'nullable|string',
            'produits.*.qte' => 'required|integer|min:0',
            'produits.*.nom_vendeur' => 'nullable|array',
            'produits.*.ncaisse' => 'nullable|array',
        ]);

        $entityId = $validated['entity_id'];
        $date = $validated['date'];

        // Charge une seule fois les produits + réceptions confirmées du jour,
        // pour éviter une requête par ligne caisse.
        $produitsExistants = Product::select('id', 'nom')->get();

        $receptionsLines = Reception::with('lines')
            ->whereHas('expedition', fn($q) => $q->where('boulangerie_id', $entityId))
            ->where('statut', 'CONFIRMEE')
            ->whereDate('date', $date)
            ->get()
            ->flatMap(fn($r) => $r->lines);

        $resultats = [
            'crees' => 0,
            'mis_a_jour' => 0,
            'inchanges' => 0,
            'produits_nouveaux' => [],
            'erreurs' => [],
        ];

        foreach ($validated['produits'] as $item) {
            $produit = $this->matchOrCreateProduit(
                $item['nom_produit'],
                $produitsExistants,
                $resultats
            );

            // Si le produit n'existe pas, on ignore cette ligne
            if ($produit === null) {
                continue;
            }

            $qteVendueCaisse = (int) $item['qte'];

            try {
                DB::transaction(function () use (
                    $entityId,
                    $date,
                    $produit,
                    $qteVendueCaisse,
                    $item,
                    $receptionsLines,
                    &$resultats
                ) {
                    $qteRecueJour = (int) $receptionsLines
                        ->where('product_id', $produit->id)
                        ->sum('qte_recue');

                    $existingVente = VenteJour::where([
                        'entity_id' => $entityId,
                        'date' => $date,
                        'product_id' => $produit->id,
                    ])->lockForUpdate()->first();

                    $ancienneQteVendue = $existingVente ? (int) $existingVente->qte_vendue : 0;

                    // Rien de nouveau depuis la dernière sync -> on ne touche pas au stock.
                    if ($qteVendueCaisse === $ancienneQteVendue) {
                        $resultats['inchanges']++;
                        return;
                    }

                    $delta = $qteVendueCaisse - $ancienneQteVendue;

                    if ($delta > 0) {
                        // La caisse a vendu plus depuis la dernière sync -> on consomme le delta en FIFO.
                        $stockDisponible = StockMovementService::getTotalProductStock($entityId, $produit->id);

                        if ($delta > $stockDisponible) {
                            $manque = $delta - $stockDisponible;
                            throw new \Exception(
                                "Stock insuffisant pour synchroniser '{$item['nom_produit']}' (id produit {$produit->id}). " .
                                    "Disponible: {$stockDisponible}, supplément demandé par la caisse: {$delta}. " .
                                    "Il manque {$manque} unité(s)."
                            );
                        }

                        $consommes = StockMovementService::consumeProductFIFO(
                            $entityId,
                            $produit->id,
                            $delta,
                            [
                                'reference_type' => 'vente_jour_caisse',
                                'reference_id'   => $existingVente->id ?? null,
                                'created_by'     => 9,
                                'movement_date'  => $date,
                                'notes'          => 'Sync caisse: vente supplémentaire détectée',
                            ]
                        );

                        Log::info('SyncCaisse: stock consommé (delta vente caisse)', [
                            'entity_id'  => $entityId,
                            'product_id' => $produit->id,
                            'delta'      => $delta,
                            'lots'       => $consommes,
                        ]);
                    } else {
                        // La caisse a corrigé à la baisse (annulation/retour) -> on remet le delta en stock.
                        $retour = abs($delta);

                        StockMovement::create([
                            'entity_id'      => $entityId,
                            'product_id'     => $produit->id,
                            'type'           => 'ENTREE',
                            'quantite'       => $retour,
                            'reference'      => 'correction_sync_caisse',
                            'reference_id'   => $existingVente->id ?? null,
                            'reference_type' => 'vente_jour_caisse',
                            'created_by'     => 9,
                            'movement_date'  => $date,
                            'notes'          => 'Sync caisse: correction à la baisse détectée',
                        ]);

                        DB::table('stock_balances')
                            ->where('entity_id', $entityId)
                            ->where('product_id', $produit->id)
                            ->update([
                                'quantite'   => DB::raw('COALESCE(quantite, 0) + ' . $retour),
                                'updated_at' => now(),
                            ]);

                        Log::info('SyncCaisse: stock restitué (correction caisse à la baisse)', [
                            'entity_id'  => $entityId,
                            'product_id' => $produit->id,
                            'retour'     => $retour,
                        ]);
                    }

                    $qteReste = max(0, $qteRecueJour - $qteVendueCaisse);

                    // DLC du lot le plus proche de péremption encore en stock pour ce
                    // produit : cohérent avec une consommation FIFO (on vide les lots
                    // les plus anciens en premier, donc l'invendu restant porte la DLC
                    // du lot suivant le plus proche).
                    $dlcProduit = DB::table('stock_balances')
                        ->where('entity_id', $entityId)
                        ->where('product_id', $produit->id)
                        ->where('quantite', '>', 0)
                        ->whereNotNull('dlc')
                        ->orderBy('dlc')
                        ->value('dlc');

                    $vente = $existingVente ?? new VenteJour([
                        'entity_id' => $entityId,
                        'date' => $date,
                        'product_id' => $produit->id,
                    ]);

                    $vente->qte_recue   = $qteRecueJour;
                    $vente->qte_reste   = $qteReste;
                    $vente->qte_vendue  = $qteVendueCaisse;
                    $vente->dlc_produit = $dlcProduit;
                    $vente->computeDlcSplit();
                    $vente->save();

                    $existingVente ? $resultats['mis_a_jour']++ : $resultats['crees']++;
                });
            } catch (\Exception $e) {
                Log::warning('SyncCaisse: erreur sur une ligne', [
                    'entity_id' => $entityId,
                    'produit'   => $item['nom_produit'],
                    'error'     => $e->getMessage(),
                ]);
                $resultats['erreurs'][] = [
                    'nom_produit' => $item['nom_produit'],
                    'message' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'message' => 'Sales data synchronized successfully',
            'resultats' => $resultats,
        ]);
    }

    /**
     * Cherche le produit existant dont le nom correspond le mieux au nom reçu de la caisse.
     * Si aucune correspondance fiable n'est trouvée, crée un nouveau produit.
     */
    /**
     * Cherche le produit existant dont le nom correspond le mieux au nom reçu de la caisse.
     * Si aucune correspondance fiable n'est trouvée, NE CRÉE PAS le produit.
     */
    private function matchOrCreateProduit(string $nomCaisse, $produitsExistants, array &$resultats): ?Product
    {
        $nomNormalise = $this->normalize($nomCaisse);

        $meilleurScore = 0;
        $meilleurProduit = null;

        foreach ($produitsExistants as $produit) {
            $score = 0;
            similar_text($nomNormalise, $this->normalize($produit->nom), $score);

            if ($score > $meilleurScore) {
                $meilleurScore = $score;
                $meilleurProduit = $produit;
            }
        }

        // Produit trouvé
        if ($meilleurProduit !== null && $meilleurScore >= self::MATCH_THRESHOLD) {
            return $meilleurProduit;
        }

        // Produit introuvable
        Log::warning('SyncCaisse: produit introuvable', [
            'nom_caisse' => $nomCaisse,
            'meilleur_score' => $meilleurScore,
            'meilleur_candidat' => $meilleurProduit->nom ?? null,
        ]);

        $resultats['erreurs'][] = [
            'nom_produit' => $nomCaisse,
            'message' => 'Produit inexistant dans la base.',
        ];

        return null;
    }

    /**
     * Normalise un nom de produit pour la comparaison :
     * minuscule, suppression des accents, espaces multiples réduits à un seul.
     */
    private function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
        $value = preg_replace('/[^a-z0-9\s]/', ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value);
    }
}
