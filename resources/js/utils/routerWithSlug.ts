import { router as inertiaRouter } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

/**
 * Wrapper du router Inertia qui ajoute automatiquement le slug
 * Utilisation: const router = createRouterWithSlug()
 *              router.post('/admin/entities', data) → POST /{slug}/admin/entities
 */
export function createRouterWithSlug(slug: string | null | undefined) {
    const prefixUrl = (url: string) => {
        if (!slug) return url;
        // Si l'URL commence déjà par /, on l'ajoute après le slug
        const cleanUrl = typeof url === 'string' ? url : '';
        return `/${slug}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    };

    return {
        post: (url: string, data?: any, options?: any) =>
            inertiaRouter.post(prefixUrl(url), data, options),
        put: (url: string, data?: any, options?: any) =>
            inertiaRouter.put(prefixUrl(url), data, options),
        patch: (url: string, data?: any, options?: any) =>
            inertiaRouter.patch(prefixUrl(url), data, options),
        delete: (url: string, options?: any) =>
            inertiaRouter.delete(prefixUrl(url), options),
        get: (url: string, options?: any) =>
            inertiaRouter.get(prefixUrl(url), options),
        visit: (url: string, options?: any) =>
            inertiaRouter.visit(prefixUrl(url), options),
        // Passthrough pour les autres méthodes
        replace: inertiaRouter.replace,
        reload: inertiaRouter.reload,
        on: inertiaRouter.on,
    };
}

/**
 * Hook pour obtenir un router avec le slug automatiquement inclus
 */
export function useRouterWithSlug() {
    const { props } = usePage();
    const slug = (props as any).slug;
    return createRouterWithSlug(slug);
}
