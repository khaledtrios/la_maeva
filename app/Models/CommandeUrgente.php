<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle CommandeUrgente — Réassort jour même (Commandes urgentes)
 *
 * Une boutique peut créer une commande urgente pour demander
 * un réapprovisionnement immédiat au labo.
 *
 * Statuts possibles :
 * - ENVOYEE        : commande créée par la boutique, envoyée au labo
 * - PRISE_EN_CHARGE: un membre du labo a pris la commande en charge
 * - EN_PREPARATION : la commande est en préparation (production/conditionnement)
 * - EXPEDIEE       : la commande a été expédiée vers la boutique
 */
class CommandeUrgente extends Model
{
    protected $table = 'commandes_urgentes';

    public const STATUT_ENVOYEE = 'ENVOYEE';
    public const STATUT_PRISE_EN_CHARGE = 'PRISE_EN_CHARGE';
    public const STATUT_EXPEDIEE = 'EXPEDIEE';

    public const STATUT_LABELS = [
        self::STATUT_ENVOYEE        => 'En attente',
        self::STATUT_PRISE_EN_CHARGE => 'Prise en charge',
        self::STATUT_EXPEDIEE       => 'Expédiée',
    ];

    protected $fillable = [
        'entity_id',
        'date',
        'statut',
        'priorite',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'priorite' => 'integer',
        ];
    }

    /**
     * Relation : boutique qui a créé la commande
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * Relation : créateur (user boutique)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation : lignes de commande
     */
    public function lines(): HasMany
    {
        return $this->hasMany(CommandeUrgenteLine::class);
    }

    /**
     * Libellé du statut
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->statut) {
            self::STATUT_ENVOYEE        => 'En attente',
            self::STATUT_PRISE_EN_CHARGE => 'Prise en charge',
            self::STATUT_EXPEDIEE       => 'Expédiée',
            default                     => $this->statut,
        };
    }

    /**
     * Classe CSS pour badge statut
     */
    public function getStatusClassAttribute(): string
    {
        return match ($this->statut) {
            self::STATUT_ENVOYEE        => 'bg-blue-100 text-blue-800',
            self::STATUT_PRISE_EN_CHARGE => 'bg-yellow-100 text-yellow-800',
            self::STATUT_EXPEDIEE       => 'bg-green-100 text-green-800',
            default                     => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Scope : commandes pour une entité (boutique ou labo selon filtre)
     */
    public function scopeForEntity($query, int $entityId, bool $isLabo = false)
    {
        if ($isLabo) {
            // Le labo voit toutes les commandes des boutiques
            return $query->where('entity_id', '!=', $entityId);
        }
        // La boutique ne voit que ses propres commandes
        return $query->where('entity_id', $entityId);
    }
}
