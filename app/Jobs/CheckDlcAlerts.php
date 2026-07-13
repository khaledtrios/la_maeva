<?php

namespace App\Jobs;

use App\Models\StockBalance;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;
use App\Notifications\DlcExpiredNotification;
use App\Notifications\DlcExpiringSoonNotification;

class CheckDlcAlerts implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre de jours avant DLC pour alerte "bientôt périmé".
     */
    public int $daysThreshold = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(int $daysThreshold = 3)
    {
        $this->daysThreshold = $daysThreshold;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $today = now()->toDateString();
        $seuil = now()->addDays($this->daysThreshold)->toDateString();

        // ── Lots expirés (CRITIQUE) ──
        $expires = StockBalance::with(['ingredient', 'entity'])
            ->whereNotNull('dlc')
            ->where('dlc', '<=', $today)
            ->where('quantite', '>', 0)
            ->get();

        foreach ($expires as $lot) {
            // Notifier tous les ADMIN et RESP_LABO de l'entité concernée
            $recipients = User::whereIn('role', ['ADMIN', 'RESP_LABO'])
                ->where(function ($q) use ($lot) {
                    // ADMIN voient tout, RESP_LABO voient leur entité
                    $q->where('role', 'ADMIN')
                      ->orWhere('entity_id', $lot->entity_id);
                })
                ->get();

            Notification::send($recipients, new DlcExpiredNotification($lot));
        }

        // ── Lots bientôt expirés (WARNING) ──
        $upcoming = StockBalance::with(['ingredient', 'entity'])
            ->whereNotNull('dlc')
            ->where('dlc', '>', $today)
            ->where('dlc', '<=', $seuil)
            ->where('quantite', '>', 0)
            ->get();

        foreach ($upcoming as $lot) {
            $recipients = User::whereIn('role', ['ADMIN', 'RESP_LABO'])
                ->where(function ($q) use ($lot) {
                    $q->where('role', 'ADMIN')
                      ->orWhere('entity_id', $lot->entity_id);
                })
                ->get();

            Notification::send($recipients, new DlcExpiringSoonNotification($lot));
        }

        // Logging pour audit
        logger()->info('CheckDlcAlerts job completed', [
            'expired_count' => $expires->count(),
            'expiring_soon_count' => $upcoming->count(),
            'run_at' => now()->toDateTimeString(),
        ]);
    }
}
