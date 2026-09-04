<?php

namespace App\Models;

use App\Enums\StoreUserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class StoreUser extends Authenticatable
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'store_id',
        'name',
        'email',
        'password',
        'role',
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
            // NB: 'role' est volontairement laissé en string (valeur 'STORE_ADMIN')
            // et non casté en enum, pour rester cohérent avec User::role (string)
            // que tous les contrôleurs comparent via des strings (in_array, ===).
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Relation: la boutique à laquelle appartient ce compte
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Obtenir l'entity_id associé à ce Store Admin via la relation store
     */
    public function getEntityIdAttribute(): ?int
    {
        return $this->store?->entity_id;
    }
}
