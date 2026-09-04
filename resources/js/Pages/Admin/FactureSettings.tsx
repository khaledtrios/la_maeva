import { useState } from 'react'
import { router } from '@inertiajs/react'

export default function FactureSettings({
  auto_generation_enabled,
  description,
}: {
  auto_generation_enabled: boolean
  description?: string
}) {
  // Onglet Facturation réservé à l'Admin interne (guard web).
  const [enabled, setEnabled] = useState(auto_generation_enabled)

  const handleToggle = () => {
    const newState = !enabled
    setEnabled(newState)

    router.post('/admin/facture-settings/toggle-auto', { enabled: newState }, {
      onSuccess: () => {
        // L'état est déjà mis à jour localement
      },
      onError: (errors: any) => {
        alert('Erreur : ' + (errors.error || 'Échec de la modification'))
        setEnabled(enabled) // rollback
      }
    })
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Paramètres de facturation</h2>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Génération automatique des factures</h3>
              <p className="text-sm text-gray-600">
                {description ||
                  'Si activé, une facture mensuelle est générée automatiquement le 1er du mois pour chaque boulangerie, à partir des expéditions confirmées.'}
              </p>
            </div>

            <button
              onClick={handleToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t">
            <span className={`text-sm font-medium ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
              {enabled ? '✓ Activé' : '✗ Désactivé'}
            </span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded text-sm text-blue-800">
          <h4 className="font-semibold mb-2">Comment ça fonctionne ?</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Le 1er de chaque mois à 2h du matin, le système scanne toutes les expéditions livrées (statut RECUE) et réceptions confirmées du mois précédent.</li>
            <li>Une facture par boulangerie est générée en statut BROUILLON.</li>
            <li>Le labo (RESP_LABO ou ADMIN) doit valider manuellement chaque facture pour la passer en statut EMISE.</li>
            <li>La facture est alors visible par la boulangerie destinataire en lecture seule.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
