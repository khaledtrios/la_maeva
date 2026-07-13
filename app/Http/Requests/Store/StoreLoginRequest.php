<?php

namespace App\Http\Requests\Store;

use App\Enums\StoreStatus;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreLoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Tente d'authentifier la requête sur le guard "store".
     * Authentifie les Users transformés en Store Admin (role=ADMIN, auth_type=EMAIL_PASSWORD)
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Rechercher un User Store Admin par email
        $user = User::where('email', $this->input('email'))
            ->where('role', 'ADMIN')
            ->where('auth_type', 'EMAIL_PASSWORD')
            ->first();

        if (! $user || ! Hash::check($this->input('password'), $user->password)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Identifiants invalides.',
            ]);
        }

        if (! $user->active) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Votre compte a été désactivé. Contactez votre administrateur.',
            ]);
        }

        if (! $user->store || ! $user->store->isActive()) {
            RateLimiter::hit($this->throttleKey());

            $message = 'Accès non autorisé.';
            if ($user->store) {
                $message = match ($user->store->status) {
                    StoreStatus::Pending => "Votre boutique « {$user->store->name} » est en attente de validation par notre équipe.",
                    StoreStatus::Rejected => "Votre demande d'inscription a été refusée.",
                    StoreStatus::Suspended => 'Votre boutique a été suspendue. Contactez le support pour plus d\'informations.',
                    default => 'Accès non autorisé.',
                };
            }

            throw ValidationException::withMessages([
                'email' => $message,
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        Auth::guard('store')->login($user, $this->boolean('remember'));
    }

    /**
     * Ensure the login request is not rate limited.
     */
    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
