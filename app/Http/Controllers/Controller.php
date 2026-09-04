<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;

abstract class Controller
{
    /**
     * Get the current authenticated user (supports both auth:web and auth:store guards).
     * For Store Admin (auth:store), returns the StoreUser with store_id.
     * For regular employees (auth:web), returns the User with entity_id.
     */
    protected function getCurrentUser()
    {
        // Check auth:store first (Store Admin)
        if (Auth::guard('store')->check()) {
            return Auth::guard('store')->user();
        }

        // Fall back to auth:web (Employee)
        return Auth::guard('web')->user();
    }

    /**
     * Get the entity_id for the current user (supports both guards).
     * For Store Admin, retrieves entity_id from store relationship.
     * For Employee, returns entity_id directly.
     */
    protected function getCurrentEntityId(): ?int
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return null;
        }

        // Store Admin: get entity_id from store relationship
        if (Auth::guard('store')->check()) {
            return $user->store?->entity_id;
        }

        // Regular Employee: entity_id is on user directly
        return $user->entity_id ?? null;
    }

    /**
     * Check if current user is Store Admin
     */
    protected function isStoreAdmin(): bool
    {
        return Auth::guard('store')->check();
    }

    /**
     * Accès global à toutes les entités ?
     *
     * Cloisonnement multi-tenant : seul l'ADMIN interne (guard "web") peut agir
     * sur les données de n'importe quelle entité. Un Store Admin (guard "store")
     * n'a JAMAIS d'accès global — il reste soumis au contrôle d'appartenance sur
     * son entity_id, même si son rôle est un rôle d'administration.
     */
    protected function hasGlobalEntityAccess(): bool
    {
        if ($this->isStoreAdmin()) {
            return false;
        }

        return $this->getCurrentUser()?->role === 'ADMIN';
    }

    /**
     * Get the store_id for Store Admin, null for regular employees
     */
    protected function getCurrentStoreId(): ?int
    {
        if (Auth::guard('store')->check()) {
            return Auth::guard('store')->user()?->store_id;
        }

        return null;
    }
}
