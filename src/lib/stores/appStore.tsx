import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface AppState {
  autoImprovementsActive: boolean
  setAutoImprovementsActive: (value: boolean) => void
  typewriter: boolean
  setTypewriter: (value: boolean) => void
  apiKey: string | null
  setApiKey: (value: string | null) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        autoImprovementsActive: false,
        setAutoImprovementsActive: (value) =>
          set(() => ({ autoImprovementsActive: value })),
        typewriter: false,
        setTypewriter: (value) => set(() => ({ typewriter: value })),
        apiKey: null,
        setApiKey: (value) => set(() => ({ apiKey: value }))
      }),
      { name: "Gemini Application Store" }
    )
  )
)
