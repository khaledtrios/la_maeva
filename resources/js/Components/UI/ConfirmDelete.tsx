import { Modal } from './Modal'
import { useForm } from '@inertiajs/react'

interface ConfirmDeleteProps {
  open: boolean
  onClose: () => void
  url: string
  onSuccess?: () => void
}

export function ConfirmDelete({ open, onClose, url, onSuccess }: ConfirmDeleteProps) {
  const form = useForm({})

  const handleDelete = () => {
    form.delete(url, {
      onSuccess: () => {
        onClose()
        onSuccess?.()
      },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmer la suppression"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={form.processing}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {form.processing ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      }
    >
      <p>Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.</p>
    </Modal>
  )
}
