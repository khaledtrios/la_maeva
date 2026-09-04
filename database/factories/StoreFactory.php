<?php

namespace Database\Factories;

use App\Enums\StoreStatus;
use App\Models\Entity;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Store::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            // PHASE 3.5 (M4) : un slug était absent par défaut, alors que toutes
            // les routes employé vivent sous /{slug} — les tests devaient le
            // fournir à la main sous peine d'un store inatteignable.
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1000, 999999),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'siret' => fake()->numerify('##############'),
        ];
    }

    /**
     * Crée le store AVEC ses entités (1 LABO + 1 BOULANGERIE) rattachées, et
     * renseigne `stores.entity_id` sur le labo.
     *
     * État explicite plutôt qu'automatique : les tests existants qui fournissent
     * eux-mêmes `entity_id` gardent exactement le comportement précédent.
     */
    public function withEntities(): static
    {
        return $this->afterCreating(function (Store $store) {
            $labo = Entity::create([
                'type' => 'LABO',
                'nom' => 'Labo ' . $store->name,
                'adresse' => $store->address ?? 'Adresse labo',
            ]);

            $boulangerie = Entity::create([
                'type' => 'BOULANGERIE',
                'nom' => 'Boutique ' . $store->name,
                'adresse' => $store->address ?? 'Adresse boutique',
            ]);

            // store_id est hors $fillable (anti-changement de tenant par
            // assignation de masse) : affectation directe volontaire.
            foreach ([$labo, $boulangerie] as $entity) {
                $entity->store_id = $store->id;
                $entity->save();
            }

            $store->entity_id = $labo->id;
            $store->save();
        });
    }

    /**
     * Indicate that the store has been validated and is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => StoreStatus::Active,
            'status_changed_at' => now(),
        ]);
    }

    /**
     * Indicate that the store's registration has been rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => StoreStatus::Rejected,
            'status_reason' => fake()->sentence(),
            'status_changed_at' => now(),
        ]);
    }

    /**
     * Indicate that the store has been suspended after being active.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => StoreStatus::Suspended,
            'status_reason' => fake()->sentence(),
            'status_changed_at' => now(),
        ]);
    }
}
