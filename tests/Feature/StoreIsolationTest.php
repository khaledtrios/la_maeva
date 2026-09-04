<?php

use App\Models\Category;
use App\Models\Entity;
use App\Models\Facture;
use App\Models\HaccpNonConformite;
use App\Models\Product;
use App\Models\Production;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('stores', 'isolation');

/**
 * Isolation multi-tenant de l'espace Store Admin (guard "store").
 *
 * Chaque test monte DEUX tenants complets : le store A (dont on utilise le
 * compte) et le store B (dont les données ne doivent jamais être atteignables).
 * On vérifie systématiquement les deux sens :
 *   - refus sur la ressource de B (403) ;
 *   - succès sur la ressource de A.
 * Sans ce second cas, un test « tout est 403 » resterait vert même si
 * l'application était entièrement cassée.
 */

/** Crée un tenant : une boulangerie (entité du store), un labo, un store actif et son admin. */
$makeTenant = function (string $label): array {
    // `entities.store_id` est NOT NULL (vague 3a) : le store existe d'abord, ses
    // entités sont ensuite créées dans son contexte.
    $store = Store::factory()->active()->create([
        'name' => "Store {$label}",
    ]);

    $boulangerie = creerEntite($store->id, 'BOULANGERIE', "Boulangerie {$label}", "1 rue {$label}");
    $labo = creerEntite($store->id, 'LABO', "Labo {$label}", "2 rue {$label}");

    // Le store pointe SA boulangerie : c'est cet entity_id qui sert de frontière
    // de cloisonnement dans les contrôleurs (getCurrentEntityId).
    $store->entity_id = $boulangerie->id;
    $store->save();

    $storeAdmin = StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'admin.' . strtolower($label) . '@example.test',
    ]);

    // Utilisateur interne requis pour les colonnes created_by / generated_by.
    $internal = User::create([
        'entity_id' => $labo->id,
        'nom' => "Interne {$label}",
        'pin' => User::hashPin('1234'),
        'role' => 'RESP_LABO',
        'active' => true,
    ]);

    return compact('boulangerie', 'labo', 'store', 'storeAdmin', 'internal');
};

/** Crée une facture émise par le labo du tenant vers sa boulangerie. */
$makeFacture = function (array $tenant, string $numero, string $statut = 'BROUILLON'): Facture {
    return Facture::create([
        'numero' => $numero,
        'entity_id' => $tenant['labo']->id,
        'boulangerie_id' => $tenant['boulangerie']->id,
        'periode_type' => 'MOIS',
        'date_debut' => '2026-01-01',
        'date_fin' => '2026-01-31',
        'montant_total' => 100.00,
        'statut' => $statut,
        'generated_by' => $tenant['internal']->id,
    ]);
};

$makeProduction = function (array $tenant, int $entityId): Production {
    // Catalogue créé dans le contexte du store : `categories.store_id` et
    // `products.store_id` sont NOT NULL (vague 3a) et se déduisent du contexte.
    $product = App\Support\CurrentStore::for($tenant['store']->id, function () {
        $category = Category::create(['nom' => 'Cat ' . uniqid()]);

        return Product::create([
            'category_id' => $category->id,
            'nom' => 'Pain ' . uniqid(),
            'prix_vente' => 2.00,
            'cout_revient' => 1.00,
        ]);
    });

    return Production::create([
        'entity_id' => $entityId,
        'product_id' => $product->id,
        'quantite' => 10,
        'quantite_pertes' => 0,
        'date' => '2026-01-15',
        'created_by' => $tenant['internal']->id,
    ]);
};

$makeNonConformite = function (array $tenant, int $entityId): HaccpNonConformite {
    return HaccpNonConformite::create([
        'entity_id' => $entityId,
        'type' => 'TEMPERATURE',
        'description' => 'Test NC',
        'statut' => 'OUVERTE',
        'date' => '2026-01-15',
        'created_by' => $tenant['internal']->id,
    ]);
};

// ============================================
// FACTURES — F4 / F5
// ============================================

test('un Store Admin ne peut pas payer la facture d\'un autre store', function () use ($makeTenant, $makeFacture) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $factureB = $makeFacture($b, 'FA-B-001', 'EMISE');

    // Depuis l'activation de StoreScope sur Facture (Phase 4, étape 5,
    // groupe 7), le route-model-binding ne trouve plus la facture d'un autre
    // store : 404, et non plus 403 (même mécanisme que les groupes 2 et 4 —
    // le contrôle manuel d'authorizeView() devient une défense en profondeur).
    // Le blocage reste tout aussi effectif.
    $this->actingAs($a['storeAdmin'], 'store')
        ->put("/store/facturation/{$factureB->id}/pay")
        ->assertNotFound();

    expect($factureB->fresh()->statut)->toBe('EMISE');
});

test('un Store Admin ne peut pas annuler la facture d\'un autre store', function () use ($makeTenant, $makeFacture) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $factureB = $makeFacture($b, 'FA-B-002', 'EMISE');

    // Depuis l'activation de StoreScope sur Facture (Phase 4, étape 5,
    // groupe 7), le route-model-binding ne trouve plus la facture d'un autre
    // store : 404, et non plus 403.
    $this->actingAs($a['storeAdmin'], 'store')
        ->put("/store/facturation/{$factureB->id}/cancel", ['raison' => 'test'])
        ->assertNotFound();

    expect($factureB->fresh()->statut)->toBe('EMISE');
});

test('un Store Admin ne peut pas supprimer la facture brouillon d\'un autre store', function () use ($makeTenant, $makeFacture) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $factureB = $makeFacture($b, 'FA-B-003', 'BROUILLON');

    // Depuis l'activation de StoreScope sur Facture (Phase 4, étape 5,
    // groupe 7), le route-model-binding ne trouve plus la facture d'un autre
    // store : 404, et non plus 403.
    $this->actingAs($a['storeAdmin'], 'store')
        ->delete("/store/facturation/{$factureB->id}")
        ->assertNotFound();

    $this->assertDatabaseHas('factures', ['id' => $factureB->id]);
});

test('un Store Admin ne peut pas consulter la facture d\'un autre store mais consulte la sienne', function () use ($makeTenant, $makeFacture) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $factureA = $makeFacture($a, 'FA-A-001', 'EMISE');
    $factureB = $makeFacture($b, 'FA-B-004', 'EMISE');

    // Refus sur la facture de B — depuis l'activation de StoreScope (groupe
    // 7), le route-model-binding ne trouve plus la facture d'un autre store :
    // 404, et non plus 403.
    $this->actingAs($a['storeAdmin'], 'store')
        ->get("/store/facturation/{$factureB->id}")
        ->assertNotFound();

    // ... mais accès à la sienne : prouve que le 403 ci-dessus est bien du
    // cloisonnement et non un blocage général de la route.
    $this->actingAs($a['storeAdmin'], 'store')
        ->get("/store/facturation/{$factureA->id}")
        ->assertOk();
});

test('un Store Admin ne peut pas générer une facture pour une entité qui n\'est pas la sienne', function () use ($makeTenant) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');

    $this->actingAs($a['storeAdmin'], 'store')
        ->post('/store/facturation', [
            'boulangerie_id' => $b['boulangerie']->id,
            'entity_id' => $b['labo']->id,
            'periode_type' => 'MOIS',
            'date_debut' => '2026-02-01',
            'date_fin' => '2026-02-28',
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('factures', 0);
});

test('le formulaire de facture n\'expose pas les entités des autres stores', function () use ($makeTenant) {
    $a = $makeTenant('A');
    $makeTenant('B');

    $this->actingAs($a['storeAdmin'], 'store')
        ->get('/store/facturation/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            // Seule sa propre boulangerie est proposée, pas celle de B
            ->has('boutiques', 1)
            ->where('boutiques.0.id', $a['boulangerie']->id)
            // Aucun labo : son entité est une boulangerie
            ->has('labos', 0)
        );
});

// ============================================
// PRODUCTION — F2
// ============================================

test('un Store Admin ne peut pas modifier la production d\'un autre store', function () use ($makeTenant, $makeProduction) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $productionB = $makeProduction($b, $b['boulangerie']->id);

    // Depuis l'activation de StoreScope sur Production (Phase 4, étape 5,
    // groupe 4), le route-model-binding ne trouve plus la production d'un
    // autre store : 404, et non plus 403 (même mécanisme que le groupe 2 sur
    // HaccpNonConformite — le contrôle manuel du contrôleur devient une
    // défense en profondeur). Le blocage reste tout aussi effectif.
    $this->actingAs($a['storeAdmin'], 'store')
        ->put("/store/production/{$productionB->id}", ['quantite' => 999])
        ->assertNotFound();

    expect($productionB->fresh()->quantite)->toBe(10);
});

test('un Store Admin ne peut pas supprimer la production d\'un autre store mais peut supprimer la sienne', function () use ($makeTenant, $makeProduction) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $productionA = $makeProduction($a, $a['boulangerie']->id);
    $productionB = $makeProduction($b, $b['boulangerie']->id);

    // Meme mecanisme que le test precedent : StoreScope bloque desormais le
    // route-model-binding lui-meme -> 404 au lieu de 403.
    $this->actingAs($a['storeAdmin'], 'store')
        ->delete("/store/production/{$productionB->id}")
        ->assertNotFound();
    $this->assertDatabaseHas('productions', ['id' => $productionB->id]);

    // Cas positif : sa propre production
    $this->actingAs($a['storeAdmin'], 'store')
        ->delete("/store/production/{$productionA->id}");
    $this->assertDatabaseMissing('productions', ['id' => $productionA->id]);
});

// ============================================
// NON-CONFORMITÉS — F3
// ============================================

test('un Store Admin ne peut pas modifier la non-conformité d\'un autre store mais peut modifier la sienne', function () use ($makeTenant, $makeNonConformite) {
    $a = $makeTenant('A');
    $b = $makeTenant('B');
    $ncA = $makeNonConformite($a, $a['boulangerie']->id);
    $ncB = $makeNonConformite($b, $b['boulangerie']->id);

    // Depuis l'activation de StoreScope sur HaccpNonConformite (Phase 4, étape 5,
    // groupe 2), le route-model-binding lui-même ne trouve plus la ligne d'un
    // autre store (elle est filtrée avant que le contrôleur ne s'exécute) : la
    // réponse est donc 404, et non plus 403 (le contrôle manuel du contrôleur
    // devient une défense en profondeur, plus la première ligne de défense).
    // Le blocage reste tout aussi effectif : le statut n'est pas modifié.
    $this->actingAs($a['storeAdmin'], 'store')
        ->put("/store/nonconformites/{$ncB->id}", ['statut' => 'RESOLUE', 'action' => 'pirate'])
        ->assertNotFound();
    expect($ncB->fresh()->statut)->toBe('OUVERTE');

    // Cas positif : sa propre non-conformité
    $this->actingAs($a['storeAdmin'], 'store')
        ->put("/store/nonconformites/{$ncA->id}", ['statut' => 'RESOLUE', 'action' => 'corrigé']);
    expect($ncA->fresh()->statut)->toBe('RESOLUE');
});

// ============================================
// REPORTING — F1
// ============================================

test('le reporting d\'un Store Admin ne contient que sa propre boulangerie', function () use ($makeTenant) {
    $a = $makeTenant('A');
    $makeTenant('B');

    $this->actingAs($a['storeAdmin'], 'store')
        ->get('/store/reporting')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('by_boulangerie', 1)
            ->where('by_boulangerie.0.entity.id', $a['boulangerie']->id)
        );
});

// ============================================
// PÉRIMÈTRE GLOBAL — entités & réglages plateforme
// ============================================

test('un Store Admin ne voit que son entité dans le panneau admin', function () use ($makeTenant) {
    $a = $makeTenant('A');
    $makeTenant('B');

    $this->actingAs($a['storeAdmin'], 'store')
        ->get('/store/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Index')
            ->has('entities', 1)
            ->where('entities.0.id', $a['boulangerie']->id)
            // Les réglages globaux de facturation ne sont jamais transmis
            ->where('facture_settings', [])
        );
});

test('les routes globales entités et réglages de facturation n\'existent pas dans l\'espace store', function () use ($makeTenant) {
    $a = $makeTenant('A');

    $this->actingAs($a['storeAdmin'], 'store')
        ->post('/store/admin/entities', ['type' => 'LABO', 'nom' => 'Pirate'])
        ->assertNotFound();

    $this->actingAs($a['storeAdmin'], 'store')
        ->get('/store/admin/facture-settings')
        ->assertNotFound();

    $this->assertDatabaseMissing('entities', ['nom' => 'Pirate']);
});
