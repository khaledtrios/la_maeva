<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Seed 3 catégories : Viennoiseries, Pains, Pâtisseries
     */
    public function run(): void
    {
        Category::create([
            'id' => 1,
            'nom' => 'Viennoiseries',
        ]);

        Category::create([
            'id' => 2,
            'nom' => 'Pains',
        ]);

        Category::create([
            'id' => 3,
            'nom' => 'Pâtisseries',
        ]);
    }
}
