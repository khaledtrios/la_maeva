<?php

use App\Jobs\FactureAutoGenerator;
use App\Models\Entity;
use App\Models\Expedition;
use App\Models\ExpeditionLine;
use App\Models\Facture;
use App\Models\FactureSetting;
use App\Models\Product;
use App\Models\Production;
use App\Models\Reception;
use App\Models\User;
use App\Services\FactureService;
use App\Support\CurrentStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->group('security', 'facture-auto-generator');

/**
 * Correctif P0 (audit final multi-tenant, 2026-09-04) — `FactureAutoGenerator`
 * mélangeait des stores : il prenait UN SEUL labo arbitraire sur toute la
 * plateforme (`Entity::where('type','LABO')->first()`, job = contexte non
 * cloisonné) et bouclait sur TOUTES les boulangeries tous stores confondus.
 *
 * Ces tests montent DEUX tenants complets, chacun avec une expédition
 * RECUE + réception CONFIRMEE du mois précédent (les conditions requises par
 * `FactureService::genererFacture()`), activent l'auto-génération, exécutent
 * le job, et vérifient que CHAQUE store reçoit sa PROPRE facture, correctement
 * rattachée (entity_id = son propre labo, boulangerie_id = sa propre
 * boutique, store_id cohérent), sans aucun mélange.
 */
/**
 * `factures.generated_by` est NOT NULL : le job réel s'appuie sur un user
 * role=SYSTEM (voir seeds). Sans lui, `genererFacture()` échoue avec une
 * violation de contrainte SQL — capturée silencieusement par le try/catch du
 * job, ce qui masquerait à tort le vrai comportement testé ici. On le crée
 * une fois, rattaché à la première entité disponible (role SYSTEM = platform-
 * wide, sans store_id).
 */
function creerUserSysteme(): User
{
    return User::firstOrCreate(
        ['role' => 'SYSTEM'],
        [
            'entity_id' => Entity::withoutGlobalScopes()->firstOrFail()->id,
            'nom' => 'Système',
            'pin' => User::hashPin('0000'),
            'auth_type' => 'PIN',
            'active' => true,
        ]
    );
}

function monterTenantFacturable(string $label, string $slug): array
{
    [$store, $labo, $boutique] = creerStoreComplet("Store {$label}", $slug);

    $employeLabo = User::create([
        'store_id' => $store->id, 'entity_id' => $labo->id, 'nom' => "Labo {$label}",
        'pin' => User::hashPin('1111'), 'role' => 'RESP_LABO', 'auth_type' => 'PIN', 'active' => true,
    ]);

    $dateDebutMoisDernier = now()->subMonth()->startOfMonth();

    return CurrentStore::for($store->id, function () use ($store, $labo, $boutique, $employeLabo, $dateDebutMoisDernier, $label) {
        $product = Product::create([
            'category_id' => \App\Models\Category::create(['nom' => "Cat {$label}"])->id,
            'nom' => "Produit {$label}",
            'code' => "PR-{$label}",
            'prix_vente' => 2.0,
            'cout_revient' => 1.0,
            'dlc' => 3,
        ]);

        $production = Production::create([
            'entity_id' => $labo->id, 'product_id' => $product->id,
            'quantite' => 100, 'quantite_pertes' => 0, 'lot' => "LOT-{$label}",
            'date' => $dateDebutMoisDernier->toDateString(), 'created_by' => $employeLabo->id,
        ]);

        $expedition = Expedition::create([
            'entity_id' => $labo->id, 'boulangerie_id' => $boutique->id,
            'date' => $dateDebutMoisDernier->toDateString(), 'statut' => 'RECUE',
            'created_by' => $employeLabo->id,
        ]);

        ExpeditionLine::create([
            'expedition_id' => $expedition->id, 'product_id' => $product->id,
            'production_id' => $production->id, 'quantite' => 20,
        ]);

        Reception::create([
            'expedition_id' => $expedition->id, 'entity_id' => $boutique->id,
            'date' => $dateDebutMoisDernier->toDateString(), 'statut' => 'CONFIRMEE',
        ]);

        return compact('store', 'labo', 'boutique', 'product', 'expedition');
    });
}

// ============================================
// GARDE-FOU DANS FactureService::genererFacture()
// ============================================

test('genererFacture() refuse un labo et une boulangerie de stores différents', function () {
    $a = monterTenantFacturable('GuardA', 'guard-a1');
    $b = monterTenantFacturable('GuardB', 'guard-b1');

    expect($a['labo']->store_id)->not->toBe($b['boutique']->store_id);

    $service = app(FactureService::class);

    expect(fn () => $service->genererFacture(
        $b['boutique'], // boulangerie du store B
        $a['labo'],     // labo du store A
        'MOIS',
        now()->subMonth()->startOfMonth()->toDateString(),
        now()->subMonth()->endOfMonth()->toDateString(),
        null,
        false
    ))->toThrow(Exception::class, "n'appartiennent pas au même store");

    // Aucune facture cross-store n'a été créée malgré la tentative.
    $this->assertDatabaseMissing('factures', [
        'entity_id' => $a['labo']->id,
        'boulangerie_id' => $b['boutique']->id,
    ]);
});

test('genererFacture() fonctionne normalement quand labo et boulangerie sont du même store', function () {
    $a = monterTenantFacturable('GuardOk', 'guard-ok1');
    $system = creerUserSysteme();

    $facture = app(FactureService::class)->genererFacture(
        $a['boutique'],
        $a['labo'],
        'MOIS',
        now()->subMonth()->startOfMonth()->toDateString(),
        now()->subMonth()->endOfMonth()->toDateString(),
        $system,
        false
    );

    expect($facture->store_id)->toBe($a['store']->id);
    expect($facture->entity_id)->toBe($a['labo']->id);
    expect($facture->boulangerie_id)->toBe($a['boutique']->id);
});

// ============================================
// FactureAutoGenerator — traitement store-par-store
// ============================================

test('FactureAutoGenerator génère une facture distincte et correctement rattachée pour CHAQUE store, sans mélange', function () {
    $a = monterTenantFacturable('AutoA', 'auto-a1');
    $b = monterTenantFacturable('AutoB', 'auto-b1');
    creerUserSysteme();

    FactureSetting::set('auto_generation_enabled', 'true', 'test');

    (new FactureAutoGenerator())->handle();

    $facturesA = Facture::withoutGlobalScopes()->where('store_id', $a['store']->id)->get();
    $facturesB = Facture::withoutGlobalScopes()->where('store_id', $b['store']->id)->get();

    expect($facturesA)->toHaveCount(1);
    expect($facturesB)->toHaveCount(1);

    // Store A : facture rattachée à SON labo et SA boulangerie, aucune trace du store B.
    expect($facturesA->first()->entity_id)->toBe($a['labo']->id);
    expect($facturesA->first()->boulangerie_id)->toBe($a['boutique']->id);
    expect($facturesA->first()->entity_id)->not->toBe($b['labo']->id);
    expect($facturesA->first()->boulangerie_id)->not->toBe($b['boutique']->id);

    // Store B : symétrique.
    expect($facturesB->first()->entity_id)->toBe($b['labo']->id);
    expect($facturesB->first()->boulangerie_id)->toBe($b['boutique']->id);

    // Aucune facture globale mêlant un labo d'un store à une boulangerie de l'autre.
    $toutesFactures = Facture::withoutGlobalScopes()->get();
    expect($toutesFactures)->toHaveCount(2);
    foreach ($toutesFactures as $facture) {
        $labo = Entity::withoutGlobalScopes()->find($facture->entity_id);
        $boulangerie = Entity::withoutGlobalScopes()->find($facture->boulangerie_id);
        expect($labo->store_id)->toBe($boulangerie->store_id);
        expect($labo->store_id)->toBe($facture->store_id);
    }
});

test('FactureAutoGenerator ne génère rien quand la génération auto est désactivée', function () {
    monterTenantFacturable('AutoOff', 'auto-off1');

    FactureSetting::set('auto_generation_enabled', 'false', 'test');

    (new FactureAutoGenerator())->handle();

    expect(Facture::withoutGlobalScopes()->count())->toBe(0);
});

test('FactureAutoGenerator ignore un store sans labo sans planter pour les autres stores', function () {
    $a = monterTenantFacturable('AutoWithLabo', 'auto-withlabo1');

    // Store sans labo (juste une boulangerie) : ne doit ni planter le job ni
    // empêcher la génération pour le store A.
    $storeSansLabo = \App\Models\Store::factory()->active()->create([
        'name' => 'Store SansLabo', 'slug' => 'auto-sanslabo1',
    ]);
    creerEntite($storeSansLabo->id, 'BOULANGERIE', 'Boutique SansLabo');
    creerUserSysteme();

    FactureSetting::set('auto_generation_enabled', 'true', 'test');

    (new FactureAutoGenerator())->handle();

    expect(Facture::withoutGlobalScopes()->where('store_id', $a['store']->id)->count())->toBe(1);
    expect(Facture::withoutGlobalScopes()->where('store_id', $storeSansLabo->id)->count())->toBe(0);
});
