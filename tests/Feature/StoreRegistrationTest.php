<?php

use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class)->group('stores');

test('un visiteur peut afficher le formulaire d\'inscription boutique', function () {
    $response = $this->get('/register');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Store/Register'));
});

test('une inscription valide crée une boutique en attente et son compte propriétaire', function () {
    $payload = [
        'name' => 'Boulangerie du Coin',
        'owner_name' => 'Jean Dupont',
        'email' => 'jean.dupont@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->post('/register', $payload);

    $response->assertRedirect(route('store.login'));

    expect(Store::count())->toBe(1);
    expect(StoreUser::count())->toBe(1);

    $store = Store::first();
    expect($store->name)->toBe('Boulangerie du Coin');
    expect($store->fresh()->status->value)->toBe('PENDING');

    $storeUser = StoreUser::first();
    expect($storeUser->store_id)->toBe($store->id);
    expect($storeUser->email)->toBe('jean.dupont@example.com');
    expect($storeUser->name)->toBe('Jean Dupont');

    // Le mot de passe ne doit jamais être stocké en clair.
    expect($storeUser->password)->not->toBe('password123');
    expect(Hash::check('password123', $storeUser->password))->toBeTrue();
});

test('une inscription avec un email déjà utilisé échoue et ne crée pas de nouvelle boutique', function () {
    $existing = StoreUser::factory()->create(['email' => 'deja.pris@example.com']);

    $payload = [
        'name' => 'Autre Boutique',
        'owner_name' => 'Marie Martin',
        'email' => 'deja.pris@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->post('/register', $payload);

    $response->assertInvalid(['email']);

    // Une seule boutique doit exister : celle liée au store user déjà existant.
    expect(Store::count())->toBe(1);
    expect(Store::first()->id)->toBe($existing->store_id);
});

test('une inscription avec une confirmation de mot de passe différente échoue', function () {
    $payload = [
        'name' => 'Boulangerie Test',
        'owner_name' => 'Paul Petit',
        'email' => 'paul.petit@example.com',
        'password' => 'password123',
        'password_confirmation' => 'autrepassword',
    ];

    $response = $this->post('/register', $payload);

    $response->assertInvalid(['password']);
    expect(Store::count())->toBe(0);
    expect(StoreUser::count())->toBe(0);
});

test('une inscription sans le nom de la boutique échoue', function () {
    $payload = [
        'owner_name' => 'Paul Petit',
        'email' => 'paul.petit2@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->post('/register', $payload);

    $response->assertInvalid(['name']);
    expect(Store::count())->toBe(0);
    expect(StoreUser::count())->toBe(0);
});
