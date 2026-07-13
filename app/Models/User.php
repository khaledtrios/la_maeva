<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'entity_id',
        'nom',
        'pin',
        'role',
        'active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'pin',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table users
     */
    public $timestamps = false;

    /**
     * Relation: l'utilisateur appartient à une entité (labo ou boulangerie)
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: les productions créées par cet utilisateur (via created_by)
     */
    public function productions(): HasMany
    {
        return $this->hasMany(Production::class, 'created_by');
    }

    /**
     * Relation: les températures HACCP saisies par cet utilisateur
     */
    public function haccpTemperatures(): HasMany
    {
        return $this->hasMany(HaccpTemperature::class, 'created_by');
    }

    /**
     * Relation: les contrôles réception créés par cet utilisateur
     */
    public function haccpControlesReception(): HasMany
    {
        return $this->hasMany(HaccpControleReception::class, 'created_by');
    }

    /**
     * Relation: les non-conformités créées par cet utilisateur
     */
    public function haccpNonConformites(): HasMany
    {
        return $this->hasMany(HaccpNonConformite::class, 'created_by');
    }

    /**
     * Relation: les expéditions créées par cet utilisateur
     */
    public function expeditions(): HasMany
    {
        return $this->hasMany(Expedition::class, 'created_by');
    }

    /**
     * Relation: les validations de nettoyage (HACCP)
     */
    public function haccpNettoyagesValides(): HasMany
    {
        return $this->hasMany(HaccpNettoyage::class, 'valide_par');
    }

    /**
     * Hash le PIN (SHA-256)
     */
    public static function hashPin(string $pin): string
    {
        return hash('sha256', $pin);
    }
}