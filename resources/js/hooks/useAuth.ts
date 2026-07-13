import { usePage } from '@inertiajs/react'
import type { AuthUser, Role } from '@/types'

export function useAuth() {
  const { auth } = usePage().props as any
  const user = auth?.user as AuthUser | null

  const hasRole = (...roles: Role[]): boolean => roles.includes(user?.role ?? ('' as Role))

  const isLabo = (): boolean => hasRole('ADMIN', 'RESP_LABO', 'EMPLOYE_LABO')
  const isBoutique = (): boolean => hasRole('RESP_BOUTIQUE', 'EMPLOYE_VENTE')

  return { user, hasRole, isLabo, isBoutique }
}
