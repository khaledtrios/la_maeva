<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle ReturnLine — Ligne détaillée d'un retour
 *
 * Chaque ligne représente un produit retourné depuis une
 * réception (ou une ligne d'expédition).
 */
class ReturnLine extends Model
{
    protected $fillable = [
        'return_id',
        'reception_line_id',
        'product_id',
        'quantite_attendue',
        'quantite_retournee',
        'dlc',
        'lot_reference',
        'cause',
        'notes',
    ];

    public $timestamps = true;

    protected function casts(): array
    {
        return [
            'dlc' => 'date',
        ];
    }

    /**
     * Relation : retour parent
     */
    public function return(): BelongsTo
    {
        return $this->belongsTo(ProductReturn::class, 'return_id');
    }

    /**
     * Relation : ligne de réception d'origine (optionnelle)
     */
    public function receptionLine(): BelongsTo
    {
        return $this->belongsTo(ReceptionLine::class);
    }

    /**
     * Relation : produit
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation : photos de cette ligne
     */
    public function photos(): HasMany
    {
        return $this->hasMany(ReturnPhoto::class, 'return_line_id');
    }

    /**
     * Libellé de la cause
     */
    public function getCauseLabelAttribute(): string
    {
        return match ($this->cause) {
            'DEFECTUEUX'     => 'Défectueux',
            'INVENDU_EXPIRE' => 'DLC expiré',
            default          => $this->cause ?? 'N/A',
        };
    }

    /**
     * Vérifie si la DLC est expirée
     */
    public function isDlcExpired(): bool
    {
        return $this->dlc && $this->dlc < now()->startOfDay();
    }

    /**
     * Badge DLC en HTML (rouge si expiré)
     */
    public function getDlcBadgeHtmlAttribute(): string
    {
        if (!$this->dlc) {
            return '<span class="text-gray-500">—</span>';
        }

        $expired = $this->isDlcExpired();
        $color = $expired ? 'text-red-600 font-bold' : 'text-green-600';
        $label = $expired ? 'Expirée' : 'Valide';

        return "<span class=\"{$color}\">{$this->dlc->format('d/m/Y')} ({$label})</span>";
    }
}
