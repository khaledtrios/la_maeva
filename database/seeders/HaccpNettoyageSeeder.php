<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\HaccpNettoyage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HaccpNettoyageSeeder extends Seeder
{
    /**
     * Seed plans de nettoyage HACCP
     * Plan du jour + historique
     */
    public function run(): void
    {
        $entities = Entity::all();
        $users = User::whereIn('role', ['RESP_LABO', 'RESP_BOUTIQUE'])->pluck('id')->toArray();

        // Tâches standard
        $tachesBase = [
            ['nom' => 'Sol laboratoire', 'fait' => false],
            ['nom' => 'Plan de travail', 'fait' => false],
            ['nom' => 'Four/étuve', 'fait' => false],
            ['nom' => 'Chambre froide', 'fait' => false],
            ['nom' => 'Caisse/enregistreuse', 'fait' => false],
        ];

        // Pour chaque entité, créer le plan d'aujourd'hui + 2 jours passés
        foreach ($entities as $entity) {
            for ($i = 0; $i < 3; $i++) {
                $date = Carbon::now()->subDays($i)->toDateString();
                $taches = array_map(function ($t) use ($i) {
                    // Simuler certaines tâches déjà faites pour les jours passés
                    if ($i > 0) {
                        $t['fait'] = rand(0, 1) === 1;
                    }
                    return $t;
                }, $tachesBase);

                $plan = HaccpNettoyage::create([
                    'entity_id' => $entity->id,
                    'date' => $date,
                    'taches_json' => $taches,
                    'statut' => $i === 0 ? 'EN_COURS' : 'VALIDE',
                    'valide_par' => $i > 0 ? $users[array_rand($users)] : null,
                ]);
            }
        }
    }
}
