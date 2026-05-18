import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: string; name: string; email: string; role: string; walletBalance: number }
interface AuthState {
  user: User | null; token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateBalance: (balance: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateBalance: (balance) => set((s) => s.user ? { user: { ...s.user, walletBalance: balance } } : {}),
    }),
    { name: 'ev-auth' }
  )
)
