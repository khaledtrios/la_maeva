import { useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { initPusher } from '@/lib/pusher-client';
import { useAuth } from './useAuth';

/**
 * Hook pour gérer les notifications temps réel via Pusher
 *
 * - Connecte automatiquement Pusher au montage
 * - S'abonne aux canaux selon le rôle de l'utilisateur
 * - Dispatch des événements DOM custom pour chaque type de notification
 * - Déconnexion propre au démontage
 */
export function useRealtime() {
  const { user } = useAuth();
  const pusherRef = useRef<any>(null);
  const channelsRef = useRef<any[]>([]);

  // Joue un son de notification (optionnel)
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        /* ignore si bloque */
      });
    } catch (e) {
      // silence
    }
  }, []);

  // Rechargement intelligent de la page
  const reloadCommandes = useCallback(() => {
    router.reload({
      only: ['commandesUrgentes', 'produitsEnAlerte'],
      preserveState: true,
      preserveScroll: true,
    });
  }, []);

  const reloadProductions = useCallback(() => {
    router.reload({
      only: ['produitsComplets', 'summary'],
      preserveState: true,
      preserveScroll: true,
    });
  }, []);

  // S'abonner aux commandes (pour les labos)
  const subscribeToCommandes = useCallback(() => {
    if (!user || !['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'].includes(user.role)) {
      return;
    }

    const pusher = pusherRef.current;
    if (!pusher) return;

    const channel = pusher.subscribe('private-commandes');

    channel.bind('commande.urgente.created', () => {
      console.log('[Realtime] Nouvelle commande urgente reçue');
      playNotificationSound();
      reloadCommandes();
    });

    channel.bind('commande.urgente.status.updated', () => {
      console.log('[Realtime] Statut de commande mis à jour');
      playNotificationSound();
      reloadCommandes();
    });

    channelsRef.current.push(channel);
  }, [user, playNotificationSound, reloadCommandes]);

  // S'abonner aux mises à jour de la boutique (pour les boutiques)
  const subscribeToBoutique = useCallback(
    (entityId: number) => {
      if (!user) return;

      const pusher = pusherRef.current;
      if (!pusher) return;

      const channelName = `private-boutique.${entityId}`;
      const channel = pusher.subscribe(channelName);

      channel.bind('commande.urgente.status.updated', () => {
        console.log('[Realtime] Commande mise à jour pour boutique');
        playNotificationSound();
        // Recharger la page Commandes Urgentes (boutique)
        router.reload({
          only: ['commandes'],
          preserveState: true,
          preserveScroll: true,
        });
      });

      channelsRef.current.push(channel);
    },
    [user, playNotificationSound]
  );

  // S'abonner aux alertes (pour toutes les entités)
  const subscribeToAlerts = useCallback(
    (entityId: number) => {
      const pusher = pusherRef.current;
      if (!pusher) return;

      const channelName = `private-alerts.${entityId}`;
      const channel = pusher.subscribe(channelName);

      channel.bind('alert.stock.triggered', () => {
        console.log('[Realtime] Alerte stock reçue');
        playNotificationSound();
        // Recharger les alertes du dashboard si présent
        router.reload({
          only: ['alerts'],
          preserveState: true,
          preserveScroll: true,
        });
      });

      channelsRef.current.push(channel);
    },
    [playNotificationSound]
  );

  // Déconnexion propre
  const disconnect = useCallback(() => {
    channelsRef.current.forEach((channel) => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(channel.name);
      }
    });
    channelsRef.current = [];
    pusherRef.current?.disconnect();
  }, []);

  // Effet principal : connexion et abonnements
  useEffect(() => {
    if (!user) return;

    const pusher = initPusher();
    if (!pusher) return;
    pusherRef.current = pusher;

    // Connexion immédiate
    pusher.connect();

    // S'abonner selon le rôle
    if (['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN'].includes(user.role)) {
      subscribeToCommandes();
    }

    // Les boutiques s'abonnent à leur propre canal boutique
    if (['RESP_BOUTIQUE', 'EMPLOYE_VENTE'].includes(user.role)) {
      subscribeToBoutique(user.entity_id);
    }

    // Alertes pour toutes les entités
    subscribeToAlerts(user.entity_id);

    return () => {
      disconnect();
    };
  }, [
    user,
    subscribeToCommandes,
    subscribeToBoutique,
    subscribeToAlerts,
    disconnect,
  ]);

  return {
    pusher: pusherRef.current,
    connect: () => pusherRef.current?.connect(),
    disconnect,
  };
}
