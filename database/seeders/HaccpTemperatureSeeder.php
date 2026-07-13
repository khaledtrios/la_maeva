<?php

namespace Database\Seeders;

use App\Models\HaccpTemperature;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HaccpTemperatureSeeder extends Seeder
{
    /**
     * Seed relevés température HACCP
     * Enceintes : "Chambre froide positive", "Chambre froide négative", "Cuisson"
     * Températures normales : ≤7°C (frais), ≤-18°C (surgelé)
     */
    public function run(): void
    {
        $entities = [1, 2, 3, 4]; // labo + 3 boutiques
        $encerntes = [
            'Chambre froide positive',
            'Chambre froide négative',
            'Cuisson',
            'Four',
        ];
        $users = User::whereIn('role', ['EMPLOYE_LABO', 'EMPLOYE_VENTE', 'RESP_LABO', 'RESP_BOUTIQUE'])->pluck('id')->toArray();

        // Derniers 3 jours
        $dates = collect([
            Carbon::now()->subDays(2)->toDateString(),
            Carbon::now()->subDays(1)->toDateString(),
            Carbon::now()->toDateString(),
        ]);

        foreach ($entities as $entityId) {
            foreach ($dates as $date) {
                foreach ($encerntes as $enceinte) {
                    // Température réaliste selon type
                    if (str_contains($enceinte, 'négative')) {
                        $temp = rand(-220, -160) / 10; // -22.0 à -16.0 °C
                    } elseif (str_contains($enceinte, 'positive')) {
                        $temp = rand(10, 40) / 10; // 1.0 à 4.0 °C (souvent correct)
                    } elseif (str_contains($enceinte, 'Cuisson')) {
                        $temp = rand(180, 220); // 180-220°C
                    } else {
                        $temp = rand(160, 200); // Four 160-200°C
                    }

                    HaccpTemperature::create([
                        'entity_id' => $entityId,
                        'enceinte' => $enceinte,
                        'temperature' => $temp,
                        'date' => $date . ' ' . rand(6, 9) . ':00:00',
                        'created_by' => $users[array_rand($users)],
                    ]);
                }
            }
        }
    }
}
