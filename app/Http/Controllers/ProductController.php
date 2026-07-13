<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Liste des produits (avec catégorie et recette chargées)
     */
    public function index()
    {
        $products = Product::with('category', 'recipes.ingredient')->orderBy('nom')->get();
        $categories = \App\Models\Category::orderBy('nom')->get();
        $ingredients = \App\Models\Ingredient::orderBy('nom')->get();

        return Inertia::render('Products/Index', [
            'products'    => $products,
            'categories'  => $categories,
            'ingredients' => $ingredients,
        ]);
    }

    /**
     * Créer un produit
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'  => ['required', 'integer', 'exists:categories,id'],
            'nom'          => ['required', 'string', 'max:255'],
            'code'         => ['nullable', 'string', 'max:50', 'unique:products,code'],
            'prix_vente'   => ['nullable', 'numeric', 'min:0'],
            'cout_revient' => ['nullable', 'numeric', 'min:0'],
            'dlc'          => ['nullable', 'integer', 'min:0'],
        ]);

        Product::create($validated);

        return back()->with('success', "Le produit « {$validated['nom']} » a été créé avec succès.");
    }

    /**
     * Mettre à jour un produit
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id'  => ['required', 'integer', 'exists:categories,id'],
            'nom'          => ['required', 'string', 'max:255'],
            'code'         => ['nullable', 'string', 'max:50', 'unique:products,code,' . $product->id],
            'prix_vente'   => ['nullable', 'numeric', 'min:0'],
            'cout_revient' => ['nullable', 'numeric', 'min:0'],
            'dlc'          => ['nullable', 'integer', 'min:0'],
        ]);

        $product->update($validated);

        return back()->with('success', "Le produit « {$product->nom} » a été modifié avec succès.");
    }

    /**
     * Supprimer un produit
     */
    public function destroy(Product $product)
    {
        $nom = $product->nom;
        $product->delete();

        return back()->with('success', "Le produit « {$nom} » a été supprimé.");
    }

    /**
     * GET /products/{product}/recipe — charge les lignes de recette d'un produit
     */
    public function recipe(Product $product)
    {
        $recipeLines = $product->recipes()->with('ingredient')->get();

        return response()->json($recipeLines);
    }

    /**
     * PUT /products/{product}/recipe — met à jour la recette d'un produit (replace complet)
     */
    public function updateRecipe(Request $request, Product $product)
    {
        $validated = $request->validate([
            'lignes'                 => ['required', 'array', 'min:1'],
            'lignes.*.ingredient_id' => ['required', 'integer', 'exists:ingredients,id'],
            'lignes.*.quantite'      => ['required', 'numeric', 'min:0.001'],
        ]);

        DB::transaction(function () use ($product, $validated) {
            // Supprimer les anciennes lignes
            $product->recipes()->delete();

            // Créer les nouvelles lignes
            foreach ($validated['lignes'] as $ligne) {
                Recipe::create([
                    'product_id'  => $product->id,
                    'ingredient_id' => $ligne['ingredient_id'],
                    'quantite'    => $ligne['quantite'],
                ]);
            }

            // Recalculer le coût de revient
            $product->refresh()->recalculerCoutRevient();
        });

        return back()->with('success', "Recette du produit « {$product->nom} » enregistrée et coût de revient mis à jour.");
    }
}
