<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Support\CurrentStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('stores', 'production');

/**
 * Feuille de production « Enregistrer tout » depuis l'espace Store Admin.
 *
 * Ces tests couvrent le 405 rapporté en production : la page Production/Index
 * est partagée entre l'espace Employé et l'espace Store Admin et appelle
 * `/production/batch` ; le filet de `resources/js/app.tsx` réécrit cette URL en
 * `/store/production/batch` pour le guard "store". Cette route n'existait pas —
 * la requête retombait sur `PUT|DELETE /store/production/{production}` avec
 * « batch » pris pour un identifiant, d'où le
 * MethodNotAllowedHttpException « Supported methods: PUT, DELETE ».
 */

/** Monte un tenant complet : store actif, labo, admin boutique, employé interne. */
function tenantProduction(string $label = 'A'): array
{
    $store = Store::factory()->active()->create(['name' => "Store {$label}"]);

    $labo = creerEntite($store->id, 'LABO', "Labo {$label}", "1 rue {$label}");

    // `getCurrentEntityId()` lit `stores.entity_id` pour le guard "store" :
    // sans ce rattachement, le Store Admin n'a aucune entité de travail.
    $store->entity_id = $labo->id;
    $store->save();

    // Les ids de `store_users` sont DÉCALÉS volontairement : les deux tables
    // partent sinon de 1 et un StoreUser#1 tombe par coïncidence sur User#1,
    // ce qui masque complètement le bug d'attribution de `created_by` (la FK
    // est satisfaite « par chance » et le test reste vert même cassé).
    DB::statement('ALTER TABLE store_users AUTO_INCREMENT = 500');

    $storeAdmin = StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'admin.' . strtolower($label) . '@example.test',
    ]);

    $employe = User::create([
        'entity_id' => $labo->id,
        'store_id' => $store->id,
        'nom' => "Interne {$label}",
        'pin' => User::hashPin('1234'),
        'role' => 'RESP_LABO',
        'active' => true,
    ]);

    $product = CurrentStore::for($store->id, function () {
        $category = Category::create(['nom' => 'Pains']);

        return Product::create([
            'category_id' => $category->id,
            'nom' => 'Baguette tradition',
            'prix_vente' => 1.20,
            'cout_revient' => 0.40,
        ]);
    });

    return compact('store', 'labo', 'storeAdmin', 'employe', 'product');
}

test('la route /store/production/batch existe et accepte POST', function () {
    $t = tenantProduction();

    $response = $this->actingAs($t['storeAdmin'], 'store')->post('/store/production/batch', [
        'date' => '2026-01-15',
        'productions' => [[
            'product_id' => $t['product']->id,
            'quantite' => 5,
            'quantite_pertes' => 1,
            'lot' => 'L-001',
        ]],
    ]);

    // Le symptôme d'origine : 405 Method Not Allowed.
    expect($response->getStatusCode())->not->toBe(405);
    $response->assertRedirect();
});

test('un Store Admin enregistre la feuille de production de son store', function () {
    $t = tenantProduction();

    $this->actingAs($t['storeAdmin'], 'store')->post('/store/production/batch', [
        'date' => '2026-01-15',
        'productions' => [[
            'product_id' => $t['product']->id,
            'quantite' => 5,
            'quantite_pertes' => 1,
            'lot' => 'L-001',
        ]],
    ])->assertRedirect();

    $this->assertDatabaseHas('productions', [
        'entity_id' => $t['labo']->id,
        'store_id' => $t['store']->id,
        'product_id' => $t['product']->id,
        'quantite' => 5,
        'quantite_pertes' => 1,
        'lot' => 'L-001',
    ]);
});

test('la production enregistrée est rattachée au store et à un auteur réel', function () {
    $t = tenantProduction();

    $this->actingAs($t['storeAdmin'], 'store')->post('/store/production/batch', [
        'date' => '2026-01-15',
        'productions' => [[
            'product_id' => $t['product']->id,
            'quantite' => 3,
            'quantite_pertes' => 0,
            'lot' => 'L-002',
        ]],
    ])->assertRedirect();

    $production = App\Models\Production::withoutGlobalScopes()->firstOrFail();

    // `productions.created_by` porte une FK vers `users` : l'identifiant d'un
    // StoreUser n'y est pas valide et doit être résolu vers un vrai employé
    // DU MÊME STORE, jamais emprunté à un autre tenant.
    expect($production->store_id)->toBe($t['store']->id);
    expect($production->created_by)->toBe($t['employe']->id);
    expect($production->created_by)->not->toBe($t['storeAdmin']->id);
    $this->assertDatabaseHas('users', [
        'id' => $production->created_by,
        'store_id' => $t['store']->id,
    ]);
});

test('aucune production n\'est attribuée à un employé d\'un autre store', function () {
    $autre = tenantProduction('B');
    $t = tenantProduction('A');

    $this->actingAs($t['storeAdmin'], 'store')->post('/store/production/batch', [
        'date' => '2026-01-15',
        'productions' => [[
            'product_id' => $t['product']->id,
            'quantite' => 2,
            'quantite_pertes' => 0,
            'lot' => 'L-003',
        ]],
    ])->assertRedirect();

    $production = App\Models\Production::withoutGlobalScopes()
        ->where('store_id', $t['store']->id)
        ->firstOrFail();

    expect($production->created_by)->toBe($t['employe']->id);
    expect($production->created_by)->not->toBe($autre['employe']->id);
});

