import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import userService from '@/app/services/user.service'
import { useAuthStore } from './authStore'

/** The signed-in customer's own profile — distinct from authStore, which owns the session. */
export const useUserStore = create((set) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async () => {
    set({ loading: true, error: null })
    try {
      const profile = await userService.getProfile()
      set({ profile, loading: false })
      return profile
    } catch (error) {
      set({ loading: false, error: error.message })
      return null
    }
  },

  updateProfile: async (patch) => {
    set({ loading: true })
    try {
      const profile = await userService.updateProfile(patch)
      set({ profile, loading: false })
      useAuthStore.getState().updateUser(patch) // keep the header avatar/name in sync
      toast.success(msg('customer.profileUpdated'))
      return profile
    } catch (error) {
      set({ loading: false, error: error.message })
      toast.error(error.message)
      throw error
    }
  },

  changePassword: async (payload) => {
    await userService.changePassword(payload)
    toast.success(msg('auth.passwordChanged'))
  },

  reset: () => set({ profile: null, loading: false, error: null }),
}))

export const selectProfile = (s) => s.profile
export default useUserStore
