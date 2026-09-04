import { createInertiaApp, router } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import AppLayout from '@/Components/Layout/AppLayout'

const NO_LAYOUT_PAGES = [
  'Auth/Login',
  'Store/Register',
  'Store/Login',
  'Store/Dashboard',
  'SuperAdmin/Login',
  'SuperAdmin/Stores/Index',
]

// Préfixes de premier segment qui ne sont PAS des slugs de store
const RESERVED_SEGMENTS = ['store', 'super-admin', 'register', 'login']

/**
 * Filet de sécurité global : toutes les routes de l'espace Employé sont
 * préfixées par /{slug}. Or de nombreux helpers de route et <Link> génèrent
 * des URLs sans slug (ex: /returns, /production). Cet intercepteur récupère le
 * slug courant depuis l'URL du navigateur et le rajoute automatiquement à
 * toute visite Inertia qui en manque, pour que le slug reste TOUJOURS présent
 * et que la bonne page soit rendue.
 */
function currentStoreSlug(): string | null {
  const segs = window.location.pathname.split('/').filter(Boolean)
  if (segs.length === 0) return null
  return RESERVED_SEGMENTS.includes(segs[0]) ? null : segs[0]
}

/**
 * Symétrique du filet ci-dessus pour l'espace Store Admin (guard "store") :
 * toutes ses routes vivent sous /store, mais les pages CRM sont partagées avec
 * l'espace Employé et génèrent des URLs d'action SANS préfixe (ex: /sales,
 * /nonconformites, /returns/create). Sans réécriture, ces requêtes partent vers
 * le guard "web" — l'utilisateur boutique n'y est pas authentifié et l'action
 * échoue silencieusement.
 */
function inStoreArea(): boolean {
  return window.location.pathname.split('/').filter(Boolean)[0] === 'store'
}

router.on('before', (event) => {
  const visit = (event as any).detail?.visit
  if (!visit || !visit.url) return

  const url: URL = visit.url
  // Ne toucher qu'aux URLs same-origin
  if (url.origin !== window.location.origin) return

  const path = url.pathname

  // Les zones Store Admin / Super Admin ont déjà leur propre préfixe
  if (path.startsWith('/store') || path.startsWith('/super-admin') || path.startsWith('/register')) {
    return
  }

  // Espace Store Admin : rajouter /store aux URLs qui en manquent
  if (inStoreArea()) {
    url.pathname = `/store${path === '/' ? '' : path}`
    return
  }

  const slug = currentStoreSlug()
  if (!slug) return

  // Déjà préfixé par le slug -> ne rien faire
  if (path === `/${slug}` || path.startsWith(`/${slug}/`)) return

  // Préfixer le slug
  url.pathname = `/${slug}${path === '/' ? '' : path}`
})

createInertiaApp({
  resolve: async (name) => {
    const page = await resolvePageComponent(
      `./Pages/${name}.tsx`,
      import.meta.glob('./Pages/**/*.tsx'),
    )

    // Apply default layout except for excluded pages
    const noLayout = NO_LAYOUT_PAGES.some((p) => name.includes(p))
    if (!noLayout && !(page as any).default.layout) {
      ;(page as any).default.layout = (pageNode: React.ReactNode) => (
        <AppLayout>{pageNode}</AppLayout>
      )
    }

    return page as any
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
