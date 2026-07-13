<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Jobs\CheckDlcAlerts;
use App\Jobs\FactureAutoGenerator;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Vérification quotidienne des alertes DLC à minuit
        $schedule->job(new CheckDlcAlerts())->dailyAt('00:00');

        // Génération automatique des factures le 1er du mois à 02:00
        $schedule->job(new FactureAutoGenerator())->monthlyOn(1, '02:00');

        // Alternative pour tests : tous les jours à 02:00
        // $schedule->job(new FactureAutoGenerator())->dailyAt('02:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        // Pas de commands custom pour l'instant
        // $this->load(__DIR__.'/Commands');

        // require base_path('routes/console.php');
    }
}
