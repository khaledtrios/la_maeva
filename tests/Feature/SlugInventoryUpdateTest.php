<?php

use App\Models\Ingredient;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Support\CurrentStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('stores', 'inventory', 'slug');

/**
 * Mise à jour d'un ingrédient depuis l'espace EMPLOYÉ (/{slug}/inventory).
 *
 * Défaut couvert : les routes inventaire existent en deux déclinaisons,
 * `/{slug}/inventory/{ingredient}` (employé) et `/store/inventory/{ingredient}`
 * (Store Admin). Laravel injecte les paramètres de route PAR POSITION : avec
 * `update(Request $request, Ingredient $ingredient)`, la variante /{slug}
 * passait le SLUG (string) à la place du modèle, d'où
 *   « Argument #2 ($ingredient) must be of type App\Models\Ingredient, string given ».
 * La résolution se fait désormais PAR NOM de paramètre, comme
 * ProductController::resolveProduct() le faisait déjà.
 */

function tenantSlug(string $label = 'A'): array
{
    $store = Store::factory()->active()->create([
        'name' => "Labo Maeva {$label}",
        'slug' => 'labo-maeva-' . strtolower($label) . '-store',
    ]);

    $labo = creerEntite($store->id, 'LABO', "Labo {$label}", "1 rue {$label}");
    $store->entity_id = $labo->id;
    $store->save();

    DB::statement('ALTER TABLE store_users AUTO_INCREMENT = 500');
    StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'admin.' . strtolower($label) . '@example.test',
    ]);

    // L'employe : guard "web", c'est lui qui navigue sous /{slug}.
    $chef = User::create([
        'entity_id' => $labo->id,
        'store_id' => $store->id,
        'nom' => "Chef Labo {$label}",
        'role' => 'RESP_LABO',
        'pin' => User::hashPin('1234'),
        'active' => true,
        'auth_type' => 'PIN',
    ]);

    $ingredient = CurrentStore::for($store->id, fn () => Ingredient::create([
        'nom' => "Beurre AOP {$label}",
        'unite' => 'kg',
        'prix_unitaire' => 8.50,
    ]));

    return compact('store', 'labo', 'chef', 'ingredient');
}

test('un employé met à jour les seuils sous /{slug}/inventory sans TypeError', function () {
    $t = tenantSlug();

    $this->actingAs($t['chef'], 'web')
        ->put("/{$t['store']->slug}/inventory/{$t['ingredient']->id}", [
            'seuil_minimum' => 2,
            'stock_max' => 40,
        ])->assertRedirect();

    $this->assertDatabaseHas('ingredient_thresholds', [
        'entity_id' => $t['labo']->id,
        'store_id' => $t['store']->id,
        'ingredient_id' => $t['ingredient']->id,
        'seuil_minimum' => 2,
        'stock_max' => 40,
    ]);
});

test('le slug n\'est jamais pris pour un identifiant d\'ingrédient', function () {
    $t = tenantSlug();

    // Avant correction, le SLUG arrivait dans $ingredient : la requete explosait
    // en TypeError (500) au lieu d'atteindre le bon ingredient.
    $response = $this->actingAs($t['chef'], 'web')
        ->put("/{$t['store']->slug}/inventory/{$t['ingredient']->id}", [
            'seuil_minimum' => 3,
            'stock_max' => 30,
        ]);

    expect($response->getStatusCode())->not->toBe(500);

    $seuil = DB::table('ingredient_thresholds')
        ->where('ingredient_id', $t['ingredient']->id)
        ->value('seuil_minimum');

    expect((float) $seuil)->toBe(3.0);
});

test('un ingrédient inexistant renvoie 404, pas 500', function () {
    $t = tenantSlug();

    $this->actingAs($t['chef'], 'web')
        ->put("/{$t['store']->slug}/inventory/999999", [
            'seuil_minimum' => 1,
        ])->assertNotFound();
});

test('la variante /store/inventory/{ingredient} fonctionne toujours', function () {
    $t = tenantSlug();
    $storeAdmin = StoreUser::where('store_id', $t['store']->id)->firstOrFail();

    $this->actingAs($storeAdmin, 'store')
        ->put("/store/inventory/{$t['ingredient']->id}", [
            'seuil_minimum' => 9,
            'stock_max' => 90,
        ])->assertRedirect();

    $this->assertDatabaseHas('ingredient_thresholds', [
        'ingredient_id' => $t['ingredient']->id,
        'seuil_minimum' => 9,
        'stock_max' => 90,
    ]);
});
