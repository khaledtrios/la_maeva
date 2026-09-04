<?php

use App\Enums\StoreStatus;
use App\Models\Category;
use App\Models\CommandeUrgente;
use App\Models\Entity;
use App\Models\Expedition;
use App\Models\Facture;
use App\Models\HaccpNettoyage;
use App\Models\HaccpTemperature;
use App\Models\Ingredient;
use App\Models\IngredientThreshold;
use App\Models\Product;
use App\Models\Production;
use App\Models\Recipe;
use App\Models\Reception;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\SuperAdmin;
use App\Models\User;
use App\Models\VenteJour;
use App\Support\CurrentStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('tenant-lifecycle');

/**
 * TEST GLOBAL DE BOUT EN BOUT — cycle de vie complet d'un tenant (Phase 3.5).
 *
 * Objectif : prouver que le mécanisme mis en place (trait BelongsToStore +
 * CurrentStore) renseigne AUTOMATIQUEMENT `store_id` sur toute création, dans
 * tous les modules, et qu'aucune donnée ne traverse la frontière entre deux
 * stores. C'était le bloqueur C1 de l'audit : avant, aucune ligne créée par
 * l'application n'avait de store_id.
 *
 * Deux tenants complets sont montés, puis chaque module est exercé.
 */

/** Monte un tenant complet : store actif, labo, boulangerie, admin, employés. */
function creerTenant(string $label, string $slug): array
{
    $superAdmin = SuperAdmin::firstOrCreate(
        ['email' => 'super@example.test'],
        ['name' => 'Super Admin', 'password' => bcrypt('password'), 'active' => true]
    );

    // 1) Création du store (workflow : PENDING puis approuvé par le super admin)
    $store = Store::factory()->create([
        'name' => "Store {$label}",
        'slug' => $slug,
    ]);

    // `status` a une valeur par défaut en BASE (PENDING) que la factory ne
    // définit pas : il faut relire la ligne pour l'obtenir.
    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Pending);

    $store->approve($superAdmin);
    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Active);

    // 2) Entités du store : un LABO et une BOULANGERIE.
    // `entities.store_id` est NOT NULL (vague 3a) : le rattachement se fait via le
    // contexte, ce qui vérifie au passage le trait BelongsToStore sur Entity.
    $labo = creerEntite($store->id, 'LABO', "Labo {$label}", "1 rue {$label}");
    $boutique = creerEntite($store->id, 'BOULANGERIE', "Boutique {$label}", "2 rue {$label}");

    $store->entity_id = $labo->id;
    $store->save();

    // 3) Store Admin (guard "store")
    $storeAdmin = StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'admin.' . strtolower($label) . '@example.test',
    ]);

    // 4) Employés
    $employeLabo = User::create([
        'store_id' => $store->id, 'entity_id' => $labo->id, 'nom' => "Labo {$label}",
        'pin' => User::hashPin('1111'), 'role' => 'RESP_LABO', 'auth_type' => 'PIN', 'active' => true,
    ]);

    $employeVente = User::create([
        'store_id' => $store->id, 'entity_id' => $boutique->id, 'nom' => "Vente {$label}",
        'pin' => User::hashPin('2222'), 'role' => 'RESP_BOUTIQUE', 'auth_type' => 'PIN', 'active' => true,
    ]);

    return compact('store', 'labo', 'boutique', 'storeAdmin', 'employeLabo', 'employeVente', 'superAdmin');
}

/** Exerce tous les modules pour un tenant, dans le contexte de son store admin. */
function creerDonneesMetier(array $t): array
{
    $created = [];

    // Le contexte tenant est celui du Store Admin authentifié.
    test()->actingAs($t['storeAdmin'], 'store');

    // ── CATALOGUE ──
    $created['category'] = Category::create(['nom' => 'Viennoiseries']);
    $created['ingredient'] = Ingredient::create(['nom' => 'Farine', 'unite' => 'kg', 'prix_unitaire' => 0.8]);
    $created['product'] = Product::create([
        'category_id' => $created['category']->id, 'nom' => 'Croissant',
        'code' => 'CR-' . $t['store']->id, 'prix_vente' => 1.2, 'cout_revient' => 0.45, 'dlc' => 1,
    ]);
    $created['recipe'] = Recipe::create([
        'product_id' => $created['product']->id,
        'ingredient_id' => $created['ingredient']->id,
        'quantite' => 0.1,
    ]);

    // ── STOCKS ──
    $created['threshold'] = IngredientThreshold::create([
        'entity_id' => $t['labo']->id, 'ingredient_id' => $created['ingredient']->id,
        'seuil_minimum' => 5, 'stock_max' => 50,
    ]);

    // ── PRODUCTION ──
    $created['production'] = Production::create([
        'entity_id' => $t['labo']->id, 'product_id' => $created['product']->id,
        'quantite' => 40, 'quantite_pertes' => 1, 'lot' => 'LOT-1',
        'date' => now()->toDateString(), 'created_by' => $t['employeLabo']->id,
    ]);

    // ── EXPÉDITION (labo -> boutique du MÊME store) ──
    $created['expedition'] = Expedition::create([
        'entity_id' => $t['labo']->id, 'boulangerie_id' => $t['boutique']->id,
        'date' => now()->toDateString(), 'statut' => 'BROUILLON',
        'created_by' => $t['employeLabo']->id,
    ]);

    // ── RÉCEPTION ──
    $created['reception'] = Reception::create([
        'expedition_id' => $created['expedition']->id, 'entity_id' => $t['boutique']->id,
        'date' => now()->toDateString(), 'statut' => 'EN_ATTENTE',
    ]);

    // ── VENTES ──
    $created['vente'] = VenteJour::create([
        'entity_id' => $t['boutique']->id, 'date' => now()->toDateString(),
        'product_id' => $created['product']->id, 'qte_recue' => 30, 'qte_reste' => 4, 'qte_vendue' => 26,
    ]);

    // ── HACCP ──
    $created['temperature'] = HaccpTemperature::create([
        'entity_id' => $t['labo']->id, 'enceinte' => 'Chambre froide',
        'temperature' => 3.5, 'date' => now(), 'created_by' => $t['employeLabo']->id,
    ]);

    $created['nettoyage'] = HaccpNettoyage::create([
        'entity_id' => $t['labo']->id, 'date' => now()->toDateString(),
        'taches_json' => [['nom' => 'Sol', 'fait' => true]],
        'statut' => 'VALIDE', 'valide_par' => $t['employeLabo']->id,
    ]);

    // ── FACTURE ──
    $created['facture'] = Facture::create([
        'numero' => 'F-' . $t['store']->id . '-001',
        'entity_id' => $t['labo']->id, 'boulangerie_id' => $t['boutique']->id,
        'periode_type' => 'MOIS', 'date_debut' => '2026-06-01', 'date_fin' => '2026-06-30',
        'montant_total' => 250.00, 'statut' => 'BROUILLON',
        'generated_by' => $t['employeLabo']->id,
    ]);

    // ── COMMANDE URGENTE ──
    $created['commande'] = CommandeUrgente::create([
        'entity_id' => $t['boutique']->id, 'date' => now()->toDateString(),
        'statut' => 'ENVOYEE', 'priorite' => 2, 'created_by' => $t['employeVente']->id,
    ]);

    return $created;
}

// ============================================
// 1. CYCLE DE VIE COMPLET + store_id AUTOMATIQUE
// ============================================

test('tout le cycle de vie d\'un tenant renseigne automatiquement store_id', function () {
    $t = creerTenant('Alpha', 'store-alpha');
    $created = creerDonneesMetier($t);

    // Chaque ligne créée doit porter le store_id du tenant, SANS qu'aucun
    // contrôleur ni appelant ne l'ait fourni explicitement.
    // NB : on lit l'attribut du modèle et non `fresh()`, car
    // IngredientThreshold a une clé primaire composite (entity_id,
    // ingredient_id) que fresh() ne sait pas résoudre. La persistance réelle
    // en base est vérifiée par le test « aucune création ne laisse NULL ».
    foreach ($created as $module => $model) {
        expect($model->store_id)
            ->toBe($t['store']->id, "Le module « {$module} » n'a pas reçu le bon store_id");
    }

    // Les entités et comptes aussi
    expect($t['labo']->fresh()->store_id)->toBe($t['store']->id);
    expect($t['boutique']->fresh()->store_id)->toBe($t['store']->id);
    expect($t['employeLabo']->fresh()->store_id)->toBe($t['store']->id);
});

test('aucune création ne laisse store_id à NULL', function () {
    $t = creerTenant('Beta', 'store-beta');
    creerDonneesMetier($t);

    $tables = [
        'entities', 'categories', 'ingredients', 'products', 'recipes',
        'ingredient_thresholds', 'productions', 'expeditions', 'receptions',
        'ventes_jour', 'haccp_temperatures', 'haccp_nettoyage', 'factures',
        'commandes_urgentes',
    ];

    $fautifs = [];

    foreach ($tables as $table) {
        $nulls = DB::table($table)->whereNull('store_id')->count();

        if ($nulls > 0) {
            $fautifs[] = "{$table} ({$nulls})";
        }
    }

    expect($fautifs)->toBe([], 'Tables contenant des store_id NULL : ' . implode(', ', $fautifs));
});

// ============================================
// 2. ISOLATION ENTRE DEUX STORES
// ============================================

test('aucune donnée ne fuit entre deux stores', function () {
    $a = creerTenant('Un', 'store-un');
    $dataA = creerDonneesMetier($a);

    $b = creerTenant('Deux', 'store-deux');
    $dataB = creerDonneesMetier($b);

    // Les deux jeux de données sont bien distincts
    expect($dataA['product']->fresh()->store_id)->not->toBe($dataB['product']->fresh()->store_id);

    // Chaque store ne voit QUE ses lignes
    foreach (['products', 'productions', 'ventes_jour', 'factures', 'haccp_temperatures'] as $table) {
        $totalA = DB::table($table)->where('store_id', $a['store']->id)->count();
        $totalB = DB::table($table)->where('store_id', $b['store']->id)->count();
        $total = DB::table($table)->count();

        expect($totalA)->toBeGreaterThan(0);
        expect($totalB)->toBeGreaterThan(0);
        expect($totalA + $totalB)->toBe($total, "Des lignes de {$table} n'appartiennent à aucun des deux stores");
    }

    // Cohérence croisée : aucune ligne ne référence le catalogue d'un autre store
    $croisements = [
        ['recipes', 'product_id', 'products'],
        ['recipes', 'ingredient_id', 'ingredients'],
        ['products', 'category_id', 'categories'],
        ['productions', 'product_id', 'products'],
        ['ventes_jour', 'product_id', 'products'],
    ];

    foreach ($croisements as [$table, $fk, $ref]) {
        $fuites = DB::table($table)
            ->join($ref, "{$ref}.id", '=', "{$table}.{$fk}")
            ->whereColumn("{$ref}.store_id", '!=', "{$table}.store_id")
            ->count();

        expect($fuites)->toBe(0, "{$table}.{$fk} pointe le {$ref} d'un autre store");
    }
});

test('le store_id suit le contexte du Store Admin authentifié', function () {
    $a = creerTenant('Ctx1', 'store-ctx1');
    $b = creerTenant('Ctx2', 'store-ctx2');

    // Connecté comme admin de A -> la création part dans A
    $this->actingAs($a['storeAdmin'], 'store');
    $catA = Category::create(['nom' => 'Depuis A']);
    expect($catA->fresh()->store_id)->toBe($a['store']->id);

    // Connecté comme admin de B -> la création part dans B
    $this->actingAs($b['storeAdmin'], 'store');
    $catB = Category::create(['nom' => 'Depuis B']);
    expect($catB->fresh()->store_id)->toBe($b['store']->id);

    expect($catA->fresh()->store_id)->not->toBe($catB->fresh()->store_id);
});

test('un employé (guard web) est aussi rattaché à son store', function () {
    $t = creerTenant('Emp', 'store-emp');

    $this->actingAs($t['employeLabo']); // guard web

    expect(CurrentStore::id())->toBe($t['store']->id);

    $production = Production::create([
        'entity_id' => $t['labo']->id,
        'product_id' => Product::create([
            'category_id' => Category::create(['nom' => 'Cat'])->id,
            'nom' => 'Pain', 'code' => 'P-' . $t['store']->id, 'prix_vente' => 1, 'cout_revient' => 0.3, 'dlc' => 1,
        ])->id,
        'quantite' => 10, 'date' => now()->toDateString(), 'created_by' => $t['employeLabo']->id,
    ]);

    expect($production->fresh()->store_id)->toBe($t['store']->id);
});

test('l\'ADMIN interne n\'est pas cloisonné mais ses créations restent rattachées', function () {
    $t = creerTenant('Adm', 'store-adm');

    $admin = User::create([
        'store_id' => $t['store']->id, 'entity_id' => $t['labo']->id, 'nom' => 'Admin interne',
        'pin' => User::hashPin('9999'), 'role' => 'ADMIN', 'auth_type' => 'PIN', 'active' => true,
    ]);

    $this->actingAs($admin);

    // Rôle plateforme : aucun cloisonnement automatique...
    expect(CurrentStore::id())->toBeNull();

    // ... mais la ligne créée est tout de même rattachée, par dérivation
    // depuis l'entité visée (sinon store_id serait NULL).
    $temperature = HaccpTemperature::create([
        'entity_id' => $t['labo']->id, 'enceinte' => 'Four',
        'temperature' => 20.0, 'date' => now(), 'created_by' => $admin->id,
    ]);

    expect($temperature->fresh()->store_id)->toBe($t['store']->id);
});

// ============================================
// 3. PROTECTIONS AJOUTÉES EN PHASE 3.5
// ============================================

test('un employé ne peut pas utiliser le slug d\'un autre store', function () {
    $a = creerTenant('SlugA', 'store-sluga');
    $b = creerTenant('SlugB', 'store-slugb');

    // Son propre slug : accessible
    $this->actingAs($a['employeLabo'])->get('/store-sluga/dashboard')->assertOk();

    // Le slug de l'autre store : refusé
    $this->actingAs($a['employeLabo'])->get('/store-slugb/dashboard')->assertForbidden();

    expect($b['store']->slug)->toBe('store-slugb');
});

test('l\'API caisse refuse une requête sans jeton', function () {
    creerTenant('Api1', 'store-api1');

    $this->postJson('/api/sync-caisse', [
        'entity_id' => 1, 'date' => now()->toDateString(), 'produits' => [],
    ])->assertUnauthorized();

    $this->getJson('/api/sync-caisse/getetab')->assertUnauthorized();
});

test('l\'API caisse refuse d\'écrire dans l\'entité d\'un autre store', function () {
    $a = creerTenant('Api2', 'store-api2');
    $b = creerTenant('Api3', 'store-api3');

    // Jeton du store A
    $a['store']->api_token = 'caisse_test_token_a';
    $a['store']->save();

    // Avec son jeton, A ne peut pas viser l'entité de B.
    // `produits` doit être non vide : la validation s'exécute avant le contrôle
    // d'appartenance, un tableau vide renverrait 422 au lieu de 403.
    $this->withHeader('X-Caisse-Token', 'caisse_test_token_a')
        ->postJson('/api/sync-caisse', [
            'entity_id' => $b['boutique']->id,
            'date' => now()->toDateString(),
            'produits' => [
                ['nom_produit' => 'Croissant', 'qte' => 3],
            ],
        ])
        ->assertForbidden();

    // getEtab ne liste que les entités de A
    $response = $this->withHeader('X-Caisse-Token', 'caisse_test_token_a')
        ->getJson('/api/sync-caisse/getetab')
        ->assertOk();

    $ids = collect($response->json('etabs'))->pluck('id')->all();

    expect($ids)->toContain($a['labo']->id)
        ->and($ids)->not->toContain($b['boutique']->id);
});
