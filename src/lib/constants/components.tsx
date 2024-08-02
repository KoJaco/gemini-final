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
        labelName: "read-aloud",
        prompt: "Can you read out the website's text for me?"
    },
    {
        labelName: "summarize-page",
        prompt: "Please summarize the current page for me."
    },
    {
        labelName: "better-understand",
        prompt: "Can you help me understand what's on this page?"
    },
    {
        labelName: "page-makeup",
        prompt: "Can you describe how this page is made up?"
    }
];

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
        title: "Reading Mode",
        labelName: "reading-mode",
        tooltip:
            "Allow Gemini to condense the website into only text-based content and change text to your preferences.",
        icon: <List />
    },
    {
        title: "Change Preferences",
        labelName: "preferences",
        tooltip:
            "Change your web browsing preferences. This is where you set how Gemini interacts with each page.",
        icon: <Settings />
    }
];
