<?php

namespace App\Events;

use App\Models\CommandeUrgente;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommandeUrgenteStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public CommandeUrgente $commande;
    public string $oldStatut;
    public string $newStatut;

    /**
     * Create a new event instance.
     */
    public function __construct(CommandeUrgente $commande, string $oldStatut, string $newStatut)
    {
        $this->commande = $commande->load(['entity']);
        $this->oldStatut = $oldStatut;
        $this->newStatut = $newStatut;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('commandes'), // labos
        ];

        // Notifier aussi la boutique concernée
        if ($this->commande->entity_id) {
            $channels[] = new PrivateChannel('boutique.' . $this->commande->entity_id);
        }

        return $channels;
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->commande->id,
            'old_statut' => $this->oldStatut,
            'new_statut' => $this->newStatut,
            'entity_id' => $this->commande->entity_id,
            'command' => [
                'id' => $this->commande->id,
                'statut' => $this->commande->statut,
                'priorite' => $this->commande->priorite,
            ],
        ];
    }

    /**
     * Event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'commande.urgente.status.updated';
    }
}
