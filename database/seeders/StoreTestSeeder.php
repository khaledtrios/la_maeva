<?php

namespace Database\Seeders;

use App\Enums\StoreStatus;
use App\Models\Entity;
use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StoreTestSeeder extends Seeder
{
    public function run(): void
    {
        // Créer une entité (Labo) pour le Store
        $entity = Entity::firstOrCreate(
            ['nom' => 'Labo Maéva Cayenne'],
            ['type' => 'LABO']
        );

        // Créer une boutique de test active
        $store = Store::firstOrCreate(
            ['name' => 'Maéva Cayenne'],
            [
                'entity_id' => $entity->id,
                'phone' => '+594 (0)5 94 35 56 92',
                'address' => '123 Rue de la Boutique',
                'city' => 'Cayenne',
                'postal_code' => '97300',
                'siret' => '12345678901234',
                'status' => StoreStatus::Active,
                'status_changed_at' => now(),
            ]
        );

        // Créer un Store Admin de test
        StoreUser::firstOrCreate(
            ['email' => 'bhamzabahri@gmail.com'],
            [
                'store_id' => $store->id,
                'name' => 'Hamza Bahri',
                'password' => Hash::make('password123'),
                'role' => 'STORE_ADMIN',
                'active' => true,
            ]
        );

        // Créer un second Store Admin de test
        StoreUser::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'store_id' => $store->id,
                'name' => 'Admin Test',
                'password' => Hash::make('password'),
                'role' => 'STORE_ADMIN',
                'active' => true,
            ]
        );
    }
}
