<?php

namespace App\Http\Controllers;

use App\Models\HaccpNonConformite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NonConformiteController extends Controller
{
    /**
     * Liste des non-conformités
     * ADMIN/DIRECTION voient tout, autres filtrent par entity_id
     */
    public function index()
    {
        $user = Auth::user();

        $query = HaccpNonConformite::with(['creator', 'entity']);

        if ($user->role !== 'ADMIN' && $user->role !== 'DIRECTION') {
            $query->where('entity_id', $user->entity_id);
        }

        $ncs = $query->orderByDesc('date')->get();

        return Inertia::render('NonConformites/Index', [
            'ncs' => $ncs,
        ]);
    }

    /**
     * Créer une non-conformité
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $entityId = $user->entity_id;

        $validated = $request->validate([
            'type'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        HaccpNonConformite::create([
            'entity_id'  => $entityId,
            'type'       => $validated['type'],
            'description' => $validated['description'],
            'action'     => null,
            'statut'     => 'OUVERTE',
            'date'       => now()->toDateString(),
            'created_by' => $user->id,
        ]);

        return back()->with('success', "Non-conformité de type « {$validated['type']} » créée et enregistrée.");
    }

    /**
     * Mettre à jour une non-conformité (action corrective + statut)
     */
    public function update(Request $request, HaccpNonConformite $nc)
    {
        $user = Auth::user();

        // Vérifier ownership (sauf ADMIN)
        if ($user->role !== 'ADMIN' && $nc->entity_id !== $user->entity_id) {
            abort(403);
        }

        $validated = $request->validate([
            'statut' => ['required', 'in:OUVERTE,RESOLUE'],
            'action' => ['nullable', 'string'],
        ]);

        $oldStatus = $nc->statut;
        $nc->update($validated);
        $newStatus = $validated['statut'];
        $msg = $oldStatus === $newStatus ? "Non-conformité #{$nc->id} mise à jour" : "Non-conformité #{$nc->id} résolue";
        return back()->with('success', $msg);
    }
}
