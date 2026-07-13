<?php

namespace App\Models;

use App\Enums\StoreValidationAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreValidationLog extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'store_id',
        'action',
        'performed_by',
        'reason',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'action' => StoreValidationAction::class,
        ];
    }

    /**
     * Relation: la boutique concernée par cette décision
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Relation: le Super Admin ayant pris la décision
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'performed_by');
    }
}
