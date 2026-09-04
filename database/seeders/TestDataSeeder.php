<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\SuperAdmin;
use App\Models\User;
use App\Enums\StoreStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Nettoyer les données existantes
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        StoreUser::truncate();
        Store::truncate();
        User::truncate();
        Entity::truncate();
        SuperAdmin::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ============================================
        // 1) SUPER ADMIN
        // ============================================
        SuperAdmin::create([
            'id' => 1,
            'name' => 'Super Admin',
            'email' => 'superadmin@test.com',
            'password' => Hash::make('password123'),
            'active' => true,
        ]);

        // ============================================
        // 2) ENTITIES & STORES & STORE ADMINS
        // ============================================

        // Store 1 - Labo Maéva Cayenne
        $entity1 = Entity::create([
            'type' => 'LABO',
            'nom' => 'Labo Maéva Cayenne',
            'adresse' => '123 Rue de Cayenne',
        ]);

        $store1 = Store::create([
            'name' => 'Labo Maéva Cayenne',
            'entity_id' => $entity1->id,
            'phone' => '+594 5 94 35 56 92',
            'address' => '123 Rue de Cayenne',
            'city' => 'Cayenne',
            'postal_code' => '97300',
            'siret' => '12345678901234',
            'status' => StoreStatus::Active,
            'status_changed_at' => now(),
        ]);

        StoreUser::create([
            'store_id' => $store1->id,
            'name' => 'Admin Cayenne',
            'email' => 'admin.cayenne@test.com',
            'password' => Hash::make('password123'),
            'role' => 'STORE_ADMIN',
            'active' => true,
        ]);

        // Store 2 - Labo Maéva Paris
        $entity2 = Entity::create([
            'type' => 'LABO',
            'nom' => 'Labo Maéva Paris',
            'adresse' => '456 Rue de Paris',
        ]);

        $store2 = Store::create([
            'name' => 'Labo Maéva Paris',
            'entity_id' => $entity2->id,
            'phone' => '+33 1 23 45 67 89',
            'address' => '456 Rue de Paris',
            'city' => 'Paris',
            'postal_code' => '75001',
            'siret' => '23456789012345',
            'status' => StoreStatus::Active,
            'status_changed_at' => now(),
        ]);

        StoreUser::create([
            'store_id' => $store2->id,
            'name' => 'Admin Paris',
            'email' => 'admin.paris@test.com',
            'password' => Hash::make('password123'),
            'role' => 'STORE_ADMIN',
            'active' => true,
        ]);

        // Store 3 - Labo Maéva Marseille
        $entity3 = Entity::create([
            'type' => 'LABO',
            'nom' => 'Labo Maéva Marseille',
            'adresse' => '789 Rue de Marseille',
        ]);

        $store3 = Store::create([
            'name' => 'Labo Maéva Marseille',
            'entity_id' => $entity3->id,
            'phone' => '+33 4 91 23 45 67',
            'address' => '789 Rue de Marseille',
            'city' => 'Marseille',
            'postal_code' => '13001',
            'siret' => '34567890123456',
            'status' => StoreStatus::Active,
            'status_changed_at' => now(),
        ]);

        StoreUser::create([
            'store_id' => $store3->id,
            'name' => 'Admin Marseille',
            'email' => 'admin.marseille@test.com',
            'password' => Hash::make('password123'),
            'role' => 'STORE_ADMIN',
            'active' => true,
        ]);

        // ============================================
        // 3) EMPLOYEES POUR CHAQUE STORE
        // ============================================

        // Store 1 Employees
        User::create([
            'entity_id' => $entity1->id,
            'store_id' => $store1->id,
            'nom' => 'Chef Labo Cayenne',
            'pin' => User::hashPin('1111'),
            'role' => 'RESP_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        User::create([
            'entity_id' => $entity1->id,
            'store_id' => $store1->id,
            'nom' => 'Employé Labo Cayenne',
            'pin' => User::hashPin('2222'),
            'role' => 'EMPLOYE_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        User::create([
            'entity_id' => $entity1->id,
            'store_id' => $store1->id,
            'nom' => 'Employé Vente Cayenne',
            'pin' => User::hashPin('3333'),
            'role' => 'EMPLOYE_VENTE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // Store 2 Employees
        User::create([
            'entity_id' => $entity2->id,
            'store_id' => $store2->id,
            'nom' => 'Chef Labo Paris',
            'pin' => User::hashPin('4444'),
            'role' => 'RESP_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        User::create([
            'entity_id' => $entity2->id,
            'store_id' => $store2->id,
            'nom' => 'Employé Labo Paris',
            'pin' => User::hashPin('5555'),
            'role' => 'EMPLOYE_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        User::create([
            'entity_id' => $entity2->id,
            'store_id' => $store2->id,
            'nom' => 'Employé Vente Paris',
            'pin' => User::hashPin('6666'),
            'role' => 'EMPLOYE_VENTE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // Store 3 Employees
        User::create([
            'entity_id' => $entity3->id,
            'store_id' => $store3->id,
            'nom' => 'Chef Labo Marseille',
            'pin' => User::hashPin('7777'),
            'role' => 'RESP_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        User::create([
            'entity_id' => $entity3->id,
            'store_id' => $store3->id,
            'nom' => 'Employé Labo Marseille',
            'pin' => User::hashPin('8888'),
            'role' => 'EMPLOYE_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        User::create([
            'entity_id' => $entity3->id,
            'store_id' => $store3->id,
            'nom' => 'Employé Vente Marseille',
            'pin' => User::hashPin('9999'),
            'role' => 'EMPLOYE_VENTE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);
    }
}
