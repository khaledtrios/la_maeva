interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'blue'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-indigo-100 text-indigo-800',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; style: string }> = {
    BROUILLON: { label: 'Brouillon', style: 'default' },
    ENVOYEE: { label: 'Envoyée', style: 'warning' },
    RECUE: { label: 'Reçue', style: 'success' },
    EN_ATTENTE: { label: 'En attente', style: 'warning' },
    CONFIRMEE: { label: 'Confirmée', style: 'success' },
    EN_COURS: { label: 'En cours', style: 'info' },
    VALIDE: { label: 'Validé', style: 'success' },
    OUVERTE: { label: 'Ouverte', style: 'danger' },
    RESOLUE: { label: 'Résolue', style: 'success' },
  }

  const config = variants[status] || { label: status, style: 'default' }

  return <Badge variant={config.style as any}>{config.label}</Badge>
}
