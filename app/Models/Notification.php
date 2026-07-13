<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle Notification — Notifications internes de l'application
 *
 * Utilisé pour notifier les utilisateurs d'événements métier,
 * comme la création d'une commande urgente par une boutique.
 */
class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'titre',
        'message',
        'lu',
    ];

    protected function casts(): array
    {
        return [
            'lu' => 'boolean',
        ];
    }

    public $timestamps = true;

    /**
     * Relation : utilisateur destinataire
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope : notifications non lues
     */
    public function scopeUnread($query)
    {
        return $query->where('lu', false);
    }

    /**
     * Marquer comme lue
     */
    public function markAsRead(): void
    {
        $this->update(['lu' => true]);
    }

    /**
     * Marquer comme non lue
     */
    public function markAsUnread(): void
    {
        $this->update(['lu' => false]);
    }
}
