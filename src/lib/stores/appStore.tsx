import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { Preferences } from "../types";

interface AppState {
    autoImprovementsActive: boolean;
    setAutoImprovementsActive: (value: boolean) => void;
    typewriter: boolean;
    setTypewriter: (value: boolean) => void;
    geminiApiKey: string | null;
    setGeminiApiKey: (value: string | null) => void;
    whisperApiKey: string | null;
    setWhisperAPIKey: (value: string | null) => void;
    preferencesState: Preferences | null;
    savePreferencesState: (value: Preferences) => void;
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
                setGeminiApiKey: (value) =>
                    set(() => ({ geminiApiKey: value })),
                whisperApiKey: null,
                setWhisperAPIKey: (value) =>
                    set(() => ({ whisperApiKey: value })),
                preferencesState: null,
                savePreferencesState: (value) =>
                    set(() => ({ preferencesState: value }))
            }),
            { name: "Gemini Application Store" }
        )
    )
);
