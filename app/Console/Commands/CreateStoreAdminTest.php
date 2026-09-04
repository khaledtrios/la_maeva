<?php

namespace App\Console\Commands;

use App\Enums\StoreUserRole;
use App\Models\Store;
use App\Models\StoreUser;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

#[Signature('store:create-admin-test')]
#[Description('Crée un Store Admin de test lié à une entity existante')]
class CreateStoreAdminTest extends Command
{
    public function handle()
    {
        $this->info('Création d\'un Store Admin de test...');

        // Récupérer ou créer une entity LABO pour le test
        $entity = DB::table('entities')->where('type', 'LABO')->first();

        if (!$entity) {
            $this->error('Aucune entity LABO trouvée. Création...');
            $entityId = DB::table('entities')->insertGetId([
                'type' => 'LABO',
                'nom' => 'Labo Test',
                'adresse' => 'Zone Industrielle',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $entityId = $entity->id;
        }

        // Créer le Store lié à l'entity
        $store = Store::create([
            'name' => 'Boutique Test',
            'entity_id' => $entityId,
            'status' => 'ACTIVE',
        ]);

        $this->info("Store créé: ID={$store->id}, entity_id={$entityId}");

        // Créer le Store Admin
        $storeUser = StoreUser::create([
            'store_id' => $store->id,
            'name' => 'Admin Test',
            'email' => 'admin.test@example.test',
            'password' => Hash::make('password123'),
            'role' => StoreUserRole::StoreAdmin->value,
            'active' => true,
        ]);

        $this->info('Store Admin créé avec succès !');
        $this->line('');
        $this->line('<info>Identifiants de test :</info>');
        $this->line("Email    : {$storeUser->email}");
        $this->line("Password : password123");
        $this->line('');
        $this->line('Accédez à : http://localhost:8000/store/login');
    }
}
