<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle ProductReturn — Gestion des retours produits
 *
 * Un retour est créé par une boutique (entity_id) pour des produits
 * reçus d'un labo et déclarés défectueux ou expirés.
 *
 * Statuts possibles :
 * - BROUILLON       : brouillon boutique (non envoyé)
 * - ENVOYEE         : envoyé au labo, en attente de traitement
 * - RECEUE_PAR_LABO : confirmé reçu par le labo
 * - TRAITEE         : traité (action effectuée)
 * - CLOTUREE        : clôturé (archive)
 * - REJETEE         : refusé par le labo
 */
class ProductReturn extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 5/Logistique) : cloisonnement automatique.
     * Table a DEUX entites (entity_id = boutique emettrice, labo_entity_id =
     * LABO destinataire) : store_id derive de entity_id (proprietaire du
     * document), etabli et verifie sans ambiguite en Phase 3 (0 ligne
     * inter-store). Plusieurs methodes du controleur (show/update/send/cancel/
     * confirm/reject/process) utilisent le route-model-binding avec des
     * controles manuels varies (created_by ou entity_id/labo_entity_id) : le
     * scope protege desormais aussi le binding lui-meme, uniformement.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $fillable = [
        'reference',
        'reception_id',
        'expedition_line_id',
        'entity_id',           // boutique créatrice
        'labo_entity_id',      // labo destinataire
        'cause',
        'type',                // RECEPTION | FIN_COMMERCE
        'origine',             // auto | manuel | auto+manuel
        'bl_number',
        'bl_fifo',
        'dlc_display',
        'product_id',
        'quantite_attendue',
        'quantite_retournee',
        'notes',
        'status',
        'labo_confirmed',
        'confirmed_at',
        'received_by',
        'treatment_action',
        'treatment_notes',
        'processed_by',
        'processed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'dlc_display'        => 'date',
            'confirmed_at'       => 'datetime',
            'processed_at'       => 'datetime',
            'labo_confirmed'     => 'boolean',
            'quantite_attendue'  => 'integer',
            'quantite_retournee' => 'integer',
        ];
    }

    // ============================================
    // GÉNÉRATION DE RÉFÉRENCE UNIQUE
    // ============================================

    /**
     * Génère une référence unique : RET-2026-0001
     */
    public static function generateReference(): string
    {
        $year = now()->year;
        $last = static::whereYear('created_at', $year)->max('reference');
        $num  = 1;
        if ($last && preg_match('/RET-\d{4}-(\d+)/', $last, $m)) {
            $num = (int) $m[1] + 1;
        }
        return sprintf('RET-%d-%04d', $year, $num);
    }

    /**
     * Relation : réception source (optionnelle)
     */
    public function reception(): BelongsTo
    {
        return $this->belongsTo(Reception::class);
    }

    /**
     * Relation : ligne d'expédition d'origine (obligatoire pour traçabilité)
     */
    public function expeditionLine(): BelongsTo
    {
        return $this->belongsTo(ExpeditionLine::class);
    }

    /**
     * Relation : boutique qui a créé le retour
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation : labo destinataire
     */
    public function laboEntity(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'labo_entity_id');
    }

    /**
     * Relation : créateur (user boutique)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation : receveur (user labo)
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Relation : processeur (user labo)
     */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Relation : lignes de retour
     */
    public function lines(): HasMany
    {
        return $this->hasMany(ReturnLine::class, "return_id");
    }

    /**
     * Relation : photos du retour
     */
    public function photos(): HasMany
    {
        return $this->hasMany(ReturnPhoto::class, 'return_id');
    }

    /**
     * Relation : produit
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Scope : retours pour une entité (boutique ou labo selon role)
     */
    public function scopeForEntity($query, int $entityId, string $entityType = 'boutique')
    {
        if ($entityType === 'boutique') {
            return $query->where('entity_id', $entityId);
        }
        return $query->where('labo_entity_id', $entityId);
    }

    /**
     * Vérifie si le retour peut être confirmé par le labo
     */
    public function canBeConfirmed(): bool
    {
        return in_array($this->status, ['ENVOYEE']);
    }

    /**
     * Vérifie si le retour peut être traité (doit être RECEUE_PAR_LABO)
     */
    public function canBeProcessed(): bool
    {
        return $this->status === 'RECEUE_PAR_LABO';
    }

    /**
     * Vérifie si le retour peut être annulé (uniquement BROUILLON)
     */
    public function canBeCancelled(): bool
    {
        return $this->status === 'BROUILLON';
    }

    /**
     * Libellé du statut
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'BROUILLON'         => 'Brouillon',
            'ENVOYEE'           => 'Envoyé au labo',
            'RECEUE_PAR_LABO'   => 'Reçu par labo',
            'TRAITEE'           => 'Traitée',
            'CLOTUREE'          => 'Clôturée',
            'REJETEE'           => 'Rejetée',
            default             => $this->status,
        };
    }

    /**
     * Classe CSS pour badge statut
     */
    public function getStatusClassAttribute(): string
    {
        return match ($this->status) {
            'BROUILLON'       => 'bg-gray-100 text-gray-800',
            'ENVOYEE'         => 'bg-blue-100 text-blue-800',
            'RECEUE_PAR_LABO' => 'bg-yellow-100 text-yellow-800',
            'TRAITEE'         => 'bg-green-100 text-green-800',
            'CLOTUREE'        => 'bg-emerald-100 text-emerald-800',
            'REJETEE'         => 'bg-red-100 text-red-800',
            default           => 'bg-gray-100 text-gray-800',
        };
    }

    // ============================================
    // HELPERS TYPE & ORIGINE
    // ============================================

    /**
     * Libellé du type de retour
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type ?? 'RECEPTION') {
            'RECEPTION'    => 'Retour Réception',
            'FIN_COMMERCE' => 'Retour Fin de commerce (19h)',
            default        => $this->type ?? '—',
        };
    }

    /**
     * Classe CSS pour badge type
     */
    public function getTypeClassAttribute(): string
    {
        return match ($this->type ?? 'RECEPTION') {
            'RECEPTION'    => 'bg-blue-100 text-blue-800',
            'FIN_COMMERCE' => 'bg-orange-100 text-orange-800',
            default        => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Libellé de la cause
     */
    public function getCauseLabelAttribute(): string
    {
        return match ($this->cause) {
            'DEFECTUEUX'     => 'Produit défectueux',
            'INVENDU_EXPIRE' => 'Invendu (DLC expirée)',
            default          => $this->cause,
        };
    }

    /**
     * Classe CSS pour badge cause
     */
    public function getCauseClassAttribute(): string
    {
        return match ($this->cause) {
            'DEFECTUEUX'     => 'bg-red-100 text-red-800',
            'INVENDU_EXPIRE' => 'bg-orange-100 text-orange-800',
            default          => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Libellé de l'action de traitement
     */
    public function getTreatmentActionLabelAttribute(): ?string
    {
        if (!$this->treatment_action) {
            return null;
        }

        return match ($this->treatment_action) {
            'brule'         => '🔥 Brûlé',
            'jete'          => '🗑️ Jeté',
            'recyclage'     => '♻️ Recyclé',
            'retour_stock'  => '🔄 Retour en stock',
            'autre'         => '✏️ Autre',
            default         => $this->treatment_action,
        };
    }
}
