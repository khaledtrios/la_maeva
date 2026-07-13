<?php

namespace Database\Seeders;

use App\Models\Production;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
{
    /**
     * Seed plusieurs jours de production pour entity_id=1 (Labo)
     * Données de démo sur la semaine du 2026-04-15 au 2026-04-22
     */
    public function run(): void
    {
        $createdBy = [2, 3]; // Chef Labo Martin (2) ou Pierre Labeur (3)

        // Jours de production : du 15 au 22 avril 2026
        $dates = collect([
            '2026-04-15',
            '2026-04-16',
            '2026-04-17',
            '2026-04-18',
            '2026-04-19',
            '2026-04-20',
            '2026-04-21',
            '2026-04-22',
        ]);

        foreach ($dates as $date) {
            // Croissant — grosse production
            Production::create([
                'entity_id' => 1,
                'product_id' => 1,
                'quantite' => rand(120, 180),
                'quantite_pertes' => rand(3, 8),
                'lot' => 'LOT-CRO-' . str_replace('-', '', $date) . '-01',
                'date' => $date,
                'created_by' => $createdBy[array_rand($createdBy)],
            ]);

            // Pain au chocolat
            Production::create([
                'entity_id' => 1,
                'product_id' => 2,
                'quantite' => rand(80, 120),
                'quantite_pertes' => rand(2, 5),
                'lot' => 'LOT-PCH-' . str_replace('-', '', $date) . '-01',
                'date' => $date,
                'created_by' => $createdBy[array_rand($createdBy)],
            ]);

            // Baguette tradition — très grosse production
            Production::create([
                'entity_id' => 1,
                'product_id' => 4,
                'quantite' => rand(200, 300),
                'quantite_pertes' => rand(5, 12),
                'lot' => 'LOT-BAG-' . str_replace('-', '', $date) . '-01',
                'date' => $date,
                'created_by' => $createdBy[array_rand($createdBy)],
            ]);

            // Pain de campagne
            Production::create([
                'entity_id' => 1,
                'product_id' => 5,
                'quantite' => rand(40, 60),
                'quantite_pertes' => rand(1, 3),
                'lot' => 'LOT-PDC-' . str_replace('-', '', $date) . '-01',
                'date' => $date,
                'created_by' => $createdBy[array_rand($createdBy)],
            ]);

            // Brioche individuelle
            Production::create([
                'entity_id' => 1,
                'product_id' => 9,
                'quantite' => rand(50, 80),
                'quantite_pertes' => rand(2, 4),
                'lot' => 'LOT-BRI-' . str_replace('-', '', $date) . '-01',
                'date' => $date,
                'created_by' => $createdBy[array_rand($createdBy)],
            ]);
        }
    }
}
