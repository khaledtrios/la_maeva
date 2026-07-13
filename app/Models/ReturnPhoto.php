<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle ReturnPhoto — Photo associée à un retour ou une ligne de retour
 *
 * Permet de joindre des images preuves (produits défectueux, DLC, etc.)
 */
class ReturnPhoto extends Model
{
    protected $fillable = [
        'return_id',
        'return_line_id',
        'photo_path',
        'uploaded_by',
    ];

    public $timestamps = true;

    /**
     * Relation : retour parent
     */
    public function return(): BelongsTo
    {
        return $this->belongsTo(ProductReturn::class, 'return_id');
    }

    /**
     * Relation : ligne de retour (optionnelle = photo globale)
     */
    public function returnLine(): BelongsTo
    {
        return $this->belongsTo(ReturnLine::class, 'return_line_id');
    }

    /**
     * Relation : utilisateur ayant uploadé
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * URL complète de la photo
     */
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->photo_path);
    }

    /**
     * Vérifie si la photo est liée à une ligne spécifique (vs globale)
     */
    public function isPerLine(): bool
    {
        return $this->return_line_id !== null;
    }
}
