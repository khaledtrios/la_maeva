<?php

namespace App\Events;

use App\Models\CommandeUrgente;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommandeUrgenteCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public CommandeUrgente $commande;

    /**
     * Create a new event instance.
     */
    public function __construct(CommandeUrgente $commande)
    {
        $this->commande = $commande->load(['entity', 'creator', 'lines.product']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('commandes'),
        ];
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
            'entity_id' => $this->commande->entity_id,
            'entity' => $this->commande->entity?->nom,
            'date' => $this->commande->date?->format('Y-m-d'),
            'priorite' => $this->commande->priorite,
            'statut' => $this->commande->statut,
            'lines' => $this->commande->lines->map(function ($line) {
                return [
                    'product_nom' => $line->product?->nom,
                    'quantite' => $line->quantite,
                ];
            })->toArray(),
            'created_at' => $this->commande->created_at?->toISOString(),
            'creator' => $this->commande->creator?->nom,
        ];
    }

    /**
     * Event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'commande.urgente.created';
    }
}
