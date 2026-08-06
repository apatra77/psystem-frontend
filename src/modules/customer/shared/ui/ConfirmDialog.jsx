import { useUiStore } from '@/app/store/uiStore'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog() {
  const confirm = useUiStore((s) => s.confirm)
  const close = useUiStore((s) => s.closeConfirm)
  if (!confirm) return null

  const handleConfirm = async () => {
    await confirm.onConfirm?.()
    close()
  }

  return (
    <Modal
      open
      onClose={close}
      title={confirm.title ?? 'Please confirm'}
      width={440}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {confirm.cancelLabel ?? 'Cancel'}
          </Button>
          <Button variant={confirm.tone === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm}>
            {confirm.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed" style={{ color: '#9dc3b4' }}>
        {confirm.message}
      </p>
    </Modal>
  )
}
