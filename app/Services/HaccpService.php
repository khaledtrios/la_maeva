<?php

namespace App\Services;

use App\Models\HaccpControleReception;
use App\Models\HaccpNonConformite;

class HaccpService
{
    /**
     * Vérifier la conformité d'un contrôle de réception selon la catégorie
     *
     * FRAIS  ≤ 4.0°C
     * SURGELE ≤ -18.0°C
     * AMBIANT → toujours conforme
     */
    public static function checkConformiteReception(string $categorie, ?float $temperature): bool
    {
        return match ($categorie) {
            'FRAIS'    => $temperature !== null && $temperature <= 4.0,
            'SURGELE'  => $temperature !== null && $temperature <= -18.0,
            'AMBIANT'  => true,
            default    => false,
        };
    }

    /**
     * Créer une non-conformité automatiquement à partir d'un contrôle non conforme
     */
    public static function createNonConformiteFromReception(HaccpControleReception $controle): void
    {
        $bl = $controle->bl_number ? " ({$controle->bl_number})" : '';

        HaccpNonConformite::create([
            'entity_id'   => $controle->entity_id,
            'type'        => 'TEMPERATURE',
            'description' => "Livraison {$controle->fournisseur}{$bl} — {$controle->categorie} à {$controle->temperature}°C",
            'action'      => null,
            'statut'      => 'OUVERTE',
            'date'        => $controle->date,
            'created_by'  => $controle->created_by,
        ]);
    }
}
