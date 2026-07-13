<?php

use App\Models\CommandeUrgente;
use App\Models\CommandeUrgenteLine;
use App\Models\Entity;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use App\Models\Notification as DatabaseNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('commandes-urgentes');

// Helper pour créer les fixtures
$setupFixtures = function () {
    // Créer entités: 1 labo, 2 boutiques
    $labo = Entity::create([
        'type' => 'LABO',
        'nom' => 'Labo Test',
        'adresse' => '123 rue Labo',
    ]);

    $boutique1 = Entity::create([
        'type' => 'BOULANGERIE',
        'nom' => 'Boutique 1',
        'adresse' => '456 rue Boutique',
    ]);

    $boutique2 = Entity::create([
        'type' => 'BOULANGERIE',
        'nom' => 'Boutique 2',
        'adresse' => '789 rue Boutique 2',
    ]);

    // Créer utilisateurs
    $admin = User::create([
        'entity_id' => $labo->id,
        'nom' => 'Admin Test',
        'pin' => User::hashPin('0000'),
        'role' => 'ADMIN',
        'active' => true,
    ]);

    $respLabo = User::create([
        'entity_id' => $labo->id,
        'nom' => 'Resp Labo',
        'pin' => User::hashPin('1111'),
        'role' => 'RESP_LABO',
        'active' => true,
    ]);

    $empLabo = User::create([
        'entity_id' => $labo->id,
        'nom' => 'Emp Labo',
        'pin' => User::hashPin('2222'),
        'role' => 'EMPLOYE_LABO',
        'active' => true,
    ]);

    $respBoutique = User::create([
        'entity_id' => $boutique1->id,
        'nom' => 'Resp Boutique',
        'pin' => User::hashPin('3333'),
        'role' => 'RESP_BOUTIQUE',
        'active' => true,
    ]);

    $empVente = User::create([
        'entity_id' => $boutique1->id,
        'nom' => 'Emp Vente',
        'pin' => User::hashPin('4444'),
        'role' => 'EMPLOYE_VENTE',
        'active' => true,
    ]);

    // Créer catégorie et produits
    $cat = Category::create(['nom' => 'Pains']);
    $product1 = Product::create([
        'category_id' => $cat->id,
        'nom' => 'Baguette',
        'code' => 'PAI-001',
        'prix_vente' => 1.10,
        'cout_revient' => 0.30,
    ]);
    $product2 = Product::create([
        'category_id' => $cat->id,
        'nom' => 'Pain campagne',
        'code' => 'PAI-002',
        'prix_vente' => 2.50,
        'cout_revient' => 0.70,
    ]);

    return compact(
        'labo', 'boutique1', 'boutique2',
        'admin', 'respLabo', 'empLabo', 'respBoutique', 'empVente',
        'product1', 'product2'
    );
};

test('boutiques peuvent créer une commande urgente', function () {
    $fixtures = $setupFixtures();
    $this->actingAs($fixtures['respBoutique']);

    $response = $this->post('/commandes-urgentes', [
        'date' => now()->toDateString(),
        'priorite' => 3,
        'lines' => [
            ['product_id' => $fixtures['product1']->id, 'quantite' => 10],
            ['product_id' => $fixtures['product2']->id, 'quantite' => 5],
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('commandes_urgentes', [
        'entity_id' => $fixtures['boutique1']->id,
        'statut' => 'ENVOYEE',
    ]);
});

test('labo peut voir toutes les commandes des boutiques', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    // Créer commande par boutique1
    CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'ENVOYEE',
        'priorite' => 1,
        'created_by' => $fixtures['respBoutique']->id,
    ]);

    $this->actingAs($fixtures['respLabo']);
    $response = $this->get('/commandes-urgentes');
    $response->assertOk();
    $commandes = $response->viewData('commandes');
    expect($commandes->total())->toBe(1);
});

test('boutique ne voit que ses propres commandes', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    // Commande boutique1
    CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'ENVOYEE',
        'priorite' => 1,
        'created_by' => $fixtures['respBoutique']->id,
    ]);
    // Commande boutique2
    CommandeUrgente::create([
        'entity_id' => $fixtures['boutique2']->id,
        'date' => now()->toDateString(),
        'statut' => 'ENVOYEE',
        'priorite' => 1,
        'created_by' => $fixtures['empVente']->id,
    ]);

    $this->actingAs($fixtures['respBoutique']);
    $response = $this->get('/commandes-urgentes');
    $commandes = $response->viewData('commandes');
    expect($commandes->total())->toBe(1);
});

test('employé vente peut créer commande', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    $this->actingAs($fixtures['empVente']);

    $response = $this->post('/commandes-urgentes', [
        'date' => now()->toDateString(),
        'priorite' => 2,
        'lines' => [
            ['product_id' => $fixtures['product1']->id, 'quantite' => 3],
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('commandes_urgentes', [
        'entity_id' => $fixtures['boutique1']->id,
    ]);
});

test('labo peut prendre en charge une commande', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    // Créer commande
    $commande = CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'ENVOYEE',
        'priorite' => 2,
        'notes' => 'Test',
        'created_by' => $fixtures['respBoutique']->id,
    ]);

    $this->actingAs($fixtures['respLabo']);
    $response = $this->post("/commandes-urgentes/{$commande->id}/take");
    $response->assertRedirect();

    $commande->refresh();
    expect($commande->statut)->toBe('PRISE_EN_CHARGE');
});

test('labo peut passer en préparation', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    $commande = CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'PRISE_EN_CHARGE',
        'created_by' => $fixtures['respBoutique']->id,
    ]);

    $this->actingAs($fixtures['respLabo']);
    $response = $this->post("/commandes-urgentes/{$commande->id}/status", [
        'statut' => 'EN_PREPARATION',
    ]);
    $response->assertRedirect();

    $commande->refresh();
    expect($commande->statut)->toBe('EN_PREPARATION');
});

test('labo peut marquer expédiée', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    $commande = CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'EN_PREPARATION',
        'created_by' => $fixtures['respBoutique']->id,
    ]);

    $this->actingAs($fixtures['respLabo']);
    $response = $this->post("/commandes-urgentes/{$commande->id}/status", [
        'statut' => 'EXPEDIEE',
    ]);
    $response->assertRedirect();

    $commande->refresh();
    expect($commande->statut)->toBe('EXPEDIEE');
});

test('notification créée pour RESP_LABO à la création', function () use ($setupFixtures) {
    DatabaseNotification::fake();

    $fixtures = $setupFixtures();

    $this->actingAs($fixtures['respBoutique']);
    $this->post('/commandes-urgentes', [
        'date' => now()->toDateString(),
        'priorite' => 3,
        'lines' => [
            ['product_id' => $fixtures['product1']->id, 'quantite' => 5],
        ],
    ]);

    // Vérifier que notifications ont été créées
    $notifications = DatabaseNotification::where('titre', 'Commande urgente')->get();
    expect($notifications->count())->toBeGreaterThan(0);
});

test('route create-bl accessible par labo', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    $commande = CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'PRISE_EN_CHARGE',
        'created_by' => $fixtures['respBoutique']->id,
    ]);

    $this->actingAs($fixtures['respLabo']);
    $response = $this->get("/commandes-urgentes/{$commande->id}/create-bl");
    $response->assertOk();
    $response->assertViewHas('commande');
});

test('boutique ne peut pas accéder à create-bl', function () use ($setupFixtures) {
    $fixtures = $setupFixtures();

    $commande = CommandeUrgente::create([
        'entity_id' => $fixtures['boutique1']->id,
        'date' => now()->toDateString(),
        'statut' => 'PRISE_EN_CHARGE',
        'created_by' => $fixtures['respBoutique']->id,
    ]);

    $this->actingAs($fixtures['respBoutique']);
    $response = $this->get("/commandes-urgentes/{$commande->id}/create-bl");
    $response->assertStatus(403);
});
