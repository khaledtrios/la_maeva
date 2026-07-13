<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FactureSetting extends Model
{
    // Pas de timestamps
    public $timestamps = false;

    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * Récupère une valeur de setting
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Définit une valeur de setting
     */
    public static function set(string $key, string $value, string $description = ''): void
    {
        self::updateOrCreate(['key' => $key], [
            'value' => $value,
            'description' => $description,
        ]);
    }
}
