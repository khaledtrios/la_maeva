<?php

namespace App\Notifications;

use App\Models\StockBalance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DlcExpiringSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public StockBalance $lot;

    public function __construct(StockBalance $lot)
    {
        $this->lot = $lot;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $daysRemaining = $this->lot->dlc?->diffInDays(now());

        return (new MailMessage)
            ->subject('⚠️ ALERTE DLC — Lot bientôt expiré — ' . $this->lot->ingredient->nom)
            ->greeting('Bonjour ' . $notifiable->nom . ',')
            ->line('UN LOT SERA BIENTÔT EXPIRÉ. Action requise dans les jours à venir.')
            ->line('')
            ->line('**Ingrédient :** ' . $this->lot->ingredient->nom)
            ->line('**Quantité :** ' . $this->lot->quantite . ($this->lot->ingredient->unite ?? ''))
            ->line('**DLC :** ' . ($this->lot->dlc ? $this->lot->dlc->format('d/m/Y') : 'N/A') . " (dans {$daysRemaining} jours)")
            ->line('**Lot :** ' . ($this->lot->lot_number ?? 'N/A'))
            ->line('**Entité :** ' . $this->lot->entity->nom)
            ->line('')
            ->line('Veuillez prendre les mesures nécessaires pour utiliser ce lot en priorité.')
            ->line('')
            ->action('Voir le stock', url('/inventory/lots'))
            ->line('Merci de votre vigilance.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'lot_id' => $this->lot->getKey(),
            'ingredient_id' => $this->lot->ingredient_id,
            'ingredient_nom' => $this->lot->ingredient->nom,
            'entity_id' => $this->lot->entity_id,
            'quantite' => $this->lot->quantite,
            'dlc' => $this->lot->dlc?->format('Y-m-d'),
            'lot_number' => $this->lot->lot_number,
            'type' => 'expiring_soon',
            'days_remaining' => $this->lot->dlc?->diffInDays(now()),
        ];
    }
}
