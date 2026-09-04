<?php

use App\Models\Entity;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Authentification des employés par PIN.
 *
 * Le login n'est plus global : il passe par le slug d'un store ACTIF
 * (POST /{slug}/login) et ne recherche l'employé QUE parmi les comptes de ce
 * store (User::where('store_id', ...)). C'est en soi une frontière de
 * cloisonnement : un PIN valide dans un store ne doit pas ouvrir un autre store.
 */
beforeEach(function () {
    // `entities.store_id` est NOT NULL depuis la vague 3a : le store doit exister
    // AVANT ses entités (cf. helper creerStoreComplet dans tests/Pest.php).
    [$this->store, $this->entity] = creerStoreComplet('Test Store', 'test-store');
});

/** Crée un employé rattaché au store du test. */
function makePinEmployee(Store $store, Entity $entity, string $role, string $pin = '0000'): User
{
    return User::create([
        'store_id' => $store->id,
        'entity_id' => $entity->id,
        'nom' => "Test {$role}",
        'pin' => User::hashPin($pin),
        'role' => $role,
        'auth_type' => 'PIN',
        'active' => true,
    ]);
}

test('un employé peut se connecter avec un PIN', function () {
    $employee = makePinEmployee($this->store, $this->entity, 'RESP_LABO');

    $response = $this->post('/test-store/login', ['pin' => '0000']);

    $response->assertRedirect('/test-store/dashboard');
    expect(auth()->check())->toBeTrue();
    expect(auth()->id())->toBe($employee->id);
});

test('EMPLOYE_LABO peut se connecter avec PIN', function () {
    $user = makePinEmployee($this->store, $this->entity, 'EMPLOYE_LABO');

    $response = $this->post('/test-store/login', ['pin' => '0000']);

    $response->assertRedirect('/test-store/dashboard');
    expect(auth()->check())->toBeTrue();
    expect(auth()->id())->toBe($user->id);
});

test('un admin PIN ne peut pas se connecter par le login employé', function () {
    // Les ADMIN sont exclus du login par slug : ils passent par /store/login.
    makePinEmployee($this->store, $this->entity, 'ADMIN');

    $response = $this->post('/test-store/login', ['pin' => '0000']);

    $response->assertSessionHasErrors('pin');
    expect(auth()->check())->toBeFalse();
});

test('un employé inactif ne peut pas se connecter', function () {
    $employee = makePinEmployee($this->store, $this->entity, 'RESP_LABO');
    $employee->update(['active' => false]);

    $this->post('/test-store/login', ['pin' => '0000'])
        ->assertSessionHasErrors('pin');

    expect(auth()->check())->toBeFalse();
});

test('le PIN d\'un employé n\'ouvre pas la session d\'un autre store', function () {
    // Cloisonnement : même PIN, deux stores distincts.
    makePinEmployee($this->store, $this->entity, 'RESP_LABO', '4321');

    [$otherStore] = creerStoreComplet('Autre Store', 'autre-store');

    // Le PIN de l'employé du store A est refusé sur le login du store B
    $this->post('/autre-store/login', ['pin' => '4321'])
        ->assertSessionHasErrors('pin');
    expect(auth()->check())->toBeFalse();

    // ... et fonctionne bien sur le sien
    $this->post('/test-store/login', ['pin' => '4321'])
        ->assertRedirect('/test-store/dashboard');
    expect(auth()->check())->toBeTrue();

    expect($otherStore->slug)->toBe('autre-store');
});

test('un store non actif refuse le login employé', function () {
    makePinEmployee($this->store, $this->entity, 'RESP_LABO');

    // `status` est volontairement hors $fillable (protection anti
    // auto-validation) : un update() de masse serait ignoré en silence.
    $this->store->forceFill(['status' => \App\Enums\StoreStatus::Suspended])->save();

    // Le contrôleur ne résout que les stores ACTIFS -> 404
    $this->post('/test-store/login', ['pin' => '0000'])->assertNotFound();
    expect(auth()->check())->toBeFalse();
});
