import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface AppState {
  autoImprovementsActive: boolean
  setAutoImprovementsActive: (value: boolean) => void
  typewriter: boolean
  setTypewriter: (value: boolean) => void
  geminiApiKey: string | null
  setGeminiApiKey: (value: string | null) => void
  whisperApiKey: string | null
  setWhisperAPiKey: (value: string | null) => void
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
        geminiApiKey: null,
        setGeminiApiKey: (value) => set(() => ({ geminiApiKey: value })),
        whisperApiKey: null,
        setWhisperAPiKey: (value) => set(() => ({ whisperApiKey: value }))
      }),
      { name: "Gemini Application Store" }
    )
  )
)
