export type FooterButtonType = {
    title: string;
    labelName: "new-chat" | "all-threads" | "hover-mode" | "preferences";
    tooltip: string;
    icon: JSX.Element;
};

export type ContextOption = "read" | "summarize" | "simplify" | "translate";

// AI Characteristics
export const AI_CHARACTERISTICS = {
    SIMPLICITY: "simplicity",
    DETAIL: "detail",
    CLARITY: "clarity",
    CONCISENESS: "conciseness",
    TONE: "tone",
    ENGAGEMENT: "engagement",
    CREATIVITY: "creativity"
    // CUSTOM: "custom"
} as const;

export type AiCharacteristicsLabel =
    (typeof AI_CHARACTERISTICS)[keyof typeof AI_CHARACTERISTICS];

export const AI_CHARACTERISTICS_VALUE = {
    SIMPLICITY:
        "Express things as simply as possible, be kind and empathetic, be patient.",
    DETAIL: "Provide detailed explanations and thorough insights.",
    CLARITY: "Ensure explanations are clear and easy to understand.",
    CONCISENESS: "Keep responses short and to the point.",
    TONE: "Adjust the tone to be friendly, formal, or neutral based on the context.",
    ENGAGEMENT: "Be engaging and interactive.",
    CREATIVITY: "Allow for creative and imaginative responses."
    // CUSTOM: "custom"
} as const;

export type AIiCharacteristicsValue =
    (typeof AI_CHARACTERISTICS_VALUE)[keyof typeof AI_CHARACTERISTICS_VALUE];

// AI Interactions
export const AI_INTERACTIONS = {
    FOLLOW_UP_QUESTIONS: "follow_up_questions",
    FURTHER_EXPLANATIONS: "further_explanations",
    EXAMPLES: "examples",
    NONE: "none"
} as const;

export type AiInteractionsLabel =
    (typeof AI_INTERACTIONS)[keyof typeof AI_INTERACTIONS];

// AI Interactions
export const AI_INTERACTIONS_VALUE = {
    FURTHER_EXPLANATIONS:
        "provide additional explanations and context to your response where necessary.",

    EXAMPLES:
        "include examples to illustrate complex concepts in your response. If there are not relatively complex concepts expressed simply mention why the concept cannot be illustrated.",

    FOLLOW_UP_QUESTIONS:
        "provide some follow-up questions that I could ask or research myself to help me understand your response better.",

    NONE: ""
} as const;

export type AiInteractionsValue =
    (typeof AI_INTERACTIONS_VALUE)[keyof typeof AI_INTERACTIONS_VALUE];

// Languages
export const TRANSLATE_LANGUAGES = {
    SPANISH: { id: "es", language: "spanish" },
    ENGLISH: { id: "en-AU", language: "english" }
} as const;

export type TranslateLanguage =
    (typeof TRANSLATE_LANGUAGES)[keyof typeof TRANSLATE_LANGUAGES];

// TODO: fix this typing, it doesn't make sense (large refactor of preferences needed)

export type ApplicationSettings = {
    translateToLanguage: {
        value: TranslateLanguage;
    } | null;
};

export interface Preferences {
    aiSettings: {
        characteristics: {
            label: AiCharacteristicsLabel;
            value: AIiCharacteristicsValue;
        };
        interactions: {
            label: AiInteractionsLabel;
            value: AiInteractionsValue;
        };
    };
    applicationSettings: {
        translateToLanguage: {
            value: TranslateLanguage;
        } | null;
        useWebSpeech: boolean;
    };
}

export type HelpfulQuestion = {
    labelName: "summarize-page" | "main-purpose" | "explain-complex-terms";
    prompt: string;
};

export interface Message {
    role:
        | "user"
        | "assistant"
        | "system"
        | "function"
        | "data"
        | "tool"
        | "ai-warning"
        | "ai-error";
    content: string;
    id?: string;
    name?: string;
    display?: {
        name: string;
        props: Record<string, unknown>;
    };
    createdAt: string; // ISO string
    threadId: string; // reference to index on message store
    audioBlob?: Blob;
    transcript?: any; // update later to correct type
}

// this interface differs from the database structure...
export interface ChatThread {
    threadId: string;
    messages: Message[];
    summary?: ThreadSummary;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}

export interface ThreadSummary {
    content: string;
    lastUpdated: string; // ISO string
}

export interface StorageItems {
    chatThreads?: ChatThread[];
}

export type AvailableViews =
    | "main"
    | "add-api"
    | "all-threads"
    | "preferences"
    | "read-mode";

export type ResultObject = {
    success: boolean;
    data?: any;
    error?: Error;
    message?: string;
};

export interface Transcript {
    duration: number;
    language: string;
    segments: {
        id: number;
        avg_logprop: number;
        compression_ratio: number;
        no_speech_prob: number;
        temperature: number;
        seek: number;
        start: number;
        end: number;
        text: string;
        tokens: number[];
    }[];
    task: string;
    text: string;
    words: { word: string; start: number; end: number }[];
}

export interface AudioData {
    audioId: string;
    messageId: string;
    audioBlob: Blob;
    transcript: Transcript | Partial<Transcript> | null;
}

export interface Audio {
    id: number;
    title: string;
    published: Date;
    description: string;
    content: string;
    audio: {
        src: string;
        type: string;
    };
}
