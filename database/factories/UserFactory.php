<?php

namespace Database\Factories;

use App\Models\Entity;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 *
 * PHASE 3.5 — factory remise en conformité (point M4 de l'audit).
 *
 * L'ancienne version était le squelette Laravel par défaut (`name`, `email`,
 * `password`, `remember_token`) alors que la table `users` de ce projet utilise
 * `nom`, `pin`, `role`, `entity_id` et `store_id` : elle produisait donc des
 * utilisateurs invalides, et surtout SANS store — un état « fail-open » qui
 * aurait faussé les tests d'isolation de la Phase 4.
 *
 * Garantie apportée : un utilisateur créé par cette factory a TOUJOURS une
 * entité et le store de cette entité, les deux cohérents entre eux.
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'nom' => fake()->name(),
            'pin' => User::hashPin(fake()->numerify('####')),
            'role' => 'EMPLOYE_LABO',
            'auth_type' => 'PIN',
            'active' => true,
            // entity_id / store_id : résolus dans configure() pour rester cohérents.
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            // Si l'appelant a fourni une entité, le store en découle.
            if ($user->entity_id) {
                $user->store_id ??= Entity::whereKey($user->entity_id)->value('store_id');

                return;
            }

            // Sinon on part du store fourni, ou on en crée un complet.
            $store = $user->store_id
                ? Store::find($user->store_id)
                : Store::factory()->active()->create();

            $entity = Entity::where('store_id', $store->id)->first()
                ?? tap(Entity::create([
                    'type' => 'LABO',
                    'nom' => 'Labo ' . $store->name,
                    'adresse' => $store->address ?? 'Adresse labo',
                ]), function (Entity $created) use ($store) {
                    // store_id est hors $fillable (protection anti-changement de
                    // tenant par assignation de masse) : affectation directe.
                    $created->store_id = $store->id;
                    $created->save();
                });

            $user->entity_id = $entity->id;
            $user->store_id = $store->id;
        });
    }

    /** Rôle explicite (ADMIN, RESP_LABO, EMPLOYE_LABO, RESP_BOUTIQUE, EMPLOYE_VENTE, DIRECTION). */
    public function role(string $role): static
    {
        return $this->state(fn () => ['role' => $role]);
    }

    /** PIN connu, pour tester une connexion. */
    public function withPin(string $pin): static
    {
        return $this->state(fn () => ['pin' => User::hashPin($pin)]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['active' => false]);
    }
}
