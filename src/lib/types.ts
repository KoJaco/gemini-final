export type FooterButtonType = {
    title: string;
    labelName: "new-chat" | "all-threads" | "hover-mode" | "preferences";
    tooltip: string;
    icon: JSX.Element;
};

export type ContextOption = "read" | "summarize" | "simplify" | "translate";

type AiCharacteristics = {
    characteristics: {
        // add a few more of these
        label:
            | "simplicity"
            | "detail"
            | "clarity"
            | "conciseness"
            | "tone"
            | "engagement"
            | "creativity"
            | "custom";
        value: string;
    };
};

type AiInteractions = {
    interactions: {
        description: string;
        label: "further-explanations" | "examples" | "follow-up-questions";
        value: boolean;
    };
};

type ApplicationSettings = {
    translateToLanguage: {
        value:
            | { id: "es"; language: "spanish" }
            | { id: "en-AU"; language: "english" };
    };
};

export interface Preferences {
    aiSettings: (AiCharacteristics | AiInteractions)[];
    applicationSettings: ApplicationSettings[];
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
    threadId: string;
}

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
