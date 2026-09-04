<?php

use App\Models\Category;
use App\Models\CommandeUrgente;
use App\Models\Entity;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('commandes-urgentes');

/**
 * Commandes urgentes (espace Employé, guard "web").
 *
 * Réparé après le passage au multi-tenant : toutes les routes employé sont
 * désormais préfixées par le slug du store (/{slug}/commandes-urgentes) et les
 * pages sont rendues par Inertia (donc assertInertia, et non viewData).
 * Les fixtures passent par beforeEach : l'ancienne closure `$setupFixtures`
 * n'était pas capturée par le premier test (`use` manquant) et provoquait un
 * "Undefined variable".
 */
beforeEach(function () {
    // Les routes employé vivent sous /{slug} : il faut un store réel, et il doit
    // exister AVANT ses entités (`entities.store_id` est NOT NULL depuis la vague 3a).
    [$store, $labo, $boutique1] = creerStoreComplet('Maeva Test', 'maeva-test');

    // Seconde boutique du MÊME store, pour tester la visibilité entre boutiques.
    $boutique2 = creerEntite($store->id, 'BOULANGERIE', 'Boutique 2', '789 rue Boutique 2');

    $makeUser = fn (string $role, int $entityId, string $pin) => User::create([
        'store_id' => $store->id,
        'entity_id' => $entityId,
        'nom' => "User {$role}",
        'pin' => User::hashPin($pin),
        'role' => $role,
        'auth_type' => 'PIN',
        'active' => true,
    ]);

    // Le catalogue est créé dans le contexte du store : `categories.store_id` et
    // `products.store_id` sont NOT NULL depuis la vague 3a, et se déduisent du
    // contexte (aucune colonne d'entité pour les dériver).
    [$cat, $product1, $product2] = App\Support\CurrentStore::for($store->id, function () {
        $cat = Category::create(['nom' => 'Pains']);

        return [
            $cat,
            Product::create([
                'category_id' => $cat->id, 'nom' => 'Baguette', 'code' => 'PAI-001',
                'prix_vente' => 1.10, 'cout_revient' => 0.30,
            ]),
            Product::create([
                'category_id' => $cat->id, 'nom' => 'Pain campagne', 'code' => 'PAI-002',
                'prix_vente' => 2.50, 'cout_revient' => 0.70,
            ]),
        ];
    });

    $this->fx = [
        'slug' => 'maeva-test',
        'store' => $store,
        'labo' => $labo,
        'boutique1' => $boutique1,
        'boutique2' => $boutique2,
        'admin' => $makeUser('ADMIN', $labo->id, '0000'),
        'respLabo' => $makeUser('RESP_LABO', $labo->id, '1111'),
        'empLabo' => $makeUser('EMPLOYE_LABO', $labo->id, '2222'),
        'respBoutique' => $makeUser('RESP_BOUTIQUE', $boutique1->id, '3333'),
        'empVente' => $makeUser('EMPLOYE_VENTE', $boutique1->id, '4444'),
        'product1' => $product1,
        'product2' => $product2,
    ];
});

/** Crée une commande urgente pour l'entité donnée. */
function makeCommande(int $entityId, int $createdBy, string $statut = 'ENVOYEE', int $priorite = 1): CommandeUrgente
{
    return CommandeUrgente::create([
        'entity_id' => $entityId,
        'date' => now()->toDateString(),
        'statut' => $statut,
        'priorite' => $priorite,
        'created_by' => $createdBy,
    ]);
}

// ============================================
// CRÉATION (boutiques)
// ============================================

test('boutiques peuvent créer une commande urgente', function () {
    $this->actingAs($this->fx['respBoutique']);

    $this->post("/{$this->fx['slug']}/commandes-urgentes", [
        'date' => now()->toDateString(),
        'priorite' => 3,
        'lines' => [
            ['product_id' => $this->fx['product1']->id, 'quantite' => 10],
            ['product_id' => $this->fx['product2']->id, 'quantite' => 5],
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('commandes_urgentes', [
        'entity_id' => $this->fx['boutique1']->id,
        'statut' => 'ENVOYEE',
    ]);
});

test('employé vente peut créer commande', function () {
    $this->actingAs($this->fx['empVente']);

    $this->post("/{$this->fx['slug']}/commandes-urgentes", [
        'date' => now()->toDateString(),
        'priorite' => 2,
        'lines' => [
            ['product_id' => $this->fx['product1']->id, 'quantite' => 3],
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('commandes_urgentes', [
        'entity_id' => $this->fx['boutique1']->id,
    ]);
});

test('le labo ne peut pas créer de commande urgente', function () {
    $this->actingAs($this->fx['respLabo']);

    $this->post("/{$this->fx['slug']}/commandes-urgentes", [
        'date' => now()->toDateString(),
        'priorite' => 1,
        'lines' => [['product_id' => $this->fx['product1']->id, 'quantite' => 1]],
    ])->assertForbidden();

    $this->assertDatabaseCount('commandes_urgentes', 0);
});

// ============================================
// VISIBILITÉ
// ============================================

test('labo peut voir toutes les commandes des boutiques', function () {
    makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id);
    makeCommande($this->fx['boutique2']->id, $this->fx['empVente']->id);

    $this->actingAs($this->fx['respLabo'])
        ->get("/{$this->fx['slug']}/commandes-urgentes")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('CommandesUrgentes/Index')
            ->where('commandes.total', 2)
        );
});

test('boutique ne voit que ses propres commandes', function () {
    makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id);
    makeCommande($this->fx['boutique2']->id, $this->fx['empVente']->id);

    $this->actingAs($this->fx['respBoutique'])
        ->get("/{$this->fx['slug']}/commandes-urgentes")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('commandes.total', 1)
            ->where('commandes.data.0.entity_id', $this->fx['boutique1']->id)
        );
});

// ============================================
// WORKFLOW LABO
// ============================================

test('labo peut prendre en charge une commande', function () {
    $commande = makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id, 'ENVOYEE', 2);

    $this->actingAs($this->fx['respLabo'])
        ->post("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/take")
        ->assertRedirect();

    expect($commande->fresh()->statut)->toBe('PRISE_EN_CHARGE');
});

test('labo peut marquer expédiée', function () {
    $commande = makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id, 'PRISE_EN_CHARGE');

    $this->actingAs($this->fx['respLabo'])
        ->post("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/status", ['statut' => 'EXPEDIEE'])
        ->assertRedirect();

    expect($commande->fresh()->statut)->toBe('EXPEDIEE');
});

test('le statut EN_PREPARATION est refusé (inatteignable par l\'API)', function () {
    // ANOMALIE DOCUMENTÉE : 'EN_PREPARATION' existe dans l'enum de la table
    // commandes_urgentes mais n'est accepté ni par CommandeUrgenteController
    // ::updateStatus (validation in:ENVOYEE,PRISE_EN_CHARGE,EXPEDIEE) ni par
    // CommandeUrgenteService::updateStatus. Statut mort : soit l'ajouter aux
    // transitions, soit le retirer de l'enum. Test = garde-fou en attendant.
    $commande = makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id, 'PRISE_EN_CHARGE');

    $this->actingAs($this->fx['respLabo'])
        ->post("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/status", ['statut' => 'EN_PREPARATION'])
        ->assertSessionHasErrors('statut');

    expect($commande->fresh()->statut)->toBe('PRISE_EN_CHARGE');
});

test('une boutique ne peut pas changer le statut d\'une commande', function () {
    $commande = makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id, 'PRISE_EN_CHARGE');

    $this->actingAs($this->fx['respBoutique'])
        ->post("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/status", ['statut' => 'EXPEDIEE'])
        ->assertForbidden();

    expect($commande->fresh()->statut)->toBe('PRISE_EN_CHARGE');
});

// ============================================
// CRÉATION DE BL
// ============================================

test('route create-bl accessible par labo', function () {
    // create-bl n'est plus une page de formulaire : il crée le BL puis redirige
    // (« Pas de formulaire intermédiaire » dans le contrôleur). Sans stock alloué
    // il repart en back() avec un message d'erreur — dans les deux cas c'est une
    // redirection. Ce test vérifie donc l'AUTORISATION : le labo n'est pas bloqué.
    $commande = makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id, 'PRISE_EN_CHARGE');

    $this->actingAs($this->fx['respLabo'])
        ->get("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/create-bl")
        ->assertRedirect();
});

test('le labo ne peut pas créer un BL pour ses propres commandes', function () {
    $commande = makeCommande($this->fx['labo']->id, $this->fx['respLabo']->id, 'PRISE_EN_CHARGE');

    $this->actingAs($this->fx['respLabo'])
        ->get("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/create-bl")
        ->assertForbidden();
});

test('boutique ne peut pas accéder à create-bl', function () {
    $commande = makeCommande($this->fx['boutique1']->id, $this->fx['respBoutique']->id, 'PRISE_EN_CHARGE');

    $this->actingAs($this->fx['respBoutique'])
        ->get("/{$this->fx['slug']}/commandes-urgentes/{$commande->id}/create-bl")
        ->assertForbidden();
});

// ============================================
// NOTIFICATIONS — fonctionnalité absente
// ============================================

test('notification créée pour RESP_LABO à la création', function () {
    $this->actingAs($this->fx['respBoutique']);

    $this->post("/{$this->fx['slug']}/commandes-urgentes", [
        'date' => now()->toDateString(),
        'priorite' => 3,
        'lines' => [['product_id' => $this->fx['product1']->id, 'quantite' => 5]],
    ]);

    expect(\App\Models\Notification::where('titre', 'Commande urgente')->count())
        ->toBeGreaterThan(0);
})->skip(
    'Fonctionnalité non implémentée : CommandeUrgenteController ne crée aucune '
    . 'notification. Le test d\'origine appelait Notification::fake() (inexistant '
    . 'sur un modèle Eloquent) et ne pouvait donc jamais passer. Conservé pour '
    . 'garder la trace du besoin — à réactiver quand la notification RESP_LABO sera codée.'
);
