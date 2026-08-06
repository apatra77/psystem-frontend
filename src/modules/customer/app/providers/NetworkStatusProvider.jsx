import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

/** Shows a persistent banner when the browser goes offline. */
export default function NetworkStatusProvider({ children }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <>
      {!online && (
        <div
          className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 py-2 text-[12.5px] font-bold"
          style={{ background: 'rgba(255,138,128,0.16)', color: '#ff8a80', borderBottom: '1px solid rgba(255,138,128,0.34)' }}
          role="status"
        >
          <WifiOff size={14} /> {msg('common.offline')}
        </div>
      )}
      {children}
    </>
  )
}
