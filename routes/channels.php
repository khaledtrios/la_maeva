<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Canal pour les labos : reçoivent toutes les commandes des boutiques
Broadcast::channel('commandes', function ($user) {
    return in_array($user->role, ['RESP_LABO', 'EMPLOYE_LABO', 'ADMIN']);
});

// Canal pour chaque boutique : reçoit les mises à jour de ses propres commandes
Broadcast::channel('boutique.{entityId}', function ($user, $entityId) {
    return $user->entity_id == $entityId && in_array($user->role, ['RESP_BOUTIQUE', 'EMPLOYE_VENTE', 'ADMIN']);
});

// Canal pour les alertes (stock, etc.) par entité
Broadcast::channel('alerts.{entityId}', function ($user, $entityId) {
    // La boutique reçoit ses propres alertes, le labo peut écouter toutes les alertes
    return $user->entity_id == $entityId || in_array($user->role, ['RESP_LABO', 'ADMIN']);
});
