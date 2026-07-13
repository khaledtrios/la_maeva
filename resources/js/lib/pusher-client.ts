import Pusher from 'pusher-js';

/**
 * Lit le cookie XSRF-TOKEN que Laravel pose automatiquement.
 * Pusher-JS ne le lit pas seul (contrairement à Laravel Echo),
 * il faut donc l'injecter manuellement dans les headers d'auth.
 */
function getCsrfToken(): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

/**
 * Initialise le client Pusher avec les credentials depuis l'environnement Vite
 */
export function initPusher(): Pusher | null {
  const key = import.meta.env.VITE_PUSHER_APP_KEY;
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

  if (!key || !cluster) {
    console.warn('[Pusher] Credentials non configurés (VITE_PUSHER_APP_KEY ou VITE_PUSHER_APP_CLUSTER manquant)');
    return null;
  }

  // Activer les logs en développement seulement
  if (import.meta.env.DEV) {
    Pusher.logToConsole = true;
  }

  const pusher = new Pusher(key, {
    cluster,
    authEndpoint: '/broadcasting/auth',
    auth: {
      headers: {
        'X-XSRF-TOKEN': getCsrfToken(), // Requis par Laravel pour valider la session
      },
    },
    disableStats: true,
  });

  return pusher;
}
