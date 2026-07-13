<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use App\Models\User;
use App\Models\FactureSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Page d'administration — onglets Entités / Utilisateurs / Facturation
     */
    public function index()
    {
        $entities = Entity::orderBy('nom')->get()->map(function ($e) {
            return [
                'id'       => $e->id,
                'type'     => $e->type,
                'nom'      => $e->nom,
                'adresse'  => $e->adresse,
                'logo'     => $e->logo,
                'logo_url' => $e->logo ? asset('storage/' . $e->logo) : null,
            ];
        });

        $users = User::with('entity')->orderBy('nom')->get()->map(function ($u) {
            return [
                'id'        => $u->id,
                'nom'       => $u->nom,
                'entity_id' => $u->entity_id,
                'entity'    => $u->entity ? ['id' => $u->entity->id, 'nom' => $u->entity->nom, 'type' => $u->entity->type] : null,
                'role'      => $u->role,
                'active'    => $u->active,
                'pin'       => '****',
            ];
        });

        // Settings facturation
        $autoGen = FactureSetting::get('auto_generation_enabled', 'false') === 'true';

        return Inertia::render('Admin/Index', [
            'entities' => $entities,
            'users'    => $users,
            'facture_settings' => [
                'auto_generation_enabled' => $autoGen,
                'description' => 'La génération automatique crée chaque mois une facture par boulangerie à partir des expéditions confirmées. Les factures sont générées en BROUILLON et nécessitent une validation manuelle.',
            ],
        ]);
    }

    // ============================================
    // GESTION DES ENTITÉS
    // ============================================

    public function storeEntity(Request $request)
    {
        $validated = $request->validate([
            'type'   => ['required', 'in:LABO,BOULANGERIE'],
            'nom'    => ['required', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:500'],
        ]);

        Entity::create($validated);

        return back()->with('success', "Entité « {$validated['nom']} » ({$validated['type']}) créée avec succès.");
    }

    public function updateEntity(Request $request, Entity $entity)
    {
        $validated = $request->validate([
            'type'   => ['required', 'in:LABO,BOULANGERIE'],
            'nom'    => ['required', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:500'],
        ]);

        $entity->update($validated);

        return back()->with('success', "Entité « {$entity->nom} » modifiée.");
    }

    /**
     * Upload du logo d'une entité
     */
    public function uploadEntityLogo(Request $request, Entity $entity)
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,svg,webp', 'max:2048'],
        ]);

        // Supprimer l'ancien logo s'il existe
        if ($entity->logo) {
            Storage::disk('public')->delete($entity->logo);
        }

        $path = $request->file('logo')->store('entities/logos', 'public');
        $entity->update(['logo' => $path]);

        return back()->with('success', "Logo de « {$entity->nom} » mis à jour.");
    }

    /**
     * Supprimer le logo d'une entité
     */
    public function deleteEntityLogo(Entity $entity)
    {
        if ($entity->logo) {
            Storage::disk('public')->delete($entity->logo);
            $entity->update(['logo' => null]);
        }

        return back()->with('success', "Logo de « {$entity->nom} » supprimé.");
    }

    public function destroyEntity(Entity $entity)
    {
        // Protection : une entité avec utilisateurs ou productions ne peut être supprimée sans vérification métier
        // Pour simplifier : on empêche la suppression si elle a des utilisateurs
        if ($entity->users()->exists()) {
            return back()->with('error', "Impossible de supprimer l'entité « {$entity->nom} » car elle est liée à des utilisateurs.");
        }

        // Supprimer le logo si présent
        if ($entity->logo) {
            Storage::disk('public')->delete($entity->logo);
        }

        $nom = $entity->nom;
        $entity->delete();

        return back()->with('success', "Entité « {$nom} » supprimée.");
    }

    // ============================================
    // GESTION DES UTILISATEURS
    // ============================================

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'nom'       => ['required', 'string', 'max:255'],
            'entity_id' => ['required', 'integer', 'exists:entities,id'],
            'role'      => ['required', 'in:ADMIN,DIRECTION,RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE'],
            'pin'       => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'active'    => ['boolean'],
        ]);

        $validated['pin'] = User::hashPin($validated['pin']);

        User::create($validated);

        return back()->with('success', "Utilisateur « {$validated['nom']} » créé avec le rôle {$validated['role']}.");
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'nom'       => ['required', 'string', 'max:255'],
            'entity_id' => ['required', 'integer', 'exists:entities,id'],
            'role'      => ['required', 'in:ADMIN,DIRECTION,RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE'],
            'pin'       => ['nullable', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'active'    => ['boolean'],
        ]);

        // Si pin fourni (non vide), on le hache ; sinon on garde l'ancien
        if (!empty($validated['pin'])) {
            $validated['pin'] = User::hashPin($validated['pin']);
        } else {
            unset($validated['pin']);
        }

        $user->update($validated);

        return back()->with('success', "Utilisateur « {$user->nom} » modifié.");
    }

    public function destroyUser(User $user)
    {
        // Protection : impossible de se supprimer soi-même
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Impossible de se supprimer soi-même.');
        }

        $nom = $user->nom;
        $user->delete();

        return back()->with('success', "Utilisateur « {$nom} » supprimé.");
    }

    // ============================================
    // PARAMÈTRES FACTURATION
    // ============================================

    /**
     * Affiche les paramètres de facturation
     */
    public function factureSettings()
    {
        $autoGen = FactureSetting::get('auto_generation_enabled', 'false') === 'true';

        return Inertia::render('Admin/FactureSettings', [
            'auto_generation_enabled' => $autoGen,
            'description' => 'La génération automatique crée chaque mois une facture par boulangerie à partir des expéditions confirmées. Les factures sont générées en BROUILLON et nécessitent une validation manuelle.',
        ]);
    }

    /**
     * Active/désactive la génération automatique des factures
     */
    public function toggleAutoGeneration(Request $request)
    {
        $request->validate(['enabled' => ['required', 'boolean']]);

        FactureSetting::set(
            'auto_generation_enabled',
            $request->enabled ? 'true' : 'false',
            'Active/désactive la génération automatique des factures périodiques'
        );

        return back()->with(
            'success',
            $request->enabled ? 'Génération automatique des factures activée.' : 'Génération automatique des factures désactivée.'
        );
    }
}
