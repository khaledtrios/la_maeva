<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('security', 'admin-privilege-escalation');

/**
 * Correctif P0 (audit final multi-tenant, 2026-09-04) — escalade de privilèges
 * sur `/{slug}/admin/*` (guard "web").
 *
 * Avant correctif : ce groupe de routes n'avait AUCUN middleware `role:`, et
 * `AdminController` ne testait que le GUARD (`auth('store')->check()`),
 * jamais le RÔLE de l'utilisateur guard "web". N'importe quel employé
 * authentifié (EMPLOYE_VENTE, RESP_LABO, ...) pouvait donc :
 *   - créer un compte ADMIN pour n'importe quelle entité (storeUser()) ;
 *   - modifier ou supprimer N'IMPORTE QUEL utilisateur de N'IMPORTE QUEL store
 *     (updateUser()/destroyUser() ne vérifiaient l'appartenance store que si
 *     $isStoreAdmin, jamais pour le guard web).
 *
 * Ces tests couvrent le scénario négatif (bloqué pour un rôle employé) ET le
 * scénario positif (toujours fonctionnel pour le rôle ADMIN), pour prouver
 * que le correctif referme la faille sans casser l'usage légitime.
 */
function monterTenantAdmin(string $label, string $slug): array
{
    [$store, $labo, $boutique] = creerStoreComplet("Store {$label}", $slug);

    $admin = User::create([
        'store_id' => $store->id, 'entity_id' => $labo->id, 'nom' => "Admin {$label}",
        'pin' => User::hashPin('9999'), 'role' => 'ADMIN', 'auth_type' => 'PIN', 'active' => true,
    ]);

    $employeVente = User::create([
        'store_id' => $store->id, 'entity_id' => $boutique->id, 'nom' => "Vente {$label}",
        'pin' => User::hashPin('2222'), 'role' => 'EMPLOYE_VENTE', 'auth_type' => 'PIN', 'active' => true,
    ]);

    $respLabo = User::create([
        'store_id' => $store->id, 'entity_id' => $labo->id, 'nom' => "Labo {$label}",
        'pin' => User::hashPin('1111'), 'role' => 'RESP_LABO', 'auth_type' => 'PIN', 'active' => true,
    ]);

    return compact('store', 'labo', 'boutique', 'admin', 'employeVente', 'respLabo');
}

// ============================================
// SCÉNARIOS NÉGATIFS — un employé non-ADMIN ne peut plus rien faire ici
// ============================================

test('un employé non-ADMIN ne peut pas accéder à la page /admin', function () {
    $t = monterTenantAdmin('A', 'admin-a1');

    $this->actingAs($t['employeVente'])
        ->get("/{$t['store']->slug}/admin")
        ->assertForbidden();

    $this->actingAs($t['respLabo'])
        ->get("/{$t['store']->slug}/admin")
        ->assertForbidden();
});

test('un employé non-ADMIN ne peut pas créer un compte ADMIN via /admin/users', function () {
    $t = monterTenantAdmin('B', 'admin-b1');

    $this->actingAs($t['employeVente'])
        ->post("/{$t['store']->slug}/admin/users", [
            'nom' => 'Faux Admin',
            'role' => 'ADMIN',
            'pin' => '4321',
            'active' => true,
            'entity_id' => $t['labo']->id,
        ])
        ->assertForbidden();

    // Preuve que le blocage est réel et pas juste un 403 générique sans effet :
    // aucun compte "Faux Admin" ne doit exister, quel que soit le rôle.
    $this->assertDatabaseMissing('users', ['nom' => 'Faux Admin']);
});

test('un employé non-ADMIN ne peut pas modifier un autre utilisateur via /admin/users/{user}', function () {
    $t = monterTenantAdmin('C', 'admin-c1');
    $cible = $t['respLabo'];
    $ancienRole = $cible->role;

    $this->actingAs($t['employeVente'])
        ->put("/{$t['store']->slug}/admin/users/{$cible->id}", [
            'nom' => $cible->nom,
            'role' => 'ADMIN', // tentative d'auto-promotion d'un tiers
            'pin' => '9999',
            'active' => true,
            'entity_id' => $t['labo']->id,
        ])
        ->assertForbidden();

    expect($cible->fresh()->role)->toBe($ancienRole);
});

test('un employé non-ADMIN ne peut pas supprimer un utilisateur via /admin/users/{user}', function () {
    $t = monterTenantAdmin('D', 'admin-d1');
    $cible = $t['respLabo'];

    $this->actingAs($t['employeVente'])
        ->delete("/{$t['store']->slug}/admin/users/{$cible->id}")
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $cible->id]);
});

test('un employé non-ADMIN ne peut pas créer d\'entité via /admin/entities', function () {
    $t = monterTenantAdmin('E', 'admin-e1');

    $this->actingAs($t['employeVente'])
        ->post("/{$t['store']->slug}/admin/entities", [
            'type' => 'LABO',
            'nom' => 'Labo Pirate',
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('entities', ['nom' => 'Labo Pirate']);
});

test('un employé non-ADMIN ne peut pas accéder aux paramètres de facturation via /admin/facture-settings', function () {
    $t = monterTenantAdmin('F', 'admin-f1');

    $this->actingAs($t['employeVente'])
        ->get("/{$t['store']->slug}/admin/facture-settings")
        ->assertForbidden();

    $this->actingAs($t['employeVente'])
        ->post("/{$t['store']->slug}/admin/facture-settings/toggle-auto", ['enabled' => true])
        ->assertForbidden();
});

// ============================================
// SCÉNARIOS POSITIFS — le rôle ADMIN garde un accès pleinement fonctionnel
// ============================================

test('un ADMIN peut toujours accéder à la page /admin', function () {
    $t = monterTenantAdmin('G', 'admin-g1');

    $this->actingAs($t['admin'])
        ->get("/{$t['store']->slug}/admin")
        ->assertOk();
});

test('un ADMIN peut toujours créer un utilisateur (y compris un autre ADMIN) via /admin/users', function () {
    $t = monterTenantAdmin('H', 'admin-h1');

    $this->actingAs($t['admin'])
        ->post("/{$t['store']->slug}/admin/users", [
            'nom' => 'Nouveau Resp',
            'role' => 'RESP_BOUTIQUE',
            'pin' => '5555',
            'active' => true,
            'entity_id' => $t['boutique']->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('users', ['nom' => 'Nouveau Resp', 'role' => 'RESP_BOUTIQUE']);
});

test('un ADMIN peut toujours modifier un utilisateur via /admin/users/{user}', function () {
    $t = monterTenantAdmin('I', 'admin-i1');
    $cible = $t['respLabo'];

    $this->actingAs($t['admin'])
        ->put("/{$t['store']->slug}/admin/users/{$cible->id}", [
            'nom' => $cible->nom,
            'role' => 'DIRECTION',
            'pin' => '1234',
            'active' => true,
            'entity_id' => $t['labo']->id,
        ])
        ->assertRedirect();

    expect($cible->fresh()->role)->toBe('DIRECTION');
});

test('un ADMIN peut toujours créer une entité via /admin/entities', function () {
    $t = monterTenantAdmin('J', 'admin-j1');

    $this->actingAs($t['admin'])
        ->post("/{$t['store']->slug}/admin/entities", [
            'type' => 'LABO',
            'nom' => 'Labo Légitime',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('entities', ['nom' => 'Labo Légitime']);
});

// ============================================
// Le Store Admin (guard "store") reste inchangé — /store/admin déjà
// protégé par `role:STORE_ADMIN` avant ce correctif, non affecté par lui.
// ============================================

test('le Store Admin garde son accès normal à /store/admin (non affecté par le correctif)', function () {
    $t = monterTenantAdmin('K', 'admin-k1');
    $storeAdmin = \App\Models\StoreUser::factory()->create(['store_id' => $t['store']->id]);

    $this->actingAs($storeAdmin, 'store')
        ->get('/store/admin')
        ->assertOk();
});
