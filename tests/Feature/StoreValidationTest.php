<?php

use App\Enums\StoreStatus;
use App\Enums\StoreValidationAction;
use App\Models\Entity;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\StoreValidationLog;
use App\Models\SuperAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class)->group('stores');

// Helper pour créer un utilisateur interne (même pattern que CommandeUrgenteTest.php).
$makeInternalUser = function (string $role) {
    $entity = Entity::create([
        'type' => 'LABO',
        'nom' => 'Labo Test',
        'adresse' => '123 rue Labo',
    ]);

    return User::create([
        'entity_id' => $entity->id,
        'nom' => 'Utilisateur Test',
        'pin' => User::hashPin('0000'),
        'role' => $role,
        'active' => true,
    ]);
};

test('un super admin peut consulter la liste des boutiques et voir une boutique en attente', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->create(['name' => 'Boutique En Attente']);

    $response = $this->actingAs($admin, 'super_admin')->get('/super-admin/stores');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('SuperAdmin/Stores/Index')
        ->has('stores', 1)
        ->where('stores.0.id', $store->id)
        ->where('stores.0.name', 'Boutique En Attente')
        ->where('stores.0.status', 'PENDING')
    );
});

test('un utilisateur interne (ADMIN inclus) ne peut accéder à aucune route super-admin/stores', function () use ($makeInternalUser) {
    $internalAdmin = $makeInternalUser('ADMIN');
    $store = Store::factory()->create();

    $this->actingAs($internalAdmin)->get('/super-admin/stores')
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($internalAdmin)->post("/super-admin/stores/{$store->id}/approve")
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($internalAdmin)->post("/super-admin/stores/{$store->id}/reject")
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($internalAdmin)->post("/super-admin/stores/{$store->id}/suspend")
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($internalAdmin)->post("/super-admin/stores/{$store->id}/reactivate")
        ->assertRedirect(route('superadmin.login'));

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Pending);
});

test('un utilisateur boutique (store_users, admin d\'une autre boutique) ne peut accéder à aucune route super-admin/stores', function () {
    $otherStore = Store::factory()->active()->create();
    $storeUser = StoreUser::factory()->create(['store_id' => $otherStore->id]);
    $store = Store::factory()->create();

    $this->actingAs($storeUser, 'store')->get('/super-admin/stores')
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($storeUser, 'store')->post("/super-admin/stores/{$store->id}/approve")
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($storeUser, 'store')->post("/super-admin/stores/{$store->id}/reject")
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($storeUser, 'store')->post("/super-admin/stores/{$store->id}/suspend")
        ->assertRedirect(route('superadmin.login'));
    $this->actingAs($storeUser, 'store')->post("/super-admin/stores/{$store->id}/reactivate")
        ->assertRedirect(route('superadmin.login'));

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Pending);
});

test('un super admin peut valider une boutique en attente', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->create();

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/approve");

    $response->assertRedirect();

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Active);
    expect($store->status_changed_by)->toBe($admin->id);
    expect($store->status_changed_at)->not->toBeNull();

    $this->assertDatabaseHas('store_validation_logs', [
        'store_id' => $store->id,
        'action' => StoreValidationAction::Approved->value,
        'performed_by' => $admin->id,
    ]);
});

test('un super admin peut refuser une boutique en attente avec un motif', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->create();

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/reject", [
        'reason' => 'Documents manquants',
    ]);

    $response->assertRedirect();

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Rejected);
    expect($store->status_reason)->toBe('Documents manquants');

    $this->assertDatabaseHas('store_validation_logs', [
        'store_id' => $store->id,
        'action' => StoreValidationAction::Rejected->value,
        'reason' => 'Documents manquants',
        'performed_by' => $admin->id,
    ]);
});

test('valider une boutique déjà active échoue sans dupliquer le journal ni changer status_changed_at', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->active()->create();
    $store->refresh();
    $originalStatusChangedAt = $store->status_changed_at;

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/approve");

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Active);
    expect($store->status_changed_at->equalTo($originalStatusChangedAt))->toBeTrue();
    expect(StoreValidationLog::where('store_id', $store->id)->count())->toBe(0);
});

test('un super admin peut suspendre une boutique active avec un motif', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->active()->create();

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/suspend", [
        'reason' => 'Non-respect des conditions',
    ]);

    $response->assertRedirect();

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Suspended);
    expect($store->status_reason)->toBe('Non-respect des conditions');

    $this->assertDatabaseHas('store_validation_logs', [
        'store_id' => $store->id,
        'action' => StoreValidationAction::Suspended->value,
        'reason' => 'Non-respect des conditions',
        'performed_by' => $admin->id,
    ]);
});

test('suspendre une boutique en attente échoue', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->create();

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/suspend");

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Pending);
});

test('un super admin peut réactiver une boutique suspendue', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->suspended()->create();

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/reactivate");

    $response->assertRedirect();

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Active);
    expect($store->status_reason)->toBeNull();

    $this->assertDatabaseHas('store_validation_logs', [
        'store_id' => $store->id,
        'action' => StoreValidationAction::Reactivated->value,
        'performed_by' => $admin->id,
    ]);
});

test('réactiver une boutique active échoue', function () {
    $admin = SuperAdmin::factory()->create();
    $store = Store::factory()->active()->create();

    $response = $this->actingAs($admin, 'super_admin')->post("/super-admin/stores/{$store->id}/reactivate");

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $store->refresh();
    expect($store->status)->toBe(StoreStatus::Active);
});

test('un visiteur non authentifié ne peut accéder à aucune route super-admin/stores', function () {
    $store = Store::factory()->create();

    $this->get('/super-admin/stores')->assertRedirect(route('superadmin.login'));
    $this->post("/super-admin/stores/{$store->id}/approve")->assertRedirect(route('superadmin.login'));
    $this->post("/super-admin/stores/{$store->id}/reject")->assertRedirect(route('superadmin.login'));
    $this->post("/super-admin/stores/{$store->id}/suspend")->assertRedirect(route('superadmin.login'));
    $this->post("/super-admin/stores/{$store->id}/reactivate")->assertRedirect(route('superadmin.login'));
});

test('il n\'existe aucune route d\'inscription publique pour un super admin', function () {
    $this->get('/super-admin/register')->assertNotFound();
    $this->post('/super-admin/register')->assertNotFound();

    expect(Route::has('superadmin.register'))->toBeFalse();

    $superAdminRouteNames = collect(Route::getRoutes())
        ->map(fn ($route) => $route->getName())
        ->filter()
        ->filter(fn (string $name) => str_starts_with($name, 'superadmin.'))
        ->values();

    expect($superAdminRouteNames->contains(fn (string $name) => str_contains($name, 'register')))->toBeFalse();

    expect($superAdminRouteNames->sort()->values()->all())->toBe([
        'superadmin.login',
        'superadmin.login.submit',
        'superadmin.logout',
        'superadmin.stores.approve',
        'superadmin.stores.index',
        'superadmin.stores.reactivate',
        'superadmin.stores.reject',
        'superadmin.stores.suspend',
    ]);
});
