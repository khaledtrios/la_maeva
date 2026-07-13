import AppLayout from '@/Components/Layout/AppLayout'
import type { ReactNode } from 'react'

export function withLayout<P extends object>(Component: React.ComponentType<P>) {
  return function LayoutWrapper(props: P) {
    return (
      <AppLayout>
        <Component {...props} />
      </AppLayout>
    )
  }
}
