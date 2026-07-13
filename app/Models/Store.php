<?php

namespace App\Models;

use App\Enums\StoreStatus;
use App\Enums\StoreValidationAction;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use App\Models\Entity;

class Store extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * Volontairement limité aux champs métier : status/status_changed_by/status_changed_at/
     * status_reason ne doivent JAMAIS être assignables en masse (ils ne changent que via
     * approve()/reject()/suspend()/reactivate()), pour empêcher une inscription malveillante
     * de s'auto-valider.
     */
    protected $fillable = [
        'name',
        'phone',
        'address',
        'city',
        'postal_code',
        'siret',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'status' => StoreStatus::class,
            'status_changed_at' => 'datetime',
        ];
    }

    /**
     * Relation: les comptes utilisateurs (propriétaire, futurs employés) de cette boutique
     */
    public function storeUsers(): HasMany
    {
        return $this->hasMany(StoreUser::class);
    }

    /**
     * Relation: l'historique des décisions de validation (approbation/refus/suspension/réactivation)
     */
    public function validationLogs(): HasMany
    {
        return $this->hasMany(StoreValidationLog::class);
    }

    /**
     * Relation: le Super Admin ayant pris la dernière décision sur le statut de cette boutique
     */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'status_changed_by');
    }

    /**
     * Relation: l'entité associée à ce store (pour l'accès au CRM)
     */
    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /**
     * La boutique est-elle en attente de validation ?
     */
    public function isPending(): bool
    {
        return $this->status === StoreStatus::Pending;
    }

    /**
     * La boutique est-elle active (validée) ?
     */
    public function isActive(): bool
    {
        return $this->status === StoreStatus::Active;
    }

    /**
     * La boutique a-t-elle été refusée ?
     */
    public function isRejected(): bool
    {
        return $this->status === StoreStatus::Rejected;
    }

    /**
     * La boutique est-elle suspendue ?
     */
    public function isSuspended(): bool
    {
        return $this->status === StoreStatus::Suspended;
    }

    /**
     * Valide la boutique : passe le statut à ACTIVE et journalise la décision.
     */
    public function approve(SuperAdmin $admin): void
    {
        DB::transaction(function () use ($admin) {
            // forceFill() est nécessaire ici : status/status_changed_by/status_changed_at/
            // status_reason sont volontairement exclus de $fillable (cf. commentaire ci-dessus)
            // pour bloquer toute mass-assignment externe. update() aurait silencieusement
            // ignoré ces champs.
            $this->forceFill([
                'status' => StoreStatus::Active,
                'status_changed_by' => $admin->id,
                'status_changed_at' => now(),
                'status_reason' => null,
            ])->save();

            $this->validationLogs()->create([
                'action' => StoreValidationAction::Approved,
                'performed_by' => $admin->id,
                'reason' => null,
            ]);
        });
    }

    /**
     * Refuse la boutique : passe le statut à REJECTED et journalise la décision.
     */
    public function reject(SuperAdmin $admin, ?string $reason): void
    {
        DB::transaction(function () use ($admin, $reason) {
            // forceFill() est nécessaire ici pour la même raison que dans approve() ci-dessus.
            $this->forceFill([
                'status' => StoreStatus::Rejected,
                'status_changed_by' => $admin->id,
                'status_changed_at' => now(),
                'status_reason' => $reason,
            ])->save();

            $this->validationLogs()->create([
                'action' => StoreValidationAction::Rejected,
                'performed_by' => $admin->id,
                'reason' => $reason,
            ]);
        });
    }

    /**
     * Suspend la boutique : passe le statut à SUSPENDED et journalise la décision.
     */
    public function suspend(SuperAdmin $admin, ?string $reason): void
    {
        DB::transaction(function () use ($admin, $reason) {
            $this->forceFill([
                'status' => StoreStatus::Suspended,
                'status_changed_by' => $admin->id,
                'status_changed_at' => now(),
                'status_reason' => $reason,
            ])->save();

            $this->validationLogs()->create([
                'action' => StoreValidationAction::Suspended,
                'performed_by' => $admin->id,
                'reason' => $reason,
            ]);
        });
    }

    /**
     * Réactive une boutique suspendue : repasse le statut à ACTIVE et journalise la décision.
     */
    public function reactivate(SuperAdmin $admin): void
    {
        DB::transaction(function () use ($admin) {
            $this->forceFill([
                'status' => StoreStatus::Active,
                'status_changed_by' => $admin->id,
                'status_changed_at' => now(),
                'status_reason' => null,
            ])->save();

            $this->validationLogs()->create([
                'action' => StoreValidationAction::Reactivated,
                'performed_by' => $admin->id,
                'reason' => null,
            ]);
        });
    }
}
