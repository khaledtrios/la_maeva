import { usePage } from '@inertiajs/react';

/**
 * Hook pour obtenir les URLs avec le slug automatiquement inclus
 * Utilisation: const { url } = useRouteWithSlug()
 *              url('/admin/entities') → /{slug}/admin/entities
 */
export function useRouteWithSlug() {
    const { props } = usePage();
    const slug = (props as any).slug;

    return {
        slug,
        url: (path: string) => {
            if (!slug) return path;
            return `/${slug}/${path.replace(/^\//, '')}`;
        },
    };
}

/**
 * Fonction standalone pour générer une URL avec le slug
 * Utilisation directe si vous n'avez pas accès au hook
 */
export function generateUrlWithSlug(slug: string | null | undefined, path: string): string {
    if (!slug) return path;
    return `/${slug}/${path.replace(/^\//, '')}`;
}
