<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PHASE 3.5 — CORRECTION DU BLOQUEUR C2 : authentification de l'API caisse.
 *
 * `POST /api/sync-caisse` et `GET /api/sync-caisse/getetab` n'avaient AUCUN
 * middleware d'authentification, et `syncDataVente` acceptait un `entity_id`
 * arbitraire depuis le corps de la requête. N'importe qui atteignant le réseau
 * pouvait donc injecter des ventes et modifier les stocks de n'importe quelle
 * entité de n'importe quel store.
 *
 * Chaque store reçoit ici un jeton d'API propre, que sa caisse présente dans
 * l'en-tête `X-Caisse-Token`. Le jeton identifie le store, ce qui permet de
 * contraindre `entity_id` à ses seules entités.
 *
 * Choix d'implémentation : une colonne dédiée plutôt que Sanctum, car la table
 * `personal_access_tokens` n'existe pas dans ce projet et l'intégration caisse
 * est une communication machine-à-machine simple (un secret par boutique).
 *
 * ADDITIF ET RÉVERSIBLE : colonne nullable, aucune donnée existante modifiée.
 * Les tokens sont générés à la demande via `php artisan store:api-token`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('stores') || Schema::hasColumn('stores', 'api_token')) {
            return;
        }

        Schema::table('stores', function (Blueprint $table) {
            $table->string('api_token', 80)->nullable()->unique()->after('slug');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('stores') || !Schema::hasColumn('stores', 'api_token')) {
            return;
        }

        Schema::table('stores', function (Blueprint $table) {
            $table->dropUnique(['api_token']);
            $table->dropColumn('api_token');
        });
    }
};
