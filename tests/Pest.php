<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
 // ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Crée une entité (LABO ou BOULANGERIE) rattachée à un store.
 *
 * Depuis la vague 3a de la Phase 4, `entities.store_id` est NOT NULL. Or une
 * entité est la seule table qui n'a aucune colonne d'où dériver son store : le
 * rattachement doit donc venir du CONTEXTE. En production ce contexte existe
 * toujours (AdminController est authentifié) ; dans les tests, il faut le poser
 * explicitement — d'où ce helper, qui utilise `CurrentStore::for()` pour que le
 * trait BelongsToStore renseigne `store_id` normalement.
 *
 * À utiliser partout où un test créait `Entity::create([...])` sans contexte.
 */
function creerEntite(int $storeId, string $type, string $nom, ?string $adresse = null): App\Models\Entity
{
    return App\Support\CurrentStore::for($storeId, fn () => App\Models\Entity::create([
        'type' => $type,
        'nom' => $nom,
        'adresse' => $adresse ?? "Adresse {$nom}",
    ]));
}

/**
 * Monte un store ACTIF avec son labo et sa boutique, tous rattachés.
 *
 * Retourne [store, labo, boutique]. `stores.entity_id` pointe le labo, ce qui
 * reproduit la structure réelle produite par les seeders.
 */
function creerStoreComplet(string $nom, string $slug): array
{
    $store = App\Models\Store::factory()->active()->create([
        'name' => $nom,
        'slug' => $slug,
    ]);

    $labo = creerEntite($store->id, 'LABO', "Labo {$nom}");
    $boutique = creerEntite($store->id, 'BOULANGERIE', "Boutique {$nom}");

    $store->entity_id = $labo->id;
    $store->save();

    return [$store, $labo, $boutique];
}
