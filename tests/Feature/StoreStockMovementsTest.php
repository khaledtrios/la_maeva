<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Support\CurrentStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('stores', 'stock');

/**
 * Stock boutique de l'espace Store Admin (/store/stock).
 *
 * Défauts couverts :
 *   1. URI — l'espace Store exposait `/store/stockS` (pluriel) alors que
 *      l'espace Employé utilise `/stock` et que les pages CRM, partagées entre
 *      les deux, génèrent des liens au singulier (« /stock/movements »). Le
 *      filet de app.tsx les préfixant en « /store/stock/movements », le lien
 *      « Historique des mouvements » tombait sur un 404.
 *   2. GUARD — `authorizeRole()` lisait `Auth::user()` (guard "web"), null pour
 *      un Store Admin : erreur fatale sur `$user->role` AVANT le contrôle, alors
 *      même que STORE_ADMIN figure dans la liste autorisée.
 *   3. ATTRIBUTION — `stock_movements.created_by` référence `users`, or un
 *      Store Admin vit dans `store_users`.
 */

function tenantStock(string $label = 'A'): array
{
    $store = Store::factory()->active()->create(['name' => "Store {$label}"]);
    $boutique = creerEntite($store->id, 'BOULANGERIE', "Boutique {$label}", "1 rue {$label}");
    $store->entity_id = $boutique->id;
    $store->save();

    // Ids décalés : sinon StoreUser#1 coïncide avec User#1 et le bug
    // d'attribution reste invisible.
    DB::statement('ALTER TABLE store_users AUTO_INCREMENT = 500');

    $storeAdmin = StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'admin.' . strtolower($label) . '@example.test',
    ]);

    $employe = User::create([
        'entity_id' => $boutique->id,
        'store_id' => $store->id,
        'nom' => "Interne {$label}",
        'pin' => User::hashPin('1234'),
        'role' => 'RESP_BOUTIQUE',
        'active' => true,
        'auth_type' => 'PIN',
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

    return compact('store', 'boutique', 'storeAdmin', 'employe', 'product');
}

test('les URI du stock boutique suivent la convention /store + chemin employé', function () {
    foreach ([
        ['/store/stock', 'GET', 'index'],
        ['/store/stock/movements', 'GET', 'movements'],
        ['/store/stock/adjust', 'POST', 'adjust'],
    ] as [$uri, $method, $action]) {
        $route = app('router')->getRoutes()->match(
            Illuminate\Http\Request::create($uri, $method)
        );

        expect($route->getActionName())
            ->toBe("App\Http\Controllers\StockController@{$action}");
    }
});

test('le lien « Historique des mouvements » ne renvoie plus 404', function () {
    $t = tenantStock();

    // C'est l'URL que produit app.tsx a partir du lien « /stock/movements »
    // de la page partagee Stock/Index.
    $this->actingAs($t['storeAdmin'], 'store')
        ->get('/store/stock/movements')
        ->assertOk();
});

test('un Store Admin consulte le stock de sa boutique', function () {
    $t = tenantStock();

    $this->actingAs($t['storeAdmin'], 'store')
        ->get('/store/stock')
        ->assertOk();
});

test('un Store Admin ajuste le stock boutique sans erreur de guard', function () {
    $t = tenantStock();

    // Le lot doit exister pour etre ajuste : on cree d'abord une entree.
    App\Services\StockMovementService::createProductEntree(
        $t['boutique']->id,
        $t['product']->id,
        10,
        Carbon\Carbon::parse('2026-12-31'),
        ['lot_number' => 'LOT-A', 'created_by' => $t['employe']->id]
    );

    $this->actingAs($t['storeAdmin'], 'store')->post('/store/stock/adjust', [
        'product_id' => $t['product']->id,
        'quantite_delta' => -2,
        'raison' => 'Casse',
        'lot_number' => 'LOT-A',
    ])->assertRedirect();

    $mouvement = DB::table('stock_movements')
        ->where('store_id', $t['store']->id)
        ->where('type', 'WASTE')
        ->first();

    expect($mouvement)->not->toBeNull();
    expect($mouvement->created_by)->toBe($t['employe']->id);
    expect($mouvement->created_by)->not->toBe($t['storeAdmin']->id);
});
