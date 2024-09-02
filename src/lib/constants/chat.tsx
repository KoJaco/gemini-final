import type { MenuOptionTitle } from "@/lib/types";

// TODO: Add actions attached to each record that we can add as our user message... this could be a different style maybe.
export const menuOptionToPrompt: Record<
    MenuOptionTitle,
    { action: string; prompt: string }
> = {
    Describe: {
        action: "Describing selected image.",
        prompt: "Describe the following image and pay close attention to the details:"
    },
    "Describe and Read Aloud": {
        action: "Describing and reading aloud selected image.",
        prompt: "Describe and read aloud the following image and pay close attention to the details:"
    },
    "Describe and Translate": {
        action: "Describing and translating selected image.",
        prompt: "Describe the following image and return your response in"
    },
    Summarize: {
        action: "Summarizing content.",
        prompt: "Your job is to summarize text content. Here is the text content to summarize:"
    },
    Simplify: {
        action: "Simplifying content.",
        prompt: "Your job is to simplify text content. If you cannot find a reasonable solution for simplification, state why you cannot simplify it. Here is the content to be simplified:"
    },
    Explain: {
        action: "Explaining content.",
        prompt: "Explain the content of the following element in detail:"
    },
    Translate: {
        action: "Translating content.",
        prompt: "Translate the content of the following element:"
    },
    "Summarize and Translate": {
        action: "Summarizing and translating content.",
        prompt: "Summarize and translate the content of the following element:"
    },
    "Read aloud": {
        action: "Reading aloud content.",
        prompt: "Read aloud the content of the following element:"
    }
};
