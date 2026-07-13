<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Compte opérateur de la plateforme (Super Admin).
 *
 * Entièrement indépendant de la table interne "users" (PIN, role=ADMIN) et de la
 * table "store_users" (propriétaires de boutique) : son propre guard ("super_admin"),
 * sa propre table, sa propre authentification email + mot de passe. Aucune inscription
 * publique n'existe pour ce rôle — voir App\Console\Commands\CreateSuperAdminCommand.
 */
class SuperAdmin extends Authenticatable
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'active' => 'boolean',
        ];
    }
}
