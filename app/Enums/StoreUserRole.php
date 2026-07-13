<?php

namespace App\Enums;

/**
 * Rôle d'un compte utilisateur boutique (store_users).
 *
 * Une seule valeur pour l'instant : le Store Admin (propriétaire de la boutique).
 * Les rôles Manager/Employé seront ajoutés plus tard, une fois que les Store Admins
 * pourront créer leurs propres comptes employés.
 */
enum StoreUserRole: string
{
    case StoreAdmin = 'STORE_ADMIN';
}
