import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from "react";

import type { Transcript } from "../types";

interface HighlightContextType {
    currentCharIndex: number;
    setCurrentCharIndex: (index: number) => void;
    transcript: any; // Replace 'any' with your transcript type
    setTranscript: (transcript: any) => void; // Replace 'any' with your transcript type
}

const HighlightContext = createContext<HighlightContextType | undefined>(
    undefined
);

export const HighlightProvider = ({ children }: { children: ReactNode }) => {
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [transcript, setTranscript] = useState<Transcript>(null); // Replace 'any' with your transcript type

    return (
        <HighlightContext.Provider
            value={{
                currentCharIndex,
                setCurrentCharIndex,
                transcript,
                setTranscript
            }}>
            {children}
        </HighlightContext.Provider>
    );
};

export const useHighlight = () => {
    const context = useContext(HighlightContext);
    if (context === undefined) {
        throw new Error("useHighlight must be used within a HighlightProvider");
    }
    return context;
};
