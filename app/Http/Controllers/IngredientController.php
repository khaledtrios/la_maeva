<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IngredientController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'          => ['required', 'string', 'max:255'],
            'unite'        => ['nullable', 'string', 'max:50'],
            'prix_unitaire' => ['nullable', 'numeric', 'min:0'],
        ]);

        Ingredient::create($validated);

        return back()->with('success', "L'ingrédient « {$validated['nom']} » a été créé.");
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'nom'          => ['required', 'string', 'max:255'],
            'unite'        => ['nullable', 'string', 'max:50'],
            'prix_unitaire' => ['nullable', 'numeric', 'min:0'],
        ]);

        $ingredient->update($validated);

        return back()->with('success', "L'ingrédient « {$ingredient->nom} » a été modifié.");
    }

    public function destroy(Ingredient $ingredient)
    {
        if ($ingredient->recipes()->exists()) {
            return back()->with('error', "Impossible de supprimer l'ingrédient « {$ingredient->nom} » car il est utilisé dans des recettes.");
        }

        $nom = $ingredient->nom;
        $ingredient->delete();

        return back()->with('success', "L'ingrédient « {$nom} » a été supprimé.");
    }
}