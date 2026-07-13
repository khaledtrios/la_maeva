<?php

use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class)->group('stores');

beforeEach(function () {
    // Le rate limiter de connexion boutique s'appuie sur le cache par défaut (array en
    // testing) ; on le vide avant/après chaque test pour éviter toute pollution entre tests.
    Cache::flush();
});

afterEach(function () {
    Cache::flush();
});

test('un utilisateur d\'une boutique en attente ne peut pas se connecter même avec les bons identifiants', function () {
    // Store::factory() est PENDING par défaut (défaut de la migration).
    StoreUser::factory()->create([
        'email' => 'pending@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post('/store/login', [
        'email' => 'pending@example.com',
        'password' => 'password',
    ]);

    $response->assertInvalid(['email' => 'attente']);

    expect(auth('store')->check())->toBeFalse();
});

test('un utilisateur d\'une boutique refusée ne peut pas se connecter', function () {
    $store = Store::factory()->rejected()->create();
    StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'rejected@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post('/store/login', [
        'email' => 'rejected@example.com',
        'password' => 'password',
    ]);

    $response->assertInvalid(['email' => 'refus']);

    expect(auth('store')->check())->toBeFalse();
});

test('un utilisateur d\'une boutique suspendue ne peut pas se connecter', function () {
    $store = Store::factory()->suspended()->create();
    StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'suspended@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post('/store/login', [
        'email' => 'suspended@example.com',
        'password' => 'password',
    ]);

    $response->assertInvalid(['email' => 'suspendue']);

    expect(auth('store')->check())->toBeFalse();
});

test('un utilisateur d\'une boutique active peut se connecter et accède au tableau de bord', function () {
    $store = Store::factory()->active()->create();
    $storeUser = StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'active@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post('/store/login', [
        'email' => 'active@example.com',
        'password' => 'password',
    ]);

    $response->assertRedirect(route('store.dashboard'));

    expect(auth('store')->check())->toBeTrue();
    expect(auth('store')->id())->toBe($storeUser->id);
});

test('un mauvais mot de passe échoue avec une erreur générique ne révélant pas l\'existence du compte', function () {
    $store = Store::factory()->active()->create();
    StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'active2@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post('/store/login', [
        'email' => 'active2@example.com',
        'password' => 'mauvais-mot-de-passe',
    ]);

    $response->assertInvalid(['email' => 'Identifiants invalides']);

    expect(auth('store')->check())->toBeFalse();
});

test('un compte boutique désactivé ne peut pas se connecter même si la boutique est active', function () {
    $store = Store::factory()->active()->create();
    StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'inactive@example.com',
        'password' => Hash::make('password'),
        'active' => false,
    ]);

    $response = $this->post('/store/login', [
        'email' => 'inactive@example.com',
        'password' => 'password',
    ]);

    $response->assertInvalid(['email' => 'désactivé']);

    expect(auth('store')->check())->toBeFalse();
});

test('après 5 tentatives échouées, les tentatives suivantes sont limitées (throttle)', function () {
    $store = Store::factory()->active()->create();
    $storeUser = StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'throttle@example.com',
        'password' => Hash::make('password'),
    ]);

    // 5 tentatives avec un mauvais mot de passe.
    for ($i = 0; $i < 5; $i++) {
        $this->post('/store/login', [
            'email' => 'throttle@example.com',
            'password' => 'mauvais-mot-de-passe',
        ]);
    }

    // La 6e tentative, même avec les bons identifiants, doit être bloquée par le throttle.
    $response = $this->post('/store/login', [
        'email' => 'throttle@example.com',
        'password' => 'password',
    ]);

    $response->assertInvalid(['email' => 'Trop de tentatives']);
    expect(auth('store')->check())->toBeFalse();
});

test('un visiteur non authentifié sur le guard boutique est redirigé vers store.login (pas /login)', function () {
    $response = $this->get('/store/dashboard');

    $response->assertRedirect(route('store.login'));
});
