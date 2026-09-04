<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Entity extends Model
{
    /**
     * PHASE 4 — ÉTAPE 5 (groupe 1/fondamentaux) : cloisonnement automatique par
     * store sur toutes les requêtes de lecture. Fail-closed (StoreScope) et
     * inopérant pour l'ADMIN interne / console (CurrentStore::id() = null).
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }
    // Rattachement automatique au store courant à la création (Phase 3.5).
    // `entities` est la SEULE table sans colonne permettant de déduire son store :
    // le rattachement vient donc uniquement du contexte (CurrentStore). C'est
    // volontaire — une entité créée hors contexte échoue désormais de façon
    // explicite (store_id NOT NULL depuis la vague 3a) plutôt que de produire une
    // entité orpheline. La relation store() définie plus bas prime sur celle du
    // trait, ce qui est le comportement PHP attendu.
    use BelongsToStore;

    // `store_id` volontairement ABSENT de $fillable : le rattachement d'une
    // entité à un store ne doit pas pouvoir être modifié par une assignation de
    // masse issue d'un formulaire (ce serait un changement de tenant). Il est
    // posé par le trait, explicitement, ou par la commande de backfill.
    protected $fillable = ['type', 'nom', 'adresse', 'logo'];

    /**
     * Indicates if the model should be timestamped.
     * pas de timestamps dans la table entities
     */
    public $timestamps = false;

    /**
     * Relation: le store propriétaire de cette entité (Phase 1 multi-tenant).
     *
     * Nullable pendant la transition : une entité sans store est un reste de
     * l'époque mono-organisation, à traiter par `tenancy:backfill-entities`.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

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
