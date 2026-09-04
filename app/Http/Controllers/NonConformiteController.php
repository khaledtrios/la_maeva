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
        $user = $this->getCurrentUser();

        $query = HaccpNonConformite::with(['creator', 'entity']);

        // Accès global en lecture : ADMIN + DIRECTION (guard "web") uniquement.
        // Le Store Admin reste cloisonné à l'entité de son store.
        $seesAllEntities = !$this->isStoreAdmin()
            && in_array($user->role, ['ADMIN', 'DIRECTION']);

        if (!$seesAllEntities) {
            $query->where('entity_id', $this->getCurrentEntityId());
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
        $user = $this->getCurrentUser();
        $entityId = $this->getCurrentEntityId();

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
        $entityId = $this->getCurrentEntityId();

        // Ownership — seul l'ADMIN interne (guard "web") a un accès global. Le
        // Store Admin reste cloisonné à son entité.
        if (!$this->hasGlobalEntityAccess() && $nc->entity_id !== $entityId) {
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
