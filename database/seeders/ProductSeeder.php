<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Seed 11 produits avec DLC (Durée de Limite de Consommation) en jours
     * Viennoiseries: 1-2 jours, Pains: 1 jour, Pâtisseries: 2 jours
     */
    public function run(): void
    {
        $products = [
            ['id' => 1, 'category_id' => 1, 'nom' => 'Croissant',           'code' => 'VIE-001', 'prix_vente' => 1.20, 'cout_revient' => 0.45, 'dlc' => 1],
            ['id' => 2, 'category_id' => 1, 'nom' => 'Pain au chocolat',    'code' => 'VIE-002', 'prix_vente' => 1.40, 'cout_revient' => 0.55, 'dlc' => 1],
            ['id' => 3, 'category_id' => 1, 'nom' => 'Chausson aux pommes', 'code' => 'VIE-003', 'prix_vente' => 1.30, 'cout_revient' => 0.50, 'dlc' => 2],
            ['id' => 4, 'category_id' => 2, 'nom' => 'Baguette tradition',  'code' => 'PAI-001', 'prix_vente' => 1.10, 'cout_revient' => 0.30, 'dlc' => 1],
            ['id' => 5, 'category_id' => 2, 'nom' => 'Pain de campagne',    'code' => 'PAI-002', 'prix_vente' => 2.50, 'cout_revient' => 0.70, 'dlc' => 1],
            ['id' => 6, 'category_id' => 2, 'nom' => 'Baguette céréales',   'code' => 'PAI-003', 'prix_vente' => 1.30, 'cout_revient' => 0.40, 'dlc' => 1],
            ['id' => 7, 'category_id' => 3, 'nom' => 'Éclair chocolat',     'code' => 'PAT-001', 'prix_vente' => 2.80, 'cout_revient' => 0.90, 'dlc' => 2],
            ['id' => 8, 'category_id' => 3, 'nom' => 'Tarte aux fraises',   'code' => 'PAT-002', 'prix_vente' => 3.50, 'cout_revient' => 1.20, 'dlc' => 2],
            ['id' => 9, 'category_id' => 1, 'nom' => 'Brioche individuelle', 'code' => 'VIE-004', 'prix_vente' => 1.60, 'cout_revient' => 0.60, 'dlc' => 2],
            ['id' => 10, 'category_id' => 3, 'nom' => 'Millefeuille',       'code' => 'PAT-003', 'prix_vente' => 3.20, 'cout_revient' => 1.10, 'dlc' => 2],
            ['id' => 11, 'category_id' => 2, 'nom' => 'Pain aux noix 400g', 'code' => 'PAI-004', 'prix_vente' => 2.80, 'cout_revient' => 0.80, 'dlc' => 1],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(['id' => $data['id']], $data);
        }
    }
}
