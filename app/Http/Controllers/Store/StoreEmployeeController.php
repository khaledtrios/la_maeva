<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\Store\StoreEmployeeRequest;
use App\Http\Requests\Store\UpdateStoreEmployeeRequest;
use Inertia\Inertia;

class StoreEmployeeController extends Controller
{
    public function index()
    {
        $storeAdmin = auth('store')->user();
        $employees = User::where('store_id', $storeAdmin->store_id)
            ->whereIn('role', ['RESP_LABO', 'EMPLOYE_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'DIRECTION'])
            ->get();

        return Inertia::render('Store/Employees/Index', [
            'employees' => $employees,
        ]);
    }

    public function create()
    {
        return Inertia::render('Store/Employees/Create', [
            'roles' => ['RESP_LABO', 'EMPLOYE_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE'],
        ]);
    }

    public function store(StoreEmployeeRequest $request)
    {
        $storeAdmin = auth('store')->user();

        $employee = User::create([
            'store_id' => $storeAdmin->store_id,
            'entity_id' => $storeAdmin->store->entity_id,
            'nom' => $request->nom,
            'pin' => User::hashPin($request->pin),
            'role' => $request->role,
            'auth_type' => 'PIN',
            'active' => true,
        ]);

        return redirect()->route('store.employees.index')
            ->with('success', "Employé '{$employee->nom}' créé avec succès.");
    }

    public function edit(User $employee)
    {
        $storeAdmin = auth('store')->user();
        if ($employee->store_id !== $storeAdmin->store_id) {
            abort(403, 'Cet employé n\'appartient pas à votre store.');
        }

        return Inertia::render('Store/Employees/Edit', [
            'employee' => $employee,
            'roles' => ['RESP_LABO', 'EMPLOYE_LABO', 'RESP_BOUTIQUE', 'EMPLOYE_VENTE'],
        ]);
    }

    public function update(UpdateStoreEmployeeRequest $request, User $employee)
    {
        $storeAdmin = auth('store')->user();
        if ($employee->store_id !== $storeAdmin->store_id) {
            abort(403, 'Cet employé n\'appartient pas à votre store.');
        }

        $employee->update([
            'nom' => $request->nom,
            'role' => $request->role,
        ]);

        if ($request->filled('pin')) {
            $employee->update(['pin' => User::hashPin($request->pin)]);
        }

        return redirect()->route('store.employees.index')
            ->with('success', "Employé '{$employee->nom}' modifié avec succès.");
    }

    public function destroy(User $employee)
    {
        $storeAdmin = auth('store')->user();
        if ($employee->store_id !== $storeAdmin->store_id) {
            abort(403, 'Cet employé n\'appartient pas à votre store.');
        }

        $name = $employee->nom;
        $employee->delete();

        return redirect()->route('store.employees.index')
            ->with('success', "Employé '$name' supprimé avec succès.");
    }

    public function toggleActive(User $employee)
    {
        $storeAdmin = auth('store')->user();
        if ($employee->store_id !== $storeAdmin->store_id) {
            abort(403, 'Cet employé n\'appartient pas à votre store.');
        }

        $employee->update(['active' => !$employee->active]);
        $status = $employee->active ? 'activé' : 'désactivé';

        return redirect()->route('store.employees.index')
            ->with('success', "Employé '{$employee->nom}' {$status} avec succès.");
    }
}
