<?php

use App\Models\Entity;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Smoke test des points d'entrée publics (remplace l'ancien ExampleTest, qui
 * pointait vers une route `home` supprimée par le passage au multi-tenant).
 *
 * Objectif : détecter tout de suite une page d'entrée cassée — c'est la
 * première chose qu'un utilisateur voit, et rien d'autre ne la couvrait.
 */

test('la page de connexion boutique répond', function () {
    $this->get('/store/login')->assertOk();
});

test('la page d\'inscription boutique répond', function () {
    $this->get('/register')->assertOk();
});

test('la page de connexion super admin répond', function () {
    $this->get('/super-admin/login')->assertOk();
});

test('la page de connexion employé répond pour un store actif', function () {
    creerStoreComplet('Smoke Store', 'smoke-store');

    $this->get('/smoke-store/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
            ->where('store.slug', 'smoke-store')
        );
});

test('la page de connexion employé est introuvable pour un store inexistant', function () {
    $this->get('/store-inexistant/login')->assertNotFound();
});

test('/login redirige (route de repli)', function () {
    $this->get('/login')->assertRedirect();
});
