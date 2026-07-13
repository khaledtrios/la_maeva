<?php

namespace App\Services;

use App\Events\CommandeUrgenteCreated;
use App\Events\CommandeUrgenteStatusUpdated;
use App\Models\CommandeUrgente;
use App\Models\CommandeUrgenteLine;
use App\Models\Expedition;
use App\Models\ExpeditionLine;
use App\Models\Notification;
use App\Models\User;
use App\Models\Product;
use App\Models\Production;
use App\Models\Recipe;
use App\Models\StockBalance;
use App\Services\ExpeditionService;
use App\Services\ProductionAllocationService;
use App\Services\StockMovementService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommandeUrgenteService
{
    /**
     * Créer une nouvelle commande urgente avec ses lignes
     *
     * @param array $data { entity_id, date, notes, created_by, lines: [{product_id, quantite}] }
     * @return CommandeUrgente
     */
    public static function create(array $data): CommandeUrgente
    {
        return DB::transaction(function () use ($data) {
            $commande = CommandeUrgente::create([
                'entity_id'   => $data['entity_id'],
                'date'        => $data['date'] ?? now()->toDateString(),
                'statut'      => CommandeUrgente::STATUT_ENVOYEE,
                'priorite'    => $data['priorite'] ?? 1,
                'notes'       => $data['notes'] ?? null,
                'created_by'  => $data['created_by'],
            ]);

            // Créer les lignes
            if (isset($data['lines']) && is_array($data['lines'])) {
                foreach ($data['lines'] as $line) {
                    CommandeUrgenteLine::create([
                        'commande_urgente_id' => $commande->id,
                        'product_id'          => $line['product_id'],
                        'quantite'            => $line['quantite'],
                    ]);
                }
            }

            // Diffusion de l'événement temps réel (Pusher)
            event(new CommandeUrgenteCreated($commande));

            // Notification aux RESP_LABO (historique DB)
            self::notifyLabo($commande);

            return $commande;
        });
    }

    /**
     * Un membre du labo prend en charge la commande
     *
     * @param int $commandeId
     * @param User $user
     * @return CommandeUrgente
     */
    public static function takeOwnership(int $commandeId, User $user): CommandeUrgente
    {
        return DB::transaction(function () use ($commandeId, $user) {
            $commande = CommandeUrgente::findOrFail($commandeId);

            // Vérifier que la commande est bien en état ENVOYEE
            if ($commande->statut !== CommandeUrgente::STATUT_ENVOYEE) {
                throw new \Exception(
                    'Seules les commandes envoyées peuvent être prises en charge.'
                );
            }

            $oldStatut = $commande->statut;
            $commande->update(['statut' => CommandeUrgente::STATUT_PRISE_EN_CHARGE]);

            // Diffusion de l'événement temps réel (Pusher)
            event(new CommandeUrgenteStatusUpdated($commande, $oldStatut, $commande->statut));

            // Notification à la boutique que la commande est prise en charge
            self::notifyBoutique($commande, 'Commande prise en charge', 'Votre commande urgente #' . $commande->id . ' a été prise en charge par le labo.');

            return $commande;
        });
    }

    /**
     * Mettre à jour le statut d'une commande
     *
     * @param int $commandeId
     * @param string $status
     * @return CommandeUrgente
     */
    public static function updateStatus(int $commandeId, string $status): CommandeUrgente
    {
        return DB::transaction(function () use ($commandeId, $status) {
            $commande = CommandeUrgente::findOrFail($commandeId);

            $validStatuses = [
                CommandeUrgente::STATUT_ENVOYEE,
                CommandeUrgente::STATUT_PRISE_EN_CHARGE,
                CommandeUrgente::STATUT_EXPEDIEE,
            ];

            if (!in_array($status, $validStatuses, true)) {
                throw new \Exception('Statut invalide.');
            }

            $oldStatut = $commande->statut;

            // Vérification des transitions autorisées
            $commande->update(['statut' => $status]);

            // Diffusion de l'événement temps réel (Pusher)
            event(new CommandeUrgenteStatusUpdated($commande, $oldStatut, $status));

            // Si passage à EXPEDIEE, notifier la boutique
            if ($status === CommandeUrgente::STATUT_EXPEDIEE) {
                self::notifyBoutique($commande, 'Commande expédiée', 'Votre commande urgente #' . $commande->id . ' a été expédiée.');
            }

            return $commande;
        });
    }

    /**
     * Créer une notification pour les RESP_LABO lorsqu'une commande est créée
     *
     * @param CommandeUrgente $commande
     * @return void
     */
    public static function notifyLabo(CommandeUrgente $commande): void
    {
        // Récupérer tous les RESP_LABO (et ADMIN) actifs
        $users = User::whereIn('role', ['RESP_LABO', 'ADMIN'])
            ->where('active', true)
            ->get();

        $entityNom = $commande->entity?->nom ?? 'Boutique inconnue';
        $dateFormatted = \Carbon\Carbon::parse($commande->date)->format('d/m/Y');
        $message = "Nouvelle commande urgente #{$commande->id} depuis {$entityNom} ({$dateFormatted})";

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'titre'   => 'Commande urgente',
                'message' => $message,
                'lu'      => false,
            ]);
        }
    }

    /**
     * Créer une notification pour la boutique
     *
     * @param CommandeUrgente $commande
     * @param string $titre
     * @param string $message
     * @return void
     */
    private static function notifyBoutique(CommandeUrgente $commande, string $titre, string $message): void
    {
        $responsable = User::where('entity_id', $commande->entity_id)
            ->whereIn('role', ['RESP_BOUTIQUE', 'EMPLOYE_VENTE'])
            ->where('active', true)
            ->first();

        if ($responsable) {
            Notification::create([
                'user_id' => $responsable->id,
                'titre'   => $titre,
                'message' => $message,
                'lu'      => false,
            ]);
        }
    }

    /**
     * Récupérer les commandes pour un utilisateur (selon son rôle)
     *
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Builder<CommandeUrgente>
     */
    public static function queryForUser(User $user): \Illuminate\Database\Eloquent\Builder
    {
        $query = CommandeUrgente::with(['entity', 'creator', 'lines.product']);

        if (in_array($user->role, ['ADMIN', 'DIRECTION', 'RESP_LABO', 'EMPLOYE_LABO'], true)) {
            // Le labo voit toutes les commandes des boutiques (pas les siennes)
            $query->where('entity_id', '!=', $user->entity_id);
        } else {
            // La boutique ne voit que ses propres commandes
            $query->where('entity_id', $user->entity_id);
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * Créer un BL (expedition) directement depuis une commande urgente
     * Avec vérification du stock disponible et allocation FIFO.
     *
     * Pour une commande urgente, la production est implicite (aujourd'hui):
     *  - date_production = today()
     *  - DLC = today() + product.dlc (jours)
     *
     * @param int $commandeId
     * @param int $laboUserId
     * @return Expedition
     */
    public static function createBlFromCommande(int $commandeId, int $laboUserId): Expedition
    {
        return DB::transaction(function () use ($commandeId, $laboUserId) {
            $commande = CommandeUrgente::with(['entity', 'lines.product'])->findOrFail($commandeId);
            $laboUser = User::with('entity')->findOrFail($laboUserId);

            // Vérifier que la commande est en état PRISE_EN_CHARGE
            if ($commande->statut !== CommandeUrgente::STATUT_PRISE_EN_CHARGE) {
                throw ValidationException::withMessages([
                    'commande' => ['Seules les commandes prises en charge peuvent être expédiées.'],
                ]);
            }

            $laboEntityId = $laboUser->entity->id;
            $boutiqueEntityId = $commande->entity_id;
            $today = now()->toDateString();

            // === VÉRIFICATION STOCK DISPONIBLE (globale) ===
            $linesByProduct = $commande->lines->groupBy('product_id');
            $shortages = [];

            foreach ($linesByProduct as $productId => $lines) {
                $demande = $lines->sum('quantite');
                $disponible = ProductionAllocationService::getAvailableQuantity($productId, $laboEntityId);

                if ($demande > $disponible) {
                    $product = Product::find($productId);
                    $shortages[] = "Produit \"{$product->nom}\" : demandé {$demande}, disponible {$disponible} (manque: " . ($demande - $disponible) . ")";
                }
            }

            if (!empty($shortages)) {
                $msg = "Stock insuffisant pour cette commande :\n" . implode("\n", $shortages);
                throw ValidationException::withMessages(['stock' => [$msg], 'commande_id' => $commande->id]);
            }

            // === CRÉER LES PRODUCTIONS IMPLICITES (une par produit) ===
            $productionsParProduit = []; // product_id => Production
            foreach ($linesByProduct as $productId => $lines) {
                $quantiteTotale = $lines->sum('quantite');
                $product = $lines->first()->product;

                // Vérifier les ingrédients disponibles avant création production
                $recipes = Recipe::where('product_id', $productId)->with('ingredient')->get();
                foreach ($recipes as $recipe) {
                    $besoin = $recipe->quantite * $quantiteTotale;
                    $stockDispo = StockBalance::where('entity_id', $laboEntityId)
                        ->where('ingredient_id', $recipe->ingredient_id)
                        ->sum('quantite');
                    if ($stockDispo < $besoin) {
                        throw ValidationException::withMessages([
                            'stock' => ["Stock insuffisant en ingrédients pour {$product->nom}. Manque: " . ($besoin - $stockDispo) . " {$recipe->ingredient->unite} de {$recipe->ingredient->nom}"],
                        ]);
                    }
                }

                // Créer la production
                $production = Production::create([
                    'entity_id'       => $laboEntityId,
                    'product_id'      => $productId,
                    'quantite'        => $quantiteTotale,
                    'quantite_pertes' => 0,
                    'lot'             => 'CMD-URG-' . $commande->id . '-' . $productId,
                    'date'            => $today,
                    'created_by'      => $laboUserId,
                ]);

                // Déduire les ingrédients via FIFO
                foreach ($recipes as $recipe) {
                    $consommation = $recipe->quantite * $quantiteTotale;
                    StockMovementService::consumeIngredientFIFO(
                        $laboEntityId,
                        $recipe->ingredient_id,
                        $consommation,
                        [
                            'reference'   => 'CMD-URG-PROD #' . $production->id,
                            'created_by'  => $laboUserId,
                        ]
                    );
                }

                $productionsParProduit[$productId] = $production;
            }

            // === CRÉATION EXPÉDITION (ENVOYEE directement) ===
            $expedition = Expedition::create([
                'entity_id'      => $laboEntityId,
                'boulangerie_id' => $boutiqueEntityId,
                'date'           => $today,
                'statut'         => 'ENVOYEE',
                'created_by'     => $laboUserId,
            ]);

            // === CRÉATION LIGNES D'EXPÉDITION (liées aux productions créées) ===
            foreach ($commande->lines as $line) {
                $productId = $line->product_id;
                $quantite = $line->quantite;
                $product = $line->product;
                $production = $productionsParProduit[$productId];

                $dlc = \Carbon\Carbon::parse($today)
                    ->addDays($product->dlc ?? 7)
                    ->toDateString();

                ExpeditionLine::create([
                    'expedition_id'   => $expedition->id,
                    'product_id'      => $productId,
                    'production_id'   => $production->id,
                    'date_production' => $today,
                    'quantite'        => $quantite,
                    'dlc'             => $dlc,
                    'lot_reference'   => $production->lot,
                ]);
            }

            // Créer automatiquement la réception
            ExpeditionService::createReceptionFromExpedition($expedition);

            // Mettre la commande en EXPEDIEE
            $commande->update(['statut' => CommandeUrgente::STATUT_EXPEDIEE]);

            // Notification
            self::notifyBoutique($commande, 'Commande expédiée', 'Votre commande urgente #' . $commande->id . ' a été expédiée.');

            return $expedition;
        });
    }
}
