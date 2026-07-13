<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Auth;

class AuthHelper
{
    /**
     * Retourne l'utilisateur authentifié (web ou store guard)
     */
    public static function user()
    {
        return Auth::user() ?? Auth::user('store');
    }

    /**
     * Retourne l'entity_id de l'utilisateur authentifié
     */
    public static function entityId()
    {
        $user = self::user();
        return $user?->entity_id;
    }
}
