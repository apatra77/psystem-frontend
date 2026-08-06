import { useUiStore } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'

/**
 * Convenience over the global confirm dialog for the most common destructive case.
 *   const confirmDelete = useDeleteDialog()
 *   confirmDelete({ name: product.name, onConfirm: () => remove(product.id) })
 */
export function useDeleteDialog() {
  const askConfirm = useUiStore((s) => s.askConfirm)

  return ({ name, title = 'Delete', message, confirmLabel = 'Delete', onConfirm }) =>
    askConfirm({
      title,
      message: message ?? msg('common.confirmDelete', { name }),
      confirmLabel,
      tone: 'danger',
      onConfirm,
    })
}

export default useDeleteDialog
