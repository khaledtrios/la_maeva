<?php

namespace App\Console\Commands;

use App\Models\SuperAdmin;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

#[Signature('super-admin:create {--name=} {--email=} {--password=}')]
#[Description("Provisionner un compte Super Admin (aucune inscription publique n'existe pour ce rôle)")]
class CreateSuperAdminCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->option('name') ?: text(
            label: 'Nom du Super Admin',
            required: true,
        );

        $email = $this->option('email') ?: text(
            label: 'Adresse email du Super Admin',
            required: true,
            validate: function (string $value) {
                if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return 'Veuillez saisir une adresse email valide.';
                }

                if (SuperAdmin::where('email', $value)->exists()) {
                    return 'Un Super Admin existe déjà avec cette adresse email.';
                }

                return null;
            },
        );

        $password = $this->option('password') ?: password(
            label: 'Mot de passe du Super Admin',
            required: true,
            validate: function (string $value) {
                $validator = Validator::make(
                    ['password' => $value],
                    ['password' => Password::min(8)],
                );

                return $validator->fails() ? $validator->errors()->first('password') : null;
            },
        );

        $superAdmin = SuperAdmin::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'active' => true,
        ]);

        $this->info("Super Admin créé avec succès : {$superAdmin->email}");

        return self::SUCCESS;
    }
}
