<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Entity extends Model
{
    protected $fillable = ['type', 'nom', 'adresse', 'logo'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table entities
     */
    public $timestamps = false;

    /**
     * Relation: les utilisateurs rattachés à cette entité
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relation: les productions de cette entité
     */
    public function productions(): HasMany
    {
        return $this->hasMany(Production::class, 'entity_id');
    }

    /**
     * Relation: les expéditions ( LABO source ) de cette entité
     */
    public function expeditions(): HasMany
    {
        return $this->hasMany(Expedition::class, 'entity_id');
    }

    /**
     * Relation: les réceptions ( BOULANGERIE destinataire ) de cette entité
     */
    public function receptions(): HasMany
    {
        return $this->hasMany(Reception::class, 'entity_id');
    }

    /**
     * Relation: les factures émises par ce labo (émetteur)
     */
    public function facturesCommeEmetteur(): HasMany
    {
        return $this->hasMany(Facture::class, 'entity_id');
    }

    /**
     * Relation: les factures reçues par cette boulangerie (destinataire)
     */
    public function facturesCommeDestinataire(): HasMany
    {
        return $this->hasMany(Facture::class, 'boulangerie_id');
    }

    /**
     * URL publique du logo (si présent)
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) return null;
        return asset('storage/' . $this->logo);
    }
}
