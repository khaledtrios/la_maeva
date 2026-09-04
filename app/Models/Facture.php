<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 7/Factures, DERNIER modèle) : cloisonnement
     * automatique. Table à deux entités : entity_id = LABO émetteur (propriétaire
     * du store_id, via resolveStoreIdFrom() par défaut du trait), boulangerie_id =
     * destinataire. FactureController a déjà des contrôles manuels complets
     * (authorizeView() sur show/pdf/validate/pay/cancel/destroy, garde store()
     * pour le Store Admin) — cette activation est donc essentiellement de la
     * défense en profondeur, pas la fermeture d'une fuite réelle (contrairement
     * au groupe 6/CommandeUrgente). Effet de bord attendu : le route-model-binding
     * (Facture $facture) ne trouvera plus une facture d'un autre store => 404 au
     * lieu du 403 explicite d'authorizeView() sur pay/cancel/destroy/show, même
     * mécanisme que les groupes 2 et 4.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $fillable = [
        'numero',
        'entity_id',
        'boulangerie_id',
        'periode_type',
        'date_debut',
        'date_fin',
        'montant_total',
        'statut',
        'generation_auto',
        'generated_by',
        'validated_by',
        'paid_at',
        'paid_by',
        'notes',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'montant_total' => 'decimal:2',
        'generation_auto' => 'boolean',
        'paid_at' => 'datetime',
    ];

    /**
     * Relation: le labo émetteur
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation: la boulangerie destinataire
     */
    public function boulangerie(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'boulangerie_id');
    }

    /**
     * Relation: l'utilisateur qui a généré cette facture
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Relation: l'utilisateur qui a validé (émis) la facture
     */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Relation: l'utilisateur qui a enregistré le paiement
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    /**
     * Relation: les lignes de cette facture
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }
}
