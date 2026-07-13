<?php

namespace Database\Seeders;

use App\Models\Entity;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EntitySeeder extends Seeder
{
    /**
     * Seed les 4 entités : 1 LABO + 3 BOULANGERIES
     */
    public function run(): void
    {
        Entity::create([
            'id' => 1,
            'type' => 'LABO',
            'nom' => 'Labo Maéva Cayenne',
            'adresse' => 'Zone Industrielle Dégrad des Cannes, Cayenne',
        ]);

        Entity::create([
            'id' => 2,
            'type' => 'BOULANGERIE',
            'nom' => 'Maéva Cayenne',
            'adresse' => '12 rue Christophe Colomb, Cayenne',
        ]);

        Entity::create([
            'id' => 3,
            'type' => 'BOULANGERIE',
            'nom' => 'Maéva Soula',
            'adresse' => 'Route de Soula, Matoury',
        ]);

        Entity::create([
            'id' => 4,
            'type' => 'BOULANGERIE',
            'nom' => 'Mé Mo Toucho Cayenne',
            'adresse' => 'Boulevard Nelson Mandela, Cayenne',
        ]);
    }
}
