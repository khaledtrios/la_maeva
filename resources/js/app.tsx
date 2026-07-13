import { createInertiaApp } from '@inertiajs/react'
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
