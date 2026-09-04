<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class VenteJour extends Model
{
    use BelongsToStore;

    /**
     * PHASE 4 — ÉTAPE 5 (groupe 6/Ventes) : cloisonnement automatique.
     * SaleController filtre deja par entity_id (defense en profondeur ici).
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope());
    }

    protected $table = 'ventes_jour';

    protected $fillable = [
        'entity_id',
        'date',
        'product_id',
        'qte_recue',
        'qte_reste',
        'qte_vendue',
        'dlc_produit',          // DLC du produit (Étape 1)
        'quantite_vendable_j1', // Invendus DLC valide → contribue suggestion J+1
        'quantite_perimee',     // Invendus DLC dépassée → déclenche retour Type B auto
    ];

    protected function casts(): array
    {
        return [
            'date'                 => 'date',
            'dlc_produit'          => 'date',
            'qte_recue'            => 'integer',
            'qte_reste'            => 'integer',
            'qte_vendue'           => 'integer',
            'quantite_vendable_j1' => 'integer',
            'quantite_perimee'     => 'integer',
        ];
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ============================================
    // HELPERS DLC (Étape 1)
    // ============================================

    /**
     * Vérifie si la DLC est dépassée à la date de la saisie.
     * DLC dépassée = dlc_produit <= date saisie
     */
    public function isDlcExpired(): bool
    {
        if (!$this->dlc_produit) {
            return false;
        }
        $ref = $this->date ?? now();
        return $this->dlc_produit->lte(Carbon::parse($ref));
    }

    /**
     * Hydrate quantite_vendable_j1 et quantite_perimee depuis qte_reste + dlc_produit.
     * Appeler avant save() dans le controller.
     */
    public function computeDlcSplit(): static
    {
        if ($this->isDlcExpired()) {
            $this->quantite_vendable_j1 = 0;
            $this->quantite_perimee     = $this->qte_reste ?? 0;
        } else {
            $this->quantite_vendable_j1 = $this->qte_reste ?? 0;
            $this->quantite_perimee     = 0;
        }
        return $this;
    }
}
