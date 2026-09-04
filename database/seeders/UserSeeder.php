<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed les 8 utilisateurs avec PIN hashé SHA-256
     */
    public function run(): void
    {
        // entity:1 — Admin Dupont — ADMIN (authentification email + password via /store/login)
        User::create([
            'id' => 1,
            'entity_id' => 1,
            'nom' => 'Admin Dupont',
            'pin' => User::hashPin('0000'),  // Gardé pour compatibilité, mais non utilisé
            'role' => 'ADMIN',
            'active' => true,
            'auth_type' => 'EMAIL_PASSWORD',
            'email' => 'bhhamzahb@gmail.com',
            'password' => bcrypt('password'),
        ]);

        // entity:1 — Chef Labo Martin — RESP_LABO
        User::create([
            'id' => 2,
            'entity_id' => 1,
            'nom' => 'Chef Labo Martin',
            'pin' => User::hashPin('1111'),
            'role' => 'RESP_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // entity:1 — Pierre Labeur — EMPLOYE_LABO
        User::create([
            'id' => 3,
            'entity_id' => 1,
            'nom' => 'Pierre Labeur',
            'pin' => User::hashPin('2222'),
            'role' => 'EMPLOYE_LABO',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // entity:2 — Sophie Cayenne — RESP_BOUTIQUE
        User::create([
            'id' => 4,
            'entity_id' => 2,
            'nom' => 'Sophie Cayenne',
            'pin' => User::hashPin('3333'),
            'role' => 'RESP_BOUTIQUE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // entity:2 — Marie Caisse — EMPLOYE_VENTE
        User::create([
            'id' => 5,
            'entity_id' => 2,
            'nom' => 'Marie Caisse',
            'pin' => User::hashPin('4444'),
            'role' => 'EMPLOYE_VENTE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // entity:3 — Jean Soula — RESP_BOUTIQUE
        User::create([
            'id' => 6,
            'entity_id' => 3,
            'nom' => 'Jean Soula',
            'pin' => User::hashPin('5555'),
            'role' => 'RESP_BOUTIQUE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // entity:4 — Claire Mé Mo — RESP_BOUTIQUE
        User::create([
            'id' => 7,
            'entity_id' => 4,
            'nom' => 'Claire Mé Mo',
            'pin' => User::hashPin('7777'),
            'role' => 'RESP_BOUTIQUE',
            'active' => true,
            'auth_type' => 'PIN',
        ]);

        // entity:1 — Dir. Legrand — DIRECTION
        User::create([
            'id' => 8,
            'entity_id' => 1,
            'nom' => 'Dir. Legrand',
            'pin' => User::hashPin('6666'),
            'role' => 'DIRECTION',
            'active' => true,
            'auth_type' => 'PIN',
        ]);
    }
}
