<?php

use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class)->group('stores');

beforeEach(function () {
    Cache::flush();
});

afterEach(function () {
    Cache::flush();
});

test('un Store Admin d\'une boutique en attente ne peut pas se connecter', function () {
    $store = Store::factory()->create();
    StoreUser::factory()->create([
        'store_id' => $store->id,
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

test('un Store Admin d\'une boutique refusée ne peut pas se connecter', function () {
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

test('un Store Admin d\'une boutique suspendue ne peut pas se connecter', function () {
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

test('un Store Admin d\'une boutique active peut se connecter et accède au tableau de bord', function () {
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

test('un mauvais mot de passe échoue avec une erreur générique', function () {
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

test('un compte Store Admin désactivé ne peut pas se connecter', function () {
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

test('après 5 tentatives échouées, les tentatives suivantes sont limitées', function () {
    $store = Store::factory()->active()->create();
    StoreUser::factory()->create([
        'store_id' => $store->id,
        'email' => 'throttle@example.com',
        'password' => Hash::make('password'),
    ]);

    for ($i = 0; $i < 5; $i++) {
        $this->post('/store/login', [
            'email' => 'throttle@example.com',
            'password' => 'mauvais-mot-de-passe',
        ]);
    }

    $response = $this->post('/store/login', [
        'email' => 'throttle@example.com',
        'password' => 'password',
    ]);

    $response->assertInvalid(['email' => 'Trop de tentatives']);
    expect(auth('store')->check())->toBeFalse();
});

test('un visiteur non authentifié est redirigé vers store.login', function () {
    $response = $this->get('/store/dashboard');

    $response->assertRedirect(route('store.login'));
});
