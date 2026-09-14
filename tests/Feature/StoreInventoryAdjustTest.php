<?php

use App\Models\Ingredient;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Support\CurrentStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('stores', 'inventory');

/**
 * Ajustement de stock depuis l'espace Store Admin (/store/inventory).
 *
 * Trois défauts empêchaient toute modification et sont couverts ici :
 *   1. ROUTE — `PUT /store/inventory/adjust-batch` était déclarée APRÈS
 *      `PUT /store/inventory/{ingredient}` ; Laravel retenant la première route
 *      qui correspond, la requête partait dans `update()` avec « adjust-batch »
 *      pour identifiant d'ingrédient.
 *   2. GUARD — `adjustBatch()`/`update()` lisaient `Auth::user()` (guard "web"),
 *      null pour un Store Admin, d'où une erreur fatale sur `->entity_id`.
 *   3. ATTRIBUTION — `stock_movements.created_by` référence `users`, alors
 *      qu'un Store Admin vit dans `store_users`.
 */

/** Monte un tenant complet avec un ingrédient au catalogue du store. */
function tenantInventaire(string $label = 'A'): array
{
    $store = Store::factory()->active()->create(['name' => "Store {$label}"]);
    $labo = creerEntite($store->id, 'LABO', "Labo {$label}", "1 rue {$label}");
    $store->entity_id = $labo->id;
    $store->save();

    // Ids décalés : sinon StoreUser#1 tombe sur User#1 et le bug
    // d'attribution de `created_by` reste invisible.
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
        'auth_type' => 'PIN',
    ]);

    $ingredient = CurrentStore::for($store->id, fn () => Ingredient::create([
        'nom' => "Farine {$label}",
        'unite' => 'kg',
        'prix_unitaire' => 0.80,
    ]));

    return compact('store', 'labo', 'storeAdmin', 'employe', 'ingredient');
}

test('PUT /store/inventory/adjust-batch atteint adjustBatch et non update', function () {
    $route = app('router')->getRoutes()->match(
        Illuminate\Http\Request::create('/store/inventory/adjust-batch', 'PUT')
    );

    expect($route->getActionName())
        ->toBe('App\Http\Controllers\InventoryController@adjustBatch');
});

test('PUT /store/inventory/{ingredient} atteint toujours update', function () {
    $route = app('router')->getRoutes()->match(
        Illuminate\Http\Request::create('/store/inventory/12', 'PUT')
    );

    expect($route->getActionName())
        ->toBe('App\Http\Controllers\InventoryController@update');
});

test('un Store Admin ajuste le stock de son labo', function () {
    $t = tenantInventaire();

    $this->actingAs($t['storeAdmin'], 'store')->put('/store/inventory/adjust-batch', [
        'adjustments' => [[
            'ingredient_id' => $t['ingredient']->id,
            'adjustment' => 5,
        ]],
    ])->assertRedirect();

    $this->assertDatabaseHas('stock_movements', [
        'entity_id' => $t['labo']->id,
        'ingredient_id' => $t['ingredient']->id,
        'store_id' => $t['store']->id,
    ]);
});

test('le mouvement de stock est attribué à un employé réel du même store', function () {
    $t = tenantInventaire();

    $this->actingAs($t['storeAdmin'], 'store')->put('/store/inventory/adjust-batch', [
        'adjustments' => [[
            'ingredient_id' => $t['ingredient']->id,
            'adjustment' => 5,
        ]],
    ])->assertRedirect();

    $mouvement = DB::table('stock_movements')
        ->where('store_id', $t['store']->id)
        ->first();

    expect($mouvement->created_by)->toBe($t['employe']->id);
    expect($mouvement->created_by)->not->toBe($t['storeAdmin']->id);
    $this->assertDatabaseHas('users', [
        'id' => $mouvement->created_by,
        'store_id' => $t['store']->id,
    ]);
});

test('un Store Admin met à jour les seuils de son ingrédient', function () {
    $t = tenantInventaire();

    $this->actingAs($t['storeAdmin'], 'store')
        ->put('/store/inventory/' . $t['ingredient']->id, [
            'seuil_minimum' => 7,
            'stock_max' => 70,
        ])->assertRedirect();

    $this->assertDatabaseHas('ingredient_thresholds', [
        'entity_id' => $t['labo']->id,
        'ingredient_id' => $t['ingredient']->id,
        'seuil_minimum' => 7,
        'stock_max' => 70,
    ]);
});
