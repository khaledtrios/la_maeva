<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\HaccpControleReception;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HaccpControleReceptionSeeder extends Seeder
{
    /**
     * Seed des contrôles réception fournisseurs
     * Certains conformes, certains non-conformes (qui génèrent une NC)
     */
    public function run(): void
    {
        $entities = Entity::where('type', 'BOULANGERIE')->get(); // seulement les boutiques
        $fournisseurs = ['Fournisseur A', 'Fournisseur B', 'Fournisseur C'];
        $users = User::whereIn('role', ['RESP_BOUTIQUE', 'EMPLOYE_VENTE'])->pluck('id')->toArray();

        // 10 contrôles sur les 7 derniers jours, répartis
        for ($i = 0; $i < 10; $i++) {
            $entity = $entities->random();
            $fournisseur = $fournisseurs[array_rand($fournisseurs)];
            $categorie = ['AMBIANT', 'FRAIS', 'SURGELE'][array_rand(['AMBIANT', 'FRAIS', 'SURGELE'])];
            $date = Carbon::now()->subDays(rand(0, 6))->toDateString();

            // Température : si FRAIS, 70% chance conforme (≤4°C), 30% non-conforme (>4°C)
            // Si SURGELE, conforme ≤ -18°C
            $conforme = rand(0, 100) < 70; // 70% conformes
            $temperature = null;
            if ($categorie === 'FRAIS') {
                $temperature = $conforme ? rand(0, 40) / 10 : rand(50, 100) / 10; // 0-4°C ou 5-10°C
            } elseif ($categorie === 'SURGELE') {
                $temperature = $conforme ? rand(-250, -180) / 10 : rand(-150, -100) / 10;
            } else {
                $temperature = null; // AMBIANT
            }

            HaccpControleReception::create([
                'entity_id' => $entity->id,
                'fournisseur' => $fournisseur,
                'bl_number' => 'BL-' . strtoupper(uniqid()),
                'categorie' => $categorie,
                'temperature' => $temperature,
                'conforme' => $conforme,
                'commentaire' => $conforme ? null : 'Température hors norme HACCP',
                'date' => $date,
                'created_by' => $users[array_rand($users)],
            ]);
        }
    }
}
