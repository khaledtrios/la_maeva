<?php

namespace App\Console\Commands;

use App\Models\Store;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

#[Signature('admins:transform-to-store-admins')]
#[Description('Transforme les Admin/boutique existants en Store Admin')]
class TransformAdminsToStoreAdmins extends Command
{
    public function handle()
    {
        $this->info('Transformation des Admin en Store Admin...');
        $this->newLine();

        // Trouver tous les Admin avec une entity
        $admins = User::where('role', 'ADMIN')
            ->with('entity')
            ->get();

        if ($admins->isEmpty()) {
            $this->warn('Aucun Admin trouvé.');
            return;
        }

        $this->info("Trouvé {$admins->count()} Admin(s) à transformer.");
        $this->newLine();

        $transformed = [];

        foreach ($admins as $admin) {
            $entity = $admin->entity;

            // Créer ou récupérer le Store pour cette entity
            $store = Store::firstOrCreate(
                ['entity_id' => $entity->id],
                [
                    'name' => $entity->nom,
                    'status' => 'ACTIVE',
                ]
            );

            // Générer l'email à partir du nom
            $email = $this->generateEmail($admin->nom);

            // Demander un password à l'utilisateur
            $password = $this->secret("Password pour {$admin->nom} ({$email})");

            if (!$password) {
                $this->error("❌ Skipped {$admin->nom} (no password provided)");
                continue;
            }

            // Mettre à jour le User
            $admin->update([
                'store_id' => $store->id,
                'email' => $email,
                'password' => Hash::make($password),
                'auth_type' => 'EMAIL_PASSWORD',
            ]);

            $transformed[] = [
                'id' => $admin->id,
                'nom' => $admin->nom,
                'email' => $email,
                'entity' => $entity->nom,
                'store_id' => $store->id,
            ];

            $this->info("✅ {$admin->nom} transformé en Store Admin");
        }

        $this->newLine();
        $this->info('Résumé de la transformation :');
        $this->newLine();

        foreach ($transformed as $item) {
            $this->line("ID: {$item['id']} | {$item['nom']} | {$item['email']} | Entity: {$item['entity']} | Store: {$item['store_id']}");
        }

        $this->newLine();
        $this->info('Les Admin peuvent maintenant se connecter via /store/login avec leur email et password.');
    }

    /**
     * Génère un email à partir du nom
     * Exemple: "Admin Dupont" → "admin.dupont@example.test"
     */
    private function generateEmail(string $nom): string
    {
        $parts = explode(' ', strtolower(trim($nom)));
        $slug = implode('.', $parts);

        return "{$slug}@example.test";
    }
}
