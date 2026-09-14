<?php

namespace Database\Seeders;

use App\Models\CommandeUrgente;
use App\Models\CommandeUrgenteLine;
use App\Models\Entity;
use App\Models\Expedition;
use App\Models\ExpeditionLine;
use App\Models\Facture;
use App\Models\FactureLigne;
use App\Models\HaccpControleReception;
use App\Models\HaccpNettoyage;
use App\Models\HaccpNonConformite;
use App\Models\HaccpTemperature;
use App\Models\IngredientThreshold;
use App\Models\Production;
use App\Models\ProductReturn;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Models\ReturnLine;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\User;
use App\Models\VenteJour;
use App\Support\CurrentStore;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 2 — données de démonstration CLOISONNÉES PAR STORE.
 *
 * Remplace la chaîne de seeders historique (CategorySeeder, IngredientSeeder,
 * ProductSeeder, RecipeSeeder, ProductionSeeder, VenteJourSeeder, Haccp*Seeder…)
 * qui produisait un catalogue GLOBAL partagé et des flux traversant les stores
 * (le labo #1 produisait ce que les stores #2 et #3 vendaient). Ces anciens
 * seeders utilisaient des IDs fixes entrelacés, d'où une réécriture unique
 * plutôt qu'une adaptation fichier par fichier.
 *
 * Modèle appliqué, conforme aux décisions validées :
 *  - chaque Store possède SON catalogue (catégories, ingrédients, produits, recettes) ;
 *  - chaque Store est AUTONOME : il produit ET vend ses propres produits ;
 *  - chaque Store possède ses entités (1 LABO + 1 BOULANGERIE), le flux
 *    labo→boutique restant donc INTRA-store.
 *
 * Ne touche pas aux stores, store_users, users, entities existantes ni au
 * super admin : seuls le catalogue et les données métier sont régénérés.
 */
class TenantIsolatedDemoSeeder extends Seeder
{
    /** Tables métier + catalogue régénérées (ordre de purge = dépendances d'abord). */
    private const TABLES_A_PURGER = [
        'facture_lignes', 'factures',
        'return_photos', 'return_lines', 'product_returns',
        'commandes_urgentes_lines', 'commandes_urgentes',
        'reception_lines', 'receptions',
        'expedition_lines', 'expeditions',
        'ventes_jour',
        'stock_movements', 'stock_balances',
        'ingredient_thresholds',
        'productions',
        'haccp_non_conformites', 'haccp_controles_reception',
        'haccp_nettoyage', 'haccp_temperatures',
        'recipes', 'products', 'ingredients', 'categories',
    ];

    public function run(): void
    {
        $this->purger();

        $stores = Store::orderBy('id')->get();

        if ($stores->isEmpty()) {
            $this->command?->warn('Aucun store : lancez TestDataSeeder d\'abord.');

            return;
        }

        foreach ($stores as $index => $store) {
            $this->seedStore($store, $index + 1);
        }

        $this->command?->info('Données de démo cloisonnées générées pour ' . $stores->count() . ' store(s).');
    }

    private function purger(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach (self::TABLES_A_PURGER as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedStore(Store $store, int $rang): void
    {
        // ── Entités du store : le LABO existant + une BOULANGERIE ──
        $labo = $store->entity;

        if (!$labo) {
            $this->command?->warn("Store #{$store->id} sans entité principale : ignoré.");

            return;
        }

        // Rattachement Phase 1 (idempotent : déjà fait par tenancy:backfill-entities)
        if ($labo->store_id === null) {
            $labo->store_id = $store->id;
            $labo->save();
        }

        // `entities.store_id` est NOT NULL (Phase 4, vague 3a) et volontairement
        // hors de $fillable : il faut donc créer la boulangerie DANS le contexte
        // du store, sinon l'insert part sans store_id (MySQL 1364). Le rattraper
        // après coup, comme c'était le cas, n'a jamais pu fonctionner : l'INSERT
        // échoue avant. `CurrentStore::for()` fait les deux choses utiles ici :
        // le trait BelongsToStore renseigne store_id à la création, et StoreScope
        // limite la recherche aux entités DE CE STORE — deux stores peuvent
        // légitimement avoir une boutique du même nom.
        $boulangerie = CurrentStore::for($store->id, fn () => Entity::firstOrCreate(
            ['nom' => "Boutique {$store->name}"],
            ['type' => 'BOULANGERIE', 'adresse' => $store->address ?? 'Adresse boutique']
        ));

        // Un employé du store pour les colonnes created_by (FK vers users)
        $auteurId = User::where('store_id', $store->id)->value('id')
            ?? User::where('entity_id', $labo->id)->value('id');

        if (!$auteurId) {
            $this->command?->warn("Store #{$store->id} sans utilisateur : données métier ignorées.");

            return;
        }

        // ── CATALOGUE propre au store ──
        $categories = [];
        foreach (['Viennoiseries', 'Pains', 'Pâtisseries'] as $nom) {
            $categories[$nom] = DB::table('categories')->insertGetId([
                'store_id' => $store->id,
                'nom' => $nom,
            ]);
        }

        $ingredients = [];
        $listeIngredients = [
            ['Farine T55', 'kg', 0.80],
            ['Beurre AOP', 'kg', 8.50],
            ['Sucre', 'kg', 1.20],
            ['Chocolat noir', 'kg', 9.40],
        ];

        foreach ($listeIngredients as [$nom, $unite, $prix]) {
            $ingredients[$nom] = DB::table('ingredients')->insertGetId([
                'store_id' => $store->id,
                'nom' => $nom,
                'unite' => $unite,
                'prix_unitaire' => $prix,
            ]);
        }

        // `products.code` est encore unique GLOBALEMENT (l'unicité par store
        // n'arrive qu'en Phase 4) : on préfixe donc par le rang du store.
        $listeProduits = [
            ['Croissant', 'Viennoiseries', 'VIE-001', 1.20, 0.45, 1],
            ['Pain au chocolat', 'Viennoiseries', 'VIE-002', 1.40, 0.55, 1],
            ['Baguette tradition', 'Pains', 'PAI-001', 1.10, 0.30, 1],
            ['Éclair chocolat', 'Pâtisseries', 'PAT-001', 2.80, 0.90, 2],
        ];

        $produits = [];
        foreach ($listeProduits as [$nom, $categorie, $code, $prix, $cout, $dlc]) {
            $produits[$nom] = DB::table('products')->insertGetId([
                'store_id' => $store->id,
                'category_id' => $categories[$categorie],
                'nom' => $nom,
                'code' => "S{$rang}-{$code}",
                'prix_vente' => $prix,
                'cout_revient' => $cout,
                'dlc' => $dlc,
            ]);
        }

        // ── RECETTES (produits et ingrédients du même store) ──
        $recettes = [
            ['Croissant', [['Farine T55', 0.100], ['Beurre AOP', 0.050]]],
            ['Pain au chocolat', [['Farine T55', 0.100], ['Beurre AOP', 0.040], ['Chocolat noir', 0.025]]],
            ['Baguette tradition', [['Farine T55', 0.250]]],
            ['Éclair chocolat', [['Farine T55', 0.080], ['Sucre', 0.040], ['Chocolat noir', 0.030]]],
        ];

        foreach ($recettes as [$produit, $composition]) {
            foreach ($composition as [$ingredient, $quantite]) {
                DB::table('recipes')->insert([
                    'store_id' => $store->id,
                    'product_id' => $produits[$produit],
                    'ingredient_id' => $ingredients[$ingredient],
                    'quantite' => $quantite,
                ]);
            }
        }

        // ── SEUILS d'ingrédients (au labo du store) ──
        // NB : passage par Eloquent (et non DB::table) pour que le trait
        // BelongsToStore renseigne `store_id`. Les inserts directs contournent
        // les événements de modèle et laissaient ces lignes à NULL.
        foreach ($ingredients as $ingredientId) {
            IngredientThreshold::create([
                'entity_id' => $labo->id,
                'ingredient_id' => $ingredientId,
                'seuil_minimum' => 5,
                'stock_max' => 50,
            ]);
        }

        // ── PRODUCTIONS (au labo, sur SES produits) ──
        foreach ([2, 1] as $joursAvant) {
            $date = now()->subDays($joursAvant)->toDateString();

            foreach ($produits as $nom => $produitId) {
                Production::create([
                    'entity_id' => $labo->id,
                    'product_id' => $produitId,
                    'quantite' => 40,
                    'quantite_pertes' => 2,
                    'lot' => "LOT-S{$rang}-" . str_replace('-', '', $date),
                    'date' => $date,
                    'created_by' => $auteurId,
                ]);
            }
        }

        // ── VENTES (à la boutique DU MÊME store, sur SES produits) ──
        $dateVente = now()->subDay()->toDateString();

        foreach ($produits as $produitId) {
            VenteJour::create([
                'entity_id' => $boulangerie->id,
                'date' => $dateVente,
                'product_id' => $produitId,
                'qte_recue' => 30,
                'qte_reste' => 4,
                'qte_vendue' => 26,
            ]);
        }

        // ── HACCP (au labo du store) ──
        foreach (['Chambre froide positive' => 3.5, 'Congélateur' => -19.0] as $enceinte => $temperature) {
            HaccpTemperature::create([
                'entity_id' => $labo->id,
                'enceinte' => $enceinte,
                'temperature' => $temperature,
                'date' => now()->subDay(),
                'created_by' => $auteurId,
            ]);
        }

        // `taches_json` est casté en array par le modèle : pas de json_encode ici.
        HaccpNettoyage::create([
            'entity_id' => $labo->id,
            'date' => now()->subDay()->toDateString(),
            'taches_json' => [
                ['nom' => 'Sol labo', 'fait' => true],
                ['nom' => 'Plans de travail', 'fait' => true],
            ],
            'statut' => 'VALIDE',
            'valide_par' => $auteurId,
        ]);

        // ── LOGISTIQUE, RETOURS, FACTURATION, COMMANDES, STOCKS ──
        $this->seedFluxComplet($store, $labo, $boulangerie, $auteurId, $rang, $produits, $ingredients);
    }

    /**
     * PHASE 4 — étape 1 : couvre les tables restées vides, afin que le passage en
     * NOT NULL et l'activation du scope soient validés sur des données réelles :
     * stocks (mouvements + soldes), expéditions, réceptions, retours, factures,
     * commandes urgentes, contrôles HACCP à réception et non-conformités.
     *
     * Contrairement au reste du seeder (inserts directs avec `store_id` explicite),
     * cette partie passe par les MODÈLES ELOQUENT enveloppés dans
     * `CurrentStore::for()`. `store_id` n'est jamais fourni : il est renseigné
     * automatiquement par le trait BelongsToStore. Le seeder vérifie donc au
     * passage le mécanisme mis en place en Phase 3.5.
     *
     * Tout le flux reste INTRA-store : le labo du store expédie vers SA boutique,
     * qui lui retourne des invendus et reçoit sa facture.
     */
    private function seedFluxComplet(
        Store $store,
        Entity $labo,
        Entity $boulangerie,
        int $auteurId,
        int $rang,
        array $produits,
        array $ingredients
    ): void {
        CurrentStore::for($store->id, function () use ($store, $labo, $boulangerie, $auteurId, $rang, $produits, $ingredients) {
            $hier = now()->subDay();
            $dlc = now()->addDays(2)->toDateString();
            $lot = "LOT-S{$rang}";

            // ── STOCKS : entrée d'ingrédients au labo ──
            foreach ($ingredients as $nom => $ingredientId) {
                StockMovement::create([
                    'entity_id' => $labo->id,
                    'ingredient_id' => $ingredientId,
                    'type' => 'ENTREE',
                    'quantite' => 25,
                    'lot_number' => "{$lot}-ING",
                    'provenance' => 'Fournisseur démo',
                    'reference' => "BL-{$rang}-001",
                    'movement_date' => $hier,
                    'created_by' => $auteurId,
                ]);

                StockBalance::create([
                    'entity_id' => $labo->id,
                    'ingredient_id' => $ingredientId,
                    'lot_number' => "{$lot}-ING",
                    'quantite' => 25,
                ]);
            }

            // ── STOCKS : produits finis issus de la production ──
            foreach ($produits as $produitId) {
                StockBalance::create([
                    'entity_id' => $labo->id,
                    'product_id' => $produitId,
                    'dlc' => $dlc,
                    'lot_number' => "{$lot}-PF",
                    'quantite' => 38,
                ]);
            }

            // ── EXPÉDITION : labo -> SA boutique ──
            $expedition = Expedition::create([
                'entity_id' => $labo->id,
                'boulangerie_id' => $boulangerie->id,
                'date' => $hier->toDateString(),
                'statut' => 'RECUE',
                'created_by' => $auteurId,
            ]);

            $lignesExpedition = [];

            foreach ($produits as $produitId) {
                $lignesExpedition[$produitId] = ExpeditionLine::create([
                    'expedition_id' => $expedition->id,
                    'product_id' => $produitId,
                    'quantite' => 30,
                    'dlc' => $dlc,
                    'lot_reference' => "{$lot}-PF",
                ]);
            }

            // ── RÉCEPTION confirmée par la boutique ──
            $reception = Reception::create([
                'expedition_id' => $expedition->id,
                'entity_id' => $boulangerie->id,
                'date' => $hier->toDateString(),
                'statut' => 'CONFIRMEE',
            ]);

            $lignesReception = [];

            foreach ($lignesExpedition as $produitId => $ligneExpedition) {
                $lignesReception[$produitId] = ReceptionLine::create([
                    'reception_id' => $reception->id,
                    'expedition_line_id' => $ligneExpedition->id,
                    'product_id' => $produitId,
                    'qte_attendue' => 30,
                    'qte_recue' => 30,
                    'ecart' => 0,
                    'dlc' => $dlc,
                ]);
            }

            // ── RETOUR d'invendus : boutique -> labo (sur le 1er produit) ──
            $premierProduit = array_key_first($lignesExpedition);

            $retour = ProductReturn::create([
                'reference' => sprintf('RET-S%d-%04d', $rang, 1),
                'reception_id' => $reception->id,
                'expedition_line_id' => $lignesExpedition[$premierProduit]->id,
                'entity_id' => $boulangerie->id,
                'labo_entity_id' => $labo->id,
                'cause' => 'INVENDU_EXPIRE',
                'dlc_display' => $dlc,
                'product_id' => $premierProduit,
                'quantite_attendue' => 30,
                'quantite_retournee' => 4,
                'status' => 'ENVOYEE',
                'created_by' => $auteurId,
            ]);

            ReturnLine::create([
                'return_id' => $retour->id,
                'reception_line_id' => $lignesReception[$premierProduit]->id,
                'product_id' => $premierProduit,
                'quantite_attendue' => 30,
                'quantite_retournee' => 4,
                'dlc' => $dlc,
                'lot_reference' => "{$lot}-PF",
                'cause' => 'INVENDU_EXPIRE',
            ]);

            // ── FACTURE : labo -> boutique, adossée à l'expédition ──
            $ligneExpeditionFacturee = $lignesExpedition[$premierProduit];
            $prixUnitaire = (float) (DB::table('products')->where('id', $premierProduit)->value('prix_vente') ?? 1);
            $montant = round($prixUnitaire * 30, 2);

            $facture = Facture::create([
                'numero' => sprintf('FA-S%d-%s-001', $rang, $hier->format('Ym')),
                'entity_id' => $labo->id,
                'boulangerie_id' => $boulangerie->id,
                'periode_type' => 'MOIS',
                'date_debut' => $hier->copy()->startOfMonth()->toDateString(),
                'date_fin' => $hier->copy()->endOfMonth()->toDateString(),
                'montant_total' => $montant,
                'statut' => 'EMISE',
                'generated_by' => $auteurId,
            ]);

            // `facture_lignes.expedition_id` est UNIQUE : une seule ligne par expédition.
            FactureLigne::create([
                'facture_id' => $facture->id,
                'expedition_id' => $expedition->id,
                'expedition_line_id' => $ligneExpeditionFacturee->id,
                'product_id' => $premierProduit,
                'quantite' => 30,
                'prix_unitaire' => $prixUnitaire,
                'montant' => $montant,
                'dlc' => $dlc,
                'lot_reference' => "{$lot}-PF",
            ]);

            // ── COMMANDE URGENTE : la boutique commande à son labo ──
            $commande = CommandeUrgente::create([
                'entity_id' => $boulangerie->id,
                'date' => now()->toDateString(),
                'statut' => 'ENVOYEE',
                'priorite' => 2,
                'notes' => 'Réassort démo',
                'created_by' => $auteurId,
            ]);

            foreach (array_slice($produits, 0, 2) as $produitId) {
                CommandeUrgenteLine::create([
                    'commande_urgente_id' => $commande->id,
                    'product_id' => $produitId,
                    'quantite' => 12,
                ]);
            }

            // ── HACCP : contrôle à réception + non-conformité ──
            HaccpControleReception::create([
                'entity_id' => $labo->id,
                'fournisseur' => 'Fournisseur démo',
                'bl_number' => "BL-{$rang}-001",
                'categorie' => 'FRAIS',
                'temperature' => 4.0,
                'conforme' => true,
                'date' => $hier->toDateString(),
                'created_by' => $auteurId,
            ]);

            HaccpNonConformite::create([
                'entity_id' => $boulangerie->id,
                'type' => 'TEMPERATURE',
                'description' => 'Température vitrine relevée à 9 °C',
                'action' => 'Réglage du thermostat',
                'statut' => 'RESOLUE',
                'date' => $hier->toDateString(),
                'created_by' => $auteurId,
            ]);
        });
    }
}
