<?php

namespace App\Enums;

enum StoreStatus: string
{
    case Pending = 'PENDING';
    case Active = 'ACTIVE';
    case Rejected = 'REJECTED';
    case Suspended = 'SUSPENDED';

    /**
     * Libellé français affiché côté interface.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Active => 'Active',
            self::Rejected => 'Refusée',
            self::Suspended => 'Suspendue',
        };
    }

    /**
     * Couleur associée au statut (utilisée par le frontend).
     *
     * Suspended utilise un ton neutre/foncé distinct du rouge de Rejected :
     * Rejected = jamais validée à l'inscription, Suspended = était active puis
     * désactivée par la plateforme (deux situations sémantiquement différentes).
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending => '#f59e0b',
            self::Active => '#16a34a',
            self::Rejected => '#dc2626',
            self::Suspended => '#6b7280',
        };
    }
}
