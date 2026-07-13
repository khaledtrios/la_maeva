<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRejectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Le middleware de route (auth:super_admin) restreint déjà l'accès.
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
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
