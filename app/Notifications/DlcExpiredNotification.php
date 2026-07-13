<?php

namespace App\Notifications;

use App\Models\StockBalance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DlcExpiredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public StockBalance $lot;

    /**
     * Create a new notification instance.
     */
    public function __construct(StockBalance $lot)
    {
        $this->lot = $lot;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('🚨 ALERTE DLC — Lot expiré — ' . $this->lot->ingredient->nom)
            ->greeting('Bonjour ' . $notifiable->nom . ',')
            ->line('UN LOT EXPIRÉ a été détecté dans votre stock.')
            ->line('')
            ->line('**Ingrédient :** ' . $this->lot->ingredient->nom)
            ->line('**Quantité :** ' . $this->lot->quantite . ($this->lot->ingredient->unite ?? ''))
            ->line('**DLC :** ' . ($this->lot->dlc ? $this->lot->dlc->format('d/m/Y') : 'N/A'))
            ->line('**Lot :** ' . ($this->lot->lot_number ?? 'N/A'))
            ->line('**Entité :** ' . $this->lot->entity->nom)
            ->line('')
            ->line('⚠️ **Action requise :** Ce lot doit être retiré du stock immédiatement.')
            ->line('')
            ->action('Voir le stock', url('/inventory/lots'))
            ->line('Merci de votre attention.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
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
            'type' => 'expired',
        ];
    }
}
