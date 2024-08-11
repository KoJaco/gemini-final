"use client";

import { helpfulQuestions } from "@/lib/constants/components";
import RateLimiter from "@/lib/rate-limiter";
import {
    getSummaryOnThread,
    saveSummaryToThread,
    updateThread
} from "@/lib/storage/indexed-db";
import { getSimpleTranscription } from "@/lib/storage/openAiApi";
import { useAppStore } from "@/lib/stores/appStore";
import type {
    ChatThread,
    ContextOption,
    Message,
    ThreadSummary
} from "@/lib/types";
import {
    GoogleGenerativeAI,
    type FileDataPart,
    type GenerativeContentBlob,
    type InlineDataPart,
    type Part
} from "@google/generative-ai";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";

import PromptForm from "../forms/prompt-form";
import { Button } from "../ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "../ui/carousel";

// TODO: bug in context menu after asking for page-based responses, thread doesn't update properly.

// TODO: Big clean up of this file, repeated functionality that could be brought outside of if else clauses, repeated functions (condense), etc... I wrote this very quickly...

// TODO: 1. context menu options don't update the thread properly (local state), 2. Should we attach and render images in the chat interface? requires storing on messages && creating a new store, 3.

// TODO: these should probably be slugs
type MenuOptionTitle =
    | "Describe"
    | "Describe and Read Aloud"
    | "Describe and Translate"
    | "Summarize"
    | "Simplify"
    | "Explain"
    | "Translate"
    | "Summarize and Translate"
    | "Read aloud";

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

// TODO: Grab from preferences (apply differences to image comprehension calls and text gen calls -- one is much more expensive, can you guess which?)
const rateLimiter = new RateLimiter(10, 60000); // limited to 10 calls per minute

const Chat = ({
    thread,
    setThread,
    setResponseLoading
}: {
    thread: ChatThread;
    setThread: (thread: ChatThread) => void;
    setResponseLoading: (value: boolean) => void;
}) => {
    const { setTypewriter, geminiApiKey, preferencesState, setRecording } =
        useAppStore();
    // console.log(preferencesState);
    const characteristicsPreference =
        preferencesState.aiSettings.characteristics.value;
    const interactionsPreference =
        preferencesState.aiSettings.interactions.value;

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState<string>("");

    const hoveredElementRef = useRef<HTMLElement | null>(null);

    const [contextOption, setContextOption] = useState(null);

    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // TODO: Extrapolate out types on put into single file.

    // handle forwarded messages from background script.
    useEffect(() => {
        const handleMessage = async (message: {
            action:
                | "MENU_OPTION_CLICKED"
                | "GET_PAGE_TEXT_CONTENT"
                | "TOGGLE_HOVER_MODE"
                | "VOICE_COMMAND_DATA_TO_SIDEPANEL"
                | "AUDIO_DATA";
            payload?: any;
        }) => {
            if (message.action === "MENU_OPTION_CLICKED") {
                const { title, content, inlineData, elementType } =
                    message.payload;

                // TODO: Add edge case handling :: I don't want people to be requesting simplification for one word.

                if (title === "Simplify") {
                    const toSimplify: string[] = content.split(" ");
                    // TODO: proper handling... 8 words is arbitrary... allow users to set?
                    if (!toSimplify || toSimplify.length < 8) {
                        console.info(
                            `You're trying to simplify text that is already very simple.`
                        );
                        return;
                    }
                }

                if (Object.keys(menuOptionToPrompt).includes(title)) {
                    handleContextOption({
                        title,
                        content,
                        inlineData,
                        elementType
                    });
                } else {
                    console.error("Menu option somehow didn't exist! ", title);
                }
            } else if (message.action === "VOICE_COMMAND_DATA_TO_SIDEPANEL") {
                setRecording(false);

                console.log("Chat", message.payload.payload);

                // Convert the received array back to a Uint8Array
                const uint8Array = new Uint8Array(
                    message.payload.payload.inlineData.audioBuffer
                );
                const audioBlob = new Blob([uint8Array], { type: "audio/wav" });
                console.log("audio in chat: ", audioBlob);
                setAudioBlob(audioBlob);
                const res = await getSimpleTranscription(audioBlob);

                if (res.success) {
                    setTypewriter(true);

                    const newUserMessage: Message = {
                        role: "system",
                        content: res.transcript.text,
                        id: nanoid(),
                        createdAt: new Date().toISOString(),
                        threadId: thread.threadId
                    };

                    const updatedThread = {
                        ...thread,
                        messages: [...thread.messages, newUserMessage]
                    };

                    // optimistically set thread with new message

                    updateThread(thread.threadId, newUserMessage).then(
                        (resultSet) => {
                            if (resultSet.success) {
                                setThread(updatedThread);
                            } else {
                                console.error(resultSet.message);
                            }
                        }
                    );

                    try {
                        const currentSummary =
                            (await getSummaryOnThread(thread.threadId))
                                ?.content || "No current summary";

                        const aiResponse = await fetchData(
                            `You are responsible for working out how a user's voice command related to the content of a particular section of a website. The user's command is as follows: ${res.transcript.text}. Here is the content in question that the user is asking about: ${message.payload.payload.content}`
                        );

                        if (aiResponse.success) {
                            const newGeminiMessage: Message = {
                                role: "assistant",
                                content: aiResponse.data,
                                id: nanoid(),
                                createdAt: new Date().toISOString(),
                                threadId: thread.threadId
                            };
                            const newThread = {
                                ...updatedThread,
                                messages: [
                                    ...updatedThread.messages,
                                    newGeminiMessage
                                ]
                            };

                            updateThread(
                                thread.threadId,
                                newGeminiMessage
                            ).then((resultSet) => {
                                if (resultSet.success) {
                                    setThread(newThread);
                                } else {
                                    // TODO: system message warning.
                                    console.error(resultSet.message);
                                }
                            });

                            // TODO: Improve keeping the context for the next response, previous few messages should be the most pertinent.

                            await updateConversationSummary(
                                thread.threadId,
                                currentSummary,
                                aiResponse.data
                            );
                        } else {
                            const newGeminiMessage: Message = {
                                role: "ai-error",
                                content: aiResponse.data,
                                id: nanoid(),
                                createdAt: new Date().toISOString(),
                                threadId: thread.threadId
                            };

                            const newThread = {
                                ...updatedThread,
                                messages: [
                                    ...updatedThread.messages,
                                    newGeminiMessage
                                ]
                            };

                            updateThread(
                                thread.threadId,
                                newGeminiMessage
                            ).then((resultSet) => {
                                if (resultSet.success) {
                                    setThread(newThread);
                                } else {
                                    // TODO: System message.
                                    console.error(resultSet.message);
                                }
                            });
                        }
                    } catch (error) {
                        console.error(
                            "ERROR when handling context option: ",
                            error
                        );
                    } finally {
                        setTypewriter(false);
                    }
                } else {
                    console.log(res);
                }
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    const playAudio = () => {
        if (audioBlob) {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    const handleContextOption = async ({
        title,
        content,
        inlineData,
        elementType
    }: {
        title: MenuOptionTitle;
        content: string;
        inlineData: null | { data: string; mimeType: string };
        elementType: string;
    }) => {
        let prompt: string;

        // TODO: grab from preferences object
        const languagePreference =
            preferencesState.applicationSettings.translateToLanguage.value
                .language;

        const systemMessage = menuOptionToPrompt[title].action;

        if (elementType === "IMG") {
            if (!inlineData) {
                console.warn("No inline data supplied for image.");
            }
            switch (title) {
                case "Describe":
                    prompt = `${menuOptionToPrompt[title].prompt}`;
                    break;
                case "Describe and Read Aloud":
                    // additional logic for reading aloud after
                    prompt = `${menuOptionToPrompt[title].prompt}`;
                    break;
                case "Describe and Translate":
                    prompt = `You are a translator who can translate many languages into ${languagePreference}. ${menuOptionToPrompt[title].prompt} ${languagePreference}`;
                    break;
                default:
                    prompt = `${menuOptionToPrompt[title].prompt}`;
                    break;
            }
        }
        if (title === "Translate" || title === "Summarize and Translate") {
            prompt = `You are a translator who can translate many languages into ${languagePreference}. ${menuOptionToPrompt[title].prompt} to ${languagePreference}: "${content}"`;
        } else if (title === "Simplify") {
            prompt = `${menuOptionToPrompt[title].prompt} "${content}"\n\nYou should respond with a simplified version of the text content, however, please also ${interactionsPreference}`;
        } else if (title === "Summarize") {
            prompt = `${menuOptionToPrompt[title].prompt} "${content}"\n\nYou must respond with a summary of the text content, however, please also ${interactionsPreference}`;
        } else if (title === "Explain") {
            prompt = `${menuOptionToPrompt[title].prompt} "${content}"\n\nYou must respond with an explanation of the text content, however, please also ${interactionsPreference}`;
        } else {
            prompt = `${menuOptionToPrompt[title].prompt} "${content}"`;
        }

        prompt =
            `You are the reply with the following characteristics: ${characteristicsPreference}` +
            " " +
            prompt;

        setTypewriter(true);

        const newUserMessage: Message = {
            role: "system",
            content: systemMessage,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            threadId: thread.threadId
        };

        const updatedThread = {
            ...thread,
            messages: [...thread.messages, newUserMessage]
        };

        // optimistically set thread with new message

        updateThread(thread.threadId, newUserMessage).then((resultSet) => {
            if (resultSet.success) {
                setThread(updatedThread);
            } else {
                console.error(resultSet.message);
            }
        });

        try {
            const currentSummary =
                (await getSummaryOnThread(thread.threadId))?.content ||
                "No current summary";

            let aiResponse: { success: boolean; data: string };

            if (elementType === "IMG" && inlineData) {
                const imagePart: InlineDataPart = {
                    inlineData: {
                        mimeType: inlineData.mimeType,
                        data: inlineData.data
                    }
                };
                aiResponse = await fetchTextDataFromTextAndImage(
                    prompt,
                    imagePart
                );
            } else {
                // TODO: handle this properly.
                aiResponse = await fetchData(prompt);
            }

            if (aiResponse.success) {
                const newGeminiMessage: Message = {
                    role: "assistant",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };
                const newThread = {
                    ...updatedThread,
                    messages: [...updatedThread.messages, newGeminiMessage]
                };

                updateThread(thread.threadId, newGeminiMessage).then(
                    (resultSet) => {
                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: system message warning.
                            console.error(resultSet.message);
                        }
                    }
                );

                // TODO: Improve keeping the context for the next response, previous few messages should be the most pertinent.

                await updateConversationSummary(
                    thread.threadId,
                    currentSummary,
                    aiResponse.data
                );
            } else {
                const newGeminiMessage: Message = {
                    role: "ai-error",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };

                const newThread = {
                    ...updatedThread,
                    messages: [...updatedThread.messages, newGeminiMessage]
                };

                updateThread(thread.threadId, newGeminiMessage).then(
                    (resultSet) => {
                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: System message.
                            console.error(resultSet.message);
                        }
                    }
                );
            }
        } catch (error) {
            console.error("ERROR when handling context option: ", error);
        } finally {
            setTypewriter(false);
        }
    };

    // TODO: can't do this... need to translate first from OpenAI I guess.

    async function prepareGeminiRequest(audioBlob: Blob) {
        // Convert the Blob into a base64 encoded string
        // const base64Audio = await blobToBase64(audioBlob);

        const file = new File([audioBlob], "audio.mpeg", {
            type: "audio/mpeg"
        });

        // const base64String = base64Audio.split(",")[1];

        // Construct the request body
        const requestBody = {
            prompt: "Please translate the following audio",

            filePart: {
                fileData: {
                    fileUri: file,
                    mimeType: audioBlob.type // MIME type of the audio
                }
            }
        };

        return requestBody;
    }

    const fetchTextDataFromTextAndAudio = async (
        prompt: string,
        filePart: FileDataPart
    ) => {
        setResponseLoading(true);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // TODO: need a better way to throw 'limited'... add toast component.
        try {
            return await rateLimiter.call(async () => {
                const result = await model.generateContent([prompt, filePart]);
                const response = await result.response;
                const text = response.text();

                return { success: true, data: text };
            });
        } catch (err) {
            console.error(err.message);
            return { success: false, data: err.message };
        } finally {
            setResponseLoading(false);
        }
    };

    const fetchTextDataFromTextAndImage = async (
        prompt: string,
        imagePart: Part
    ) => {
        setResponseLoading(true);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // TODO: need a better way to throw 'limited'... add toast component.
        try {
            return await rateLimiter.call(async () => {
                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                const text = response.text();

                return { success: true, data: text };
            });
        } catch (err) {
            console.error(err.message);
            return { success: false, data: err.message };
        } finally {
            setResponseLoading(false);
        }
    };

    const fetchData = async (prompt: string, summary?: string | null) => {
        setResponseLoading(true);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // let newMessage: Message | null = null;

        try {
            let fullPrompt: string = "";
            if (summary) {
                fullPrompt = `Here is the summary of our conversation so far: ${summary}\n\nPlease consider the last message attached to the summary most pertinent. Now, please respond to the following message:\n${prompt}`;
            } else {
                fullPrompt = prompt;
            }
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            return { success: true, data: text };
        } catch (err) {
            console.error(err.message);
            return { success: false, data: err.message };
        } finally {
            setResponseLoading(false);
        }
    };

    async function updateConversationSummary(
        threadId: string,
        currentSummary: string,
        lastAIMessage: string
    ): Promise<void> {
        // Combine the current summary with the last AI message
        const summaryContent = `Current summary:\n${currentSummary}\n\nLast message:\n${lastAIMessage}`;

        // Generate a new summary using the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Update the following summary based on the last message using the following\n\n${summaryContent}\n\nYou should attach the last message to the end of the summary and mark it as the most pertinent for any follow up questions.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const newSummaryContent = await response.text();

            const newSummary: ThreadSummary = {
                content: newSummaryContent,
                lastUpdated: new Date().toISOString()
            };

            // Save the new summary to IndexedDB
            const summaryResult = await saveSummaryToThread(
                newSummary,
                threadId
            );

            // TODO: handle result set
        } catch (err) {
            console.error("Error generating summary:", err);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        const value = input.trim();
        setInput("");

        if (!value) return;

        setTypewriter(true);

        const newUserMessage: Message = {
            role: "user",
            content: value,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            threadId: thread.threadId
        };

        const updatedThread = {
            ...thread,
            messages: [...thread.messages, newUserMessage]
        };
        try {
            updateThread(thread.threadId, newUserMessage).then((resultSet) => {
                if (resultSet.success) {
                    setThread(updatedThread);
                } else {
                    console.error(resultSet.message);
                }
            });

            // TODO: Maintain a context object in our thread store. This is a summary of the conversation so far

            const currentSummary =
                (await getSummaryOnThread(thread.threadId))?.content ||
                "No current summary";

            const aiResponse = await fetchData(
                newUserMessage.content,
                currentSummary
            );

            if (aiResponse.success) {
                const newGeminiMessage: Message = {
                    role: "assistant",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };
                const newThread = {
                    ...updatedThread,
                    messages: [...updatedThread.messages, newGeminiMessage]
                };

                const updateThreadRes = await updateThread(
                    thread.threadId,
                    newGeminiMessage
                );

                if (updateThreadRes.success) {
                    setThread(newThread);
                } else {
                    console.error("Error updating thread in database");
                }

                // TODO: update summary object. periodically... hmmm how to handle this?? Need a non-hacky way of handling this ay.

                await updateConversationSummary(
                    thread.threadId,
                    currentSummary,
                    aiResponse.data
                );
            } else {
                const newGeminiMessage: Message = {
                    role: "ai-error",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };

                const newThread = {
                    ...updatedThread,
                    messages: [...updatedThread.messages, newGeminiMessage]
                };

                updateThread(thread.threadId, newGeminiMessage).then(
                    (resultSet) => {
                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: System message.
                            console.error(resultSet.message);
                        }
                    }
                );
            }
        } catch (error) {
            console.error("Error handling submit: ", error);
        } finally {
            setTypewriter(false);
        }
    }

    async function fetchPageTextContent() {
        try {
            const response = await new Promise<{
                success: boolean;
                content: string;
                message?: string;
            }>((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { action: "GET_PAGE_TEXT_CONTENT" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });

            if (response.success) {
                return response.content;
            } else {
                console.error(
                    "Failed to get the page text content: ",
                    response?.message
                );
            }
        } catch (error) {
            console.error("Error: ", error.message);
        }
    }

    async function handleMergePromptAndSubmit(
        identifier: "summarize-page" | "main-purpose" | "explain-complex-terms",
        prompt: string
    ) {
        // TODO: Refactor | better prompt design, offload prompt merging to a util function or something...
        const pageContent = await fetchPageTextContent();

        const newUserMessage: Message = {
            role: "user",
            content: prompt,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            threadId: thread.threadId
        };

        const updatedThread = {
            ...thread,
            messages: [...thread.messages, newUserMessage]
        };

        setTypewriter(true);

        let messageToGemini: string = "";

        if (identifier === "summarize-page") {
            // This can be handled by simply asking Gemini to look it up and summarize it.
            // Insert context from preferences (how you want Gemini to respond to you... used dummy preference for now)
            messageToGemini = `Please summarize the website by looking at the following HTML content. You are to respond with these characteristics: ${characteristicsPreference}. You are also to append the following additions to your response: ${interactionsPreference}\n\n Here is the website's text-based HTML to be summarized: ${pageContent}`;
        } else if (identifier === "main-purpose") {
            // This prompt asks Gemini to identify the main purpose of the webpage
            messageToGemini = `What is the main purpose or goal of this webpage? You are to respond with these characteristics: ${characteristicsPreference}. You are also to append the following additions to your response: ${interactionsPreference}\n\nHere is the website's text-based HTML: ${pageContent}`;
        } else if (identifier === "explain-complex-terms") {
            // This prompt asks Gemini to explain any complex terms found on the webpage
            messageToGemini = `Identify and explain any complex terms or concepts found in the following HTML content. You are to respond with these characteristics: ${characteristicsPreference}. You are also to append the following additions to your response: ${interactionsPreference}\n\nHere is the website's text-based HTML: ${pageContent}`;
        }

        updateThread(thread.threadId, newUserMessage).then((resultSet) => {
            if (resultSet.success) {
                setThread(updatedThread);
            } else {
                console.error(resultSet.message);
            }
        });

        try {
            const currentSummary =
                (await getSummaryOnThread(thread.threadId))?.content ||
                "No current summary";

            const aiResponse = await fetchData(messageToGemini, currentSummary);

            if (aiResponse.success) {
                const newGeminiMessage: Message = {
                    role: "assistant",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };
                const newThread = {
                    ...updatedThread,
                    messages: [...updatedThread.messages, newGeminiMessage]
                };

                updateThread(thread.threadId, newGeminiMessage).then(
                    (resultSet) => {
                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: system message warning.
                            console.error(resultSet.message);
                        }
                    }
                );

                await updateConversationSummary(
                    thread.threadId,
                    currentSummary,
                    aiResponse.data
                );
            } else {
                const newGeminiMessage: Message = {
                    role: "ai-error",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };

                const newThread = {
                    ...updatedThread,
                    messages: [...updatedThread.messages, newGeminiMessage]
                };

                updateThread(thread.threadId, newGeminiMessage).then(
                    (resultSet) => {
                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: System message.
                            console.error(resultSet.message);
                        }
                    }
                );
            }
        } catch (error) {
            // TODO: handle generative ai blocking it and report it as a toast message... what can I do about sensitive content being requested to be analysed?
            console.warn(error);
        }

        setTypewriter(false);
    }

    if (!thread.messages) return null;

    return (
        <div className="flex flex-col mt-auto">
            {/* {audioBlob && <button onClick={playAudio}>Play audio</button>} */}
            <Carousel className="px-4 w-full mb-4 group relative">
                <div className="w-full justify-center translate-y-2 z-10 relative space-x-4">
                    <CarouselPrevious />
                    <CarouselNext />
                </div>

                <CarouselContent className="flex">
                    {helpfulQuestions.map((q, index) => (
                        <CarouselItem
                            key={index}
                            className="flex max-w-[240px] w-auto h-20">
                            <Button
                                variant="ghost"
                                type="button"
                                className="rounded-sm bg-muted/50 flex flex-wrap whitespace-normal w-full text-left p-2 h-full text-muted-foreground items-start justify-start"
                                onClick={() =>
                                    handleMergePromptAndSubmit(
                                        q.labelName,
                                        q.prompt
                                    )
                                }>
                                {q.prompt}
                            </Button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            <div className="mb-4 mt-auto px-4">
                <PromptForm
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};

export default Chat;
