import type { FooterButtonType, HelpfulQuestion } from "@/lib/types";
import {
    List,
    MessageSquareDiff,
    MessagesSquare,
    MousePointer,
    Settings
} from "lucide-react";

export const helpfulQuestions: HelpfulQuestion[] = [
    {
        labelName: "summarize-page",
        prompt: "Please summarize the current page for me."
    },
    {
        labelName: "main-purpose",
        prompt: "What is the main purpose of this webpage?"
    },
    {
        labelName: "explain-complex-terms",
        prompt: "Please explain any complex terms or concepts found on this webpage"
    }
];

// TODO: More helpful questions to be implemented...
/**
 * 1. list important sections
 * 2. explain complex terms
 * 3. accessibility overview
 * 4. reading level, how can it be simplified?
 * 5. "What actionable steps or tasks can I take based on this webpage?"
 *
 */

export const footerButtons: FooterButtonType[] = [
    {
        title: "New Chat",
        labelName: "new-chat",
        tooltip: "Start a new chat.",
        icon: <MessageSquareDiff />
    },
    {
        title: "All Chats",
        labelName: "all-threads",
        tooltip: "View all your chats.",
        icon: <MessagesSquare />
    },
    {
        title: "Hover Mode",
        labelName: "hover-mode",
        tooltip:
            "Activate hover mode. Move your mouse over elements on the page to display a context menu. If you have voice commands enabled in your preferences you can command Gemini to interact an element.",
        icon: <MousePointer />
    },

    {
        title: "Change Preferences",
        labelName: "preferences",
        tooltip:
            "Change your web browsing preferences. This is where you set how Gemini interacts with each page.",
        icon: <Settings />
    }
];
