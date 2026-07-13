<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:categories,nom'],
        ]);

        Category::create($validated);

        return back()->with('success', "La catégorie « {$validated['nom']} » a été créée.");
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:categories,nom,' . $category->id],
        ]);

        $category->update($validated);

        return back()->with('success', "La catégorie « {$category->nom} » a été modifiée.");
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return back()->with('error', 'Impossible de supprimer la catégorie « {$category->nom} » car elle est utilisée par des produits.');
        }

        $nom = $category->nom;
        $category->delete();

        return back()->with('success', "La catégorie « {$nom} » a été supprimée.");
    }
}
