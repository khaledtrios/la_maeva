<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\HaccpControleReception;
use App\Models\HaccpNonConformite;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HaccpNonConformiteSeeder extends Seeder
{
    /**
     * Seed des non-conformités
     * Générées automatiquement si contrôle réception NON CONFORME
     * Ici on crée des NC manuelles aussi (type divers)
     */
    public function run(): void
    {
        // 1. NC automatiques depuis contrôles réception NON CONFORMES
        $controlesNonConformes = HaccpControleReception::where('conforme', false)
            ->get();

        foreach ($controlesNonConformes as $controle) {
            HaccpNonConformite::create([
                'entity_id' => $controle->entity_id,
                'type' => 'TEMPERATURE',
                'description' => "Livraison {$controle->fournisseur} ({$controle->bl_number}) — {$controle->categorie} à {$controle->temperature}°C",
                'action' => null,
                'statut' => 'OUVERTE',
                'date' => $controle->date,
                'created_by' => $controle->created_by,
            ]);
        }

        // 2. NC manuelles supplémentaires (exemples métier)
        $entities = Entity::all();
        $users = User::whereIn('role', ['RESP_LABO', 'RESP_BOUTIQUE'])->pluck('id')->toArray();
        $types = ['TEMPERATURE', 'HYGIENE', 'TRACABILITE', 'CRITIQUE'];

        for ($i = 0; $i < 5; $i++) {
            $entity = $entities->random();
            $date = Carbon::now()->subDays(rand(1, 10))->toDateString();

            HaccpNonConformite::create([
                'entity_id' => $entity->id,
                'type' => $types[array_rand($types)],
                'description' => 'Non-conformité détectée lors de l\'inspection quotidienne.',
                'action' => null,
                'statut' => 'OUVERTE',
                'date' => $date,
                'created_by' => $users[array_rand($users)],
            ]);
        }
    }
}
