<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\SuperAdmin;
use App\Models\User;
use App\Support\CurrentStore;
use App\Enums\StoreStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestDataSeeder extends Seeder
{
    /**
     * Jeu de données de structure : 1 super admin + 3 stores autonomes, chacun
     * avec son entité LABO, son Store Admin et ses 3 employés.
     *
     * ORDRE DE CRÉATION IMPOSÉ PAR LE SCHÉMA (Phase 4, vague 3a) :
     * `entities.store_id` est NOT NULL, alors que `stores.entity_id` est
     * nullable. La dépendance est donc circulaire mais dissymétrique, et une
     * seule séquence la satisfait :
     *   1. le Store (sans entity_id) ;
     *   2. son entité, rattachée au store ;
     *   3. le Store complété avec son entité principale.
     * La version précédente créait l'Entity en premier, d'où l'erreur MySQL
     * 1364 « Field 'store_id' doesn't have a default value ».
     */
    private const STORES = [
        [
            'name' => 'Labo Maéva Cayenne',
            'phone' => '+594 5 94 35 56 92',
            'address' => '123 Rue de Cayenne',
            'city' => 'Cayenne',
            'postal_code' => '97300',
            'siret' => '12345678901234',
            'admin' => ['name' => 'Admin Cayenne', 'email' => 'admin.cayenne@test.com'],
            'employes' => [
                ['nom' => 'Chef Labo Cayenne', 'pin' => '1111', 'role' => 'RESP_LABO'],
                ['nom' => 'Employé Labo Cayenne', 'pin' => '2222', 'role' => 'EMPLOYE_LABO'],
                ['nom' => 'Employé Vente Cayenne', 'pin' => '3333', 'role' => 'EMPLOYE_VENTE'],
            ],
        ],
        [
            'name' => 'Labo Maéva Paris',
            'phone' => '+33 1 23 45 67 89',
            'address' => '456 Rue de Paris',
            'city' => 'Paris',
            'postal_code' => '75001',
            'siret' => '23456789012345',
            'admin' => ['name' => 'Admin Paris', 'email' => 'admin.paris@test.com'],
            'employes' => [
                ['nom' => 'Chef Labo Paris', 'pin' => '4444', 'role' => 'RESP_LABO'],
                ['nom' => 'Employé Labo Paris', 'pin' => '5555', 'role' => 'EMPLOYE_LABO'],
                ['nom' => 'Employé Vente Paris', 'pin' => '6666', 'role' => 'EMPLOYE_VENTE'],
            ],
        ],
        [
            'name' => 'Labo Maéva Marseille',
            'phone' => '+33 4 91 23 45 67',
            'address' => '789 Rue de Marseille',
            'city' => 'Marseille',
            'postal_code' => '13001',
            'siret' => '34567890123456',
            'admin' => ['name' => 'Admin Marseille', 'email' => 'admin.marseille@test.com'],
            'employes' => [
                ['nom' => 'Chef Labo Marseille', 'pin' => '7777', 'role' => 'RESP_LABO'],
                ['nom' => 'Employé Labo Marseille', 'pin' => '8888', 'role' => 'EMPLOYE_LABO'],
                ['nom' => 'Employé Vente Marseille', 'pin' => '9999', 'role' => 'EMPLOYE_VENTE'],
            ],
        ],
    ];

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
        // 2) STORES, ENTITÉS, STORE ADMINS & EMPLOYÉS
        // ============================================
        foreach (self::STORES as $definition) {
            $this->seedStore($definition);
        }
    }

    private function seedStore(array $definition): void
    {
        // ── 1. Le Store d'abord : l'entité ne peut pas exister sans lui ──
        $store = Store::create([
            'name' => $definition['name'],
            // `slug` alimente les routes employés `/{slug}/login` : sans lui,
            // les employés créés plus bas n'auraient aucune page de connexion.
            'slug' => Str::slug($definition['name']) . '-store',
            'phone' => $definition['phone'],
            'address' => $definition['address'],
            'city' => $definition['city'],
            'postal_code' => $definition['postal_code'],
            'siret' => $definition['siret'],
        ]);

        // `status` / `status_changed_at` sont volontairement hors de
        // Store::$fillable (ils ne changent que via approve()/reject()/…) : les
        // passer à create() les faisait IGNORER EN SILENCE et le store restait
        // PENDING. forceFill() est le même contournement que Store::approve().
        $store->forceFill([
            'status' => StoreStatus::Active,
            'status_changed_at' => now(),
        ])->save();

        // ── 2. L'entité LABO, rattachée au store ──
        // `store_id` est volontairement hors de Entity::$fillable (changer le
        // tenant d'une entité ne doit jamais venir d'un mass-assign) : il est
        // posé par le trait BelongsToStore depuis le contexte courant. En
        // console ce contexte est vide, on le force donc explicitement plutôt
        // que d'écrire l'attribut à la main — c'est le chemin prévu par
        // l'architecture, et il reste valable si le trait évolue.
        $entity = CurrentStore::for($store->id, fn () => Entity::create([
            'type' => 'LABO',
            'nom' => $definition['name'],
            'adresse' => $definition['address'],
        ]));

        // ── 3. Boucler la relation : entité principale du store ──
        // `entity_id` non plus n'est pas fillable, d'où forceFill ici aussi.
        // Sans cette étape, TenantIsolatedDemoSeeder ignorerait le store
        // (« Store #X sans entité principale : ignoré ») et ne produirait
        // aucune donnée métier.
        $store->forceFill(['entity_id' => $entity->id])->save();

        // ── 4. Le Store Admin ──
        StoreUser::create([
            'store_id' => $store->id,
            'name' => $definition['admin']['name'],
            'email' => $definition['admin']['email'],
            'password' => Hash::make('password123'),
            'role' => 'STORE_ADMIN',
            'active' => true,
        ]);

        // ── 5. Les employés, rattachés à l'entité ET au store ──
        foreach ($definition['employes'] as $employe) {
            User::create([
                'entity_id' => $entity->id,
                'store_id' => $store->id,
                'nom' => $employe['nom'],
                'pin' => User::hashPin($employe['pin']),
                'role' => $employe['role'],
                'active' => true,
                'auth_type' => 'PIN',
            ]);
        }
    }
}
