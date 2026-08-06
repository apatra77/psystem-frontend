import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { INITIAL_PRESCRIPTIONS } from '@/shared/mocks/customer'

const uid = () => `rx${Date.now().toString().slice(-6)}`

/** Prescription uploads and their pharmacist-review status. */
export const usePrescriptionStore = create((set, get) => ({
  items: INITIAL_PRESCRIPTIONS,
  activeId: null,
  uploading: false,

  setActive: (id) => set({ activeId: id }),
  getById: (id) => get().items.find((p) => p.id === id) ?? null,
  approved: () => get().items.filter((p) => p.status === 'approved'),

  upload: async ({ file, patientName, doctorName, note }) => {
    set({ uploading: true })
    try {
      const record = {
        id: uid(),
        fileName: file?.name ?? 'prescription',
        previewUrl: file ? URL.createObjectURL(file) : null,
        patientName,
        doctorName: doctorName ?? '',
        note: note ?? '',
        uploadedAt: new Date().toISOString(),
        status: 'under_review',
      }
      set((s) => ({ items: [record, ...s.items], activeId: record.id, uploading: false }))
      toast.success(msg('customer.prescriptionUploaded'))
      return record
    } catch (error) {
      set({ uploading: false })
      toast.error(error.message)
      throw error
    }
  },

  replace: (id, file) =>
    set((s) => ({
      items: s.items.map((p) =>
        p.id === id
          ? { ...p, fileName: file.name, previewUrl: URL.createObjectURL(file), status: 'under_review', uploadedAt: new Date().toISOString() }
          : p,
      ),
    })),

  remove: (id) => {
    set((s) => ({ items: s.items.filter((p) => p.id !== id) }))
    toast.info(msg('customer.prescriptionDeleted'))
  },
}))

export default usePrescriptionStore
