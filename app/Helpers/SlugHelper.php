<?php

namespace App\Helpers;

class SlugHelper
{
    /**
     * Retourne le slug du store actuel depuis la session
     */
    public static function getStoreSlug(): ?string
    {
        return request()->session()->get('store_slug');
    }

    /**
     * Génère une URL avec le slug actuel
     */
    public static function url($path = ''): string
    {
        $slug = self::getStoreSlug();
        if (!$slug) {
            return $path;
        }
        return "/{$slug}/" . ltrim($path, '/');
    }

    /**
     * Génère une route nommée avec le slug actuel automatiquement ajouté
     * Exemple : SlugHelper::route('products.index') → /{slug}/products
     */
    public static function route($name, $parameters = [], $absolute = true)
    {
        $slug = self::getStoreSlug();

        // Ajouter le slug aux paramètres si ce n'est pas déjà dedans
        if ($slug && is_array($parameters)) {
            $parameters['slug'] = $slug;
        } elseif ($slug && !is_array($parameters)) {
            $parameters = ['slug' => $slug];
        }

        return route($name, $parameters, $absolute);
    }

    /**
     * Génère une redirection avec le slug actuel
     */
    public static function redirect($path = ''): \Illuminate\Http\RedirectResponse
    {
        return redirect(self::url($path));
    }
}
