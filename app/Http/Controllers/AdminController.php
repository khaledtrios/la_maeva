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
     * Défense en profondeur (correctif P0 escalade de privilèges) : la route
     * `/{slug}/admin/*` porte désormais `role:ADMIN`, mais ce contrôleur est
     * PARTAGÉ avec `/store/admin/*` (guard "store"). Ce garde vérifie qu'un
     * appelant guard "web" qui n'est PAS Store Admin a bien le rôle ADMIN —
     * avant ce correctif, seul le guard était testé (`auth('store')->check()`),
     * jamais le rôle, ce qui laissait passer n'importe quel employé.
     */
    private function assertInternalAdmin(string $action): void
    {
        if (!auth('web')->check() || auth('web')->user()->role !== 'ADMIN') {
            abort(403, "Seul l'administrateur système peut $action.");
        }
    }

    /**
     * Résout un modèle depuis un paramètre de route PAR SON NOM plutôt que par
     * type-hint. Même bug/correctif que `ProductController::resolveProduct()` :
     * les routes admin existent en deux déclinaisons, `/{slug}/admin/...`
     * (employé) et `/store/admin/...` (Store Admin). Sous `/{slug}/...`, Laravel
     * injecte les paramètres de route par POSITION — avec un `User $user` ou
     * `Entity $entity` type-hinté en 2e argument, c'est le slug (string) qui
     * était passé à la place du modèle → TypeError 500 avant ce correctif,
     * découvert en vérifiant le scénario positif ADMIN du correctif P0
     * ci-dessus (bug préexistant, indépendant de l'escalade de privilèges,
     * jamais testé auparavant sur ce groupe de routes).
     */
    private function resolveRouteModel(Request $request, string $param, string $class): mixed
    {
        $value = $request->route($param);

        return $value instanceof $class ? $value : $class::findOrFail($value);
    }

    /**
     * Page d'administration — onglets Entités / Utilisateurs / Facturation.
     *
     * Cloisonnement multi-tenant :
     *  - Store Admin (guard "store") : voit UNIQUEMENT son propre store — ses
     *    employés. Pas d'entités globales, pas de paramètres de facturation.
     *  - Admin interne (guard web) : accès global à toutes les entités, tous
     *    les utilisateurs et les paramètres de facturation.
     */
    public function index()
    {
        $mapUser = fn ($u) => [
            'id'        => $u->id,
            'nom'       => $u->nom,
            'entity_id' => $u->entity_id,
            'entity'    => $u->entity ? ['id' => $u->entity->id, 'nom' => $u->entity->nom, 'type' => $u->entity->type] : null,
            'role'      => $u->role,
            'active'    => $u->active,
            'pin'       => '****',
        ];

        // ── Store Admin : accès cloisonné à son store ──
        if (auth('store')->check()) {
            $storeAdmin = auth('store')->user();

            $users = User::with('entity')
                ->where('store_id', $storeAdmin->store_id)
                ->whereIn('role', ['RESP_LABO', 'EMPLOYE_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'DIRECTION'])
                ->orderBy('nom')
                ->get()
                ->map($mapUser);

            // Uniquement SON entité (affichée en lecture seule dans le formulaire),
            // jamais la liste globale des entités.
            $ownEntity = Entity::find($storeAdmin->store->entity_id);
            $entities = $ownEntity ? [[
                'id'       => $ownEntity->id,
                'type'     => $ownEntity->type,
                'nom'      => $ownEntity->nom,
                'adresse'  => $ownEntity->adresse,
                'logo'     => $ownEntity->logo,
                'logo_url' => $ownEntity->logo ? asset('storage/' . $ownEntity->logo) : null,
            ]] : [];

            return Inertia::render('Admin/Index', [
                'entities' => $entities,
                'users'    => $users,
                'facture_settings' => [],
            ]);
        }

        // ── Admin interne : accès global ──
        $this->assertInternalAdmin('accéder à cette page');

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

        $users = User::with('entity')->orderBy('nom')->get()->map($mapUser);

        $autoGen = FactureSetting::get('auto_generation_enabled', 'false') === 'true';
        $factureSettings = [
            'auto_generation_enabled' => $autoGen,
            'description' => 'La génération automatique crée chaque mois une facture par boulangerie à partir des expéditions confirmées. Les factures sont générées en BROUILLON et nécessitent une validation manuelle.',
        ];

        return Inertia::render('Admin/Index', [
            'entities' => $entities,
            'users'    => $users,
            'facture_settings' => $factureSettings,
        ]);
    }

    // ============================================
    // GESTION DES ENTITÉS
    // ============================================

    public function storeEntity(Request $request)
    {
        // Réservé à l'Admin interne — cloisonnement : le Store Admin ne gère pas les entités
        $this->assertInternalAdmin('créer des entités');

        $validated = $request->validate([
            'type'   => ['required', 'in:LABO,BOULANGERIE'],
            'nom'    => ['required', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:500'],
        ]);

        Entity::create($validated);

        return back()->with('success', "Entité « {$validated['nom']} » ({$validated['type']}) créée avec succès.");
    }

    public function updateEntity(Request $request)
    {
        $this->assertInternalAdmin('modifier les entités');

        $entity = $this->resolveRouteModel($request, 'entity', Entity::class);

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
    public function uploadEntityLogo(Request $request)
    {
        $this->assertInternalAdmin('gérer les logos des entités');

        $entity = $this->resolveRouteModel($request, 'entity', Entity::class);

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
    public function deleteEntityLogo(Request $request)
    {
        $this->assertInternalAdmin('gérer les logos des entités');

        $entity = $this->resolveRouteModel($request, 'entity', Entity::class);

        if ($entity->logo) {
            Storage::disk('public')->delete($entity->logo);
            $entity->update(['logo' => null]);
        }

        return back()->with('success', "Logo de « {$entity->nom} » supprimé.");
    }

    public function destroyEntity(Request $request)
    {
        $this->assertInternalAdmin('supprimer des entités');

        $entity = $this->resolveRouteModel($request, 'entity', Entity::class);

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
        $isStoreAdmin = auth('store')->check();

        // Correctif P0 : un appelant guard "web" doit être ADMIN, jamais un
        // simple employé — sans ce garde, storeUser() acceptait role=ADMIN
        // pour QUICONQUE authentifié via le guard web (escalade de privilèges).
        if (!$isStoreAdmin) {
            $this->assertInternalAdmin('créer des utilisateurs');
        }

        // Store Admin ne peut créer que pour son store et avec des rôles employé
        $roleRules = $isStoreAdmin
            ? ['required', 'in:RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE']  // Pas ADMIN/DIRECTION
            : ['required', 'in:ADMIN,DIRECTION,RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE'];

        $validationRules = [
            'nom'       => ['required', 'string', 'max:255'],
            'role'      => $roleRules,
            'pin'       => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'active'    => ['boolean'],
        ];

        // Admin interne : entity_id fourni et validé. Store Admin : forcé automatiquement.
        if (!$isStoreAdmin) {
            $validationRules['entity_id'] = ['required', 'integer', 'exists:entities,id'];
        }

        $validated = $request->validate($validationRules);

        if ($isStoreAdmin) {
            $storeAdmin = auth('store')->user();
            $validated['store_id'] = $storeAdmin->store_id;
            $validated['entity_id'] = $storeAdmin->store->entity_id;
            $validated['auth_type'] = 'PIN';
        }

        $validated['pin'] = User::hashPin($validated['pin']);

        User::create($validated);

        return back()->with('success', "Utilisateur « {$validated['nom']} » créé avec le rôle {$validated['role']}.");
    }

    public function updateUser(Request $request)
    {
        $isStoreAdmin = auth('store')->check();

        // Correctif P0 : idem storeUser() — sans ce garde, n'importe quel
        // employé guard "web" pouvait modifier (y compris passer en ADMIN)
        // n'importe quel utilisateur de n'importe quel store, faute de check.
        if (!$isStoreAdmin) {
            $this->assertInternalAdmin('modifier des utilisateurs');
        }

        $user = $this->resolveRouteModel($request, 'user', User::class);

        // Store Admin ne peut modifier que les utilisateurs de son propre store
        if ($isStoreAdmin) {
            $storeAdmin = auth('store')->user();
            if ($user->store_id !== $storeAdmin->store_id) {
                abort(403, 'Vous ne pouvez modifier que les utilisateurs de votre store.');
            }
        }

        $roleRules = $isStoreAdmin
            ? ['required', 'in:RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE']
            : ['required', 'in:ADMIN,DIRECTION,RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE'];

        $validationRules = [
            'nom'       => ['required', 'string', 'max:255'],
            'role'      => $roleRules,
            'pin'       => ['nullable', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'active'    => ['boolean'],
        ];

        if (!$isStoreAdmin) {
            $validationRules['entity_id'] = ['required', 'integer', 'exists:entities,id'];
        }

        $validated = $request->validate($validationRules);

        // Store Admin : entity_id préservé (ne peut pas être changé)
        if ($isStoreAdmin) {
            $validated['entity_id'] = $user->entity_id;
        }

        // Si pin fourni (non vide), on le hache ; sinon on garde l'ancien
        if (!empty($validated['pin'])) {
            $validated['pin'] = User::hashPin($validated['pin']);
        } else {
            unset($validated['pin']);
        }

        $user->update($validated);

        return back()->with('success', "Utilisateur « {$user->nom} » modifié.");
    }

    public function destroyUser(Request $request)
    {
        $isStoreAdmin = auth('store')->check();

        // Correctif P0 : idem storeUser()/updateUser() — sans ce garde,
        // n'importe quel employé guard "web" pouvait supprimer n'importe quel
        // utilisateur de n'importe quel store (protection self-delete mise à
        // part).
        if (!$isStoreAdmin) {
            $this->assertInternalAdmin('supprimer des utilisateurs');
        }

        $user = $this->resolveRouteModel($request, 'user', User::class);

        // Protection : impossible de se supprimer soi-même
        if ($user->id === Auth::id() || ($user->id === auth('store')->id() && $isStoreAdmin)) {
            return back()->with('error', 'Impossible de se supprimer soi-même.');
        }

        // Store Admin ne peut supprimer que les utilisateurs de son propre store
        if ($isStoreAdmin) {
            $storeAdmin = auth('store')->user();
            if ($user->store_id !== $storeAdmin->store_id) {
                abort(403, 'Vous ne pouvez supprimer que les utilisateurs de votre store.');
            }
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
        $this->assertInternalAdmin('accéder aux paramètres de facturation');

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
        $this->assertInternalAdmin('modifier les paramètres de facturation');

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
