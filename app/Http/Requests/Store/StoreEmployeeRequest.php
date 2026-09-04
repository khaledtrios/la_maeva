<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('store')->check();
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'role' => ['required', 'in:RESP_LABO,EMPLOYE_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^\d{4}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'employé est requis.',
            'role.required' => 'Le rôle est requis.',
            'role.in' => 'Le rôle sélectionné est invalide.',
            'pin.required' => 'Le PIN est requis.',
            'pin.size' => 'Le PIN doit être composé de 4 chiffres.',
            'pin.regex' => 'Le PIN doit être composé de 4 chiffres.',
        ];
    }
}
