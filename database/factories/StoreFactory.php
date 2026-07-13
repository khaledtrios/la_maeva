<?php

namespace Database\Factories;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

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
        return [
            'name' => fake()->company(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'siret' => fake()->numerify('##############'),
        ];
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
