import { useEffect, useState } from 'react'
import { useUiStore } from '@/app/store/uiStore'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog() {
  const confirm = useUiStore((s) => s.confirm)
  const close = useUiStore((s) => s.closeConfirm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [confirm])

  if (!confirm) return null

  const handleClose = () => {
    if (loading) return
    close()
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await confirm.onConfirm?.()
      close()
    } catch {
      /* Keep dialog open so the user can retry or cancel. */
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={handleClose}
      title={confirm.title ?? 'Please confirm'}
      width={440}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {confirm.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={confirm.tone === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {loading ? (confirm.loadingLabel ?? 'Please wait…') : (confirm.confirmLabel ?? 'Confirm')}
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
