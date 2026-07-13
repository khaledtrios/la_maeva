/**
 * Types TypeScript pour les événements Pusher
 */

export interface CommandeUrgenteCreatedEvent {
  id: number;
  entity_id: number;
  entity: string;
  date: string;
  priorite: number;
  statut: string;
  lines: Array<{
    product_nom: string;
    quantite: number;
  }>;
  created_at: string;
  creator: string | null;
}

export interface CommandeUrgenteStatusUpdatedEvent {
  id: number;
  old_statut: string;
  new_statut: string;
  entity_id: number;
  command: {
    id: number;
    statut: string;
    priorite: number;
  };
}

export interface StockAlertTriggeredEvent {
  entity_id: number;
  alerts: Array<{
    product_id: number;
    nom: string;
    stock_disponible: number;
    commandes_urgentes: number;
    manque: number;
  }>;
  count: number;
}
