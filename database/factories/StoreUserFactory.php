<?php

namespace Database\Factories;

use App\Enums\StoreUserRole;
use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<StoreUser>
 */
class StoreUserFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = StoreUser::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'store_id' => Store::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            // ->value volontaire : StoreUser::role n'est pas casté en enum (cf.
            // commentaire dans le modèle). Sans ->value, une instance créée par
            // la factory porte l'objet enum en mémoire et échoue sur les
            // comparaisons strictes de string (middleware `role:`), alors que la
            // même ligne relue depuis la base passerait.
            'role' => StoreUserRole::StoreAdmin->value,
            'active' => true,
        ];
    }
}
