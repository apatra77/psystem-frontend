import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import PortalModal from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { fetchAdminSpecialties } from '@/services/adminDoctors'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

export default function SpecialtyManagementModal({ onClose }) {
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const list = await fetchAdminSpecialties()
        if (!cancelled) setSpecialties(list)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load specialties')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PortalModal onClose={onClose} width={560} scrollable={false}>
      <div className="flex flex-col max-h-[88vh]">
        <div
          className="flex-shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.09)' }}
        >
          <div>
            <h2 className="text-[17px] font-extrabold text-white">Manage Specialties</h2>
            <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
              Specialties currently configured for doctors in the system.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer" aria-label="Close">
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto owner-scroll min-h-0 px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${colors.borderSubtle}` }}>
              {specialties.map((item, index) => (
                <div
                  key={item.id}
                  className="px-4 py-3"
                  style={{ borderTop: index ? `1px solid ${colors.borderSubtle}` : undefined }}
                >
                  <div className="text-[13px] font-bold text-white">{item.label}</div>
                  {item.description ? (
                    <div className="text-[11.5px] mt-0.5" style={{ color: colors.textDim }}>
                      {item.description}
                    </div>
                  ) : null}
                </div>
              ))}
              {!specialties.length && (
                <p className="px-4 py-8 text-center text-[12.5px]" style={{ color: colors.textDim }}>
                  No specialties found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  )
}
