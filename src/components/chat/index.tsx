"use client";

import { helpfulQuestions } from "@/lib/constants/components";
import {
    getSummaryOnThread,
    saveSummaryToThread,
    updateThread
} from "@/lib/storage/indexed-db";
import { useAppStore } from "@/lib/stores/appStore";
import type {
    ChatThread,
    ContextOption,
    Message,
    ThreadSummary
} from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
export const menuOptionToPrompt: Record<MenuOptionTitle, string> = {
    Describe:
        "Describe following image and pay close attention to the details:",
    "Describe and Read Aloud":
        "Describe and the following image and pay close attention to the details:",
    "Describe and Translate":
        "Describe and the following image and return your response in",
    Summarize:
        "Summarize the content of the following element. If you cannot find a reasonable solution for simplification, state why you cannot simplify it. Here is the element to simplify:",
    Simplify: "Simplify the content of the following element:",
    Explain: "Explain the content of the following element in detail:",
    Translate: "Translate the content of the following element",
    "Summarize and Translate":
        "Summarize and translate the content of the following element",
    "Read aloud": "Read aloud the content of the following element:"
};

const Chat = ({
    thread,
    setThread,
    setResponseLoading
}: {
    thread: ChatThread;
    setThread: (thread: ChatThread) => void;
    setResponseLoading: (value: boolean) => void;
}) => {
    const { setTypewriter, geminiApiKey } = useAppStore();

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState<string>("");

    const hoveredElementRef = useRef<HTMLElement | null>(null);

    const [contextOption, setContextOption] = useState(null);

    // TODO: Extrapolate out types on put into single file.

    // handle forwarded messages from background script.
    useEffect(() => {
        const handleMessage = (message: {
            action:
                | "MENU_OPTION_CLICKED"
                | "GET_PAGE_TEXT_CONTENT"
                | "TOGGLE_HOVER_MODE";
            payload?: any;
        }) => {
            console.log(message);
            if (message.action === "MENU_OPTION_CLICKED") {
                const { title, content, elementType } = message.payload;

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
                    handleContextOption({ title, content, elementType });
                } else {
                    console.error("Menu option somehow didn't exist! ", title);
                }

                // setContextOption(message.option);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    const handleContextOption = async ({
        title,
        content,
        elementType
    }: {
        title: MenuOptionTitle;
        content: string;
        elementType: string;
    }) => {
        let prompt: string = "";

        // TODO: grab from preferences object
        const languagePreference = "Spanish";

        if (elementType === "IMG") {
            switch (title) {
                case "Describe":
                    prompt = `${menuOptionToPrompt[title]} ${content}`;
                    break;
                case "Describe and Read Aloud":
                    // additional logic for reading aloud after
                    prompt = `${menuOptionToPrompt[title]} ${content}`;
                    break;
                case "Describe and Translate":
                    prompt = `You are a translator who can translate many languages into ${languagePreference}. ${menuOptionToPrompt[title]} ${content}`;
                    break;
                default:
                    prompt = `${menuOptionToPrompt[title]} ${content}`;
                    break;
            }
        }
        if (title === "Translate" || title === "Summarize and Translate") {
            prompt = `You are a translator who can translate many languages into ${languagePreference}. ${menuOptionToPrompt[title]} to ${languagePreference}: ${content}`;
        } else {
            prompt = `${menuOptionToPrompt[title]} ${content}`;
        }

        // TODO: Should there be a user message? Or simply a gemini message based on a command?
        try {
            const currentSummary =
                (await getSummaryOnThread(thread.threadId))?.content ||
                "No current summary";

            const aiResponse = await fetchData(prompt);

            if (aiResponse.success) {
                const newGeminiMessage: Message = {
                    role: "assistant",
                    content: aiResponse.data,
                    id: nanoid(),
                    createdAt: new Date().toISOString(),
                    threadId: thread.threadId
                };
                const newThread = {
                    ...thread,
                    messages: [...thread.messages, newGeminiMessage]
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
                    ...thread,
                    messages: [...thread.messages, newGeminiMessage]
                };

                updateThread(thread.threadId, newGeminiMessage).then(
                    (resultSet) => {
                        console.log(resultSet);

                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: System message.
                            console.error(resultSet.message);
                        }
                    }
                );

                console.log("Could not generate AI response");
            }
        } catch (error) {
            console.error("ERROR when handling context option: ", error);
        }
    };

    // TODO: Add another fetchDataImage

    const fetchData = async (prompt: string, summary?: string | null) => {
        setResponseLoading(true);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // let newMessage: Message | null = null;

        try {
            let fullPrompt: string = "";
            if (summary) {
                fullPrompt = `Here is the summary of our conversation so far: ${summary}\n\nNow, please respond to the following message:\n${prompt}`;
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
        console.log("hit");
        // Combine the current summary with the last AI message
        const summaryContent = `Current summary:\n${currentSummary}\n\nLast message:\n${lastAIMessage}`;

        // Generate a new summary using the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Update the following summary based on the last message:\n${summaryContent}`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const newSummaryContent = await response.text();

            const newSummary: ThreadSummary = {
                content: newSummaryContent,
                lastUpdated: new Date().toISOString()
            };

            console.log("new summary generated: ", newSummary);

            // Save the new summary to IndexedDB
            const summaryResult = await saveSummaryToThread(
                newSummary,
                threadId
            );
            console.log("Summary saved: ", summaryResult);
        } catch (err) {
            console.error("Error generating summary:", err);
        }
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        // blur focus on mobile

        if (window.innerWidth < 600) {
            event.currentTarget["message"]?.blur();
        }

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
            // optimistically add user messages to indexdb, this should push a user message to into the chat. If a chat thread doesn't exist, create one.

            updateThread(thread.threadId, newUserMessage).then((resultSet) => {
                if (resultSet.success) {
                    setThread(updatedThread);
                    console.log(resultSet.message);
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

                // if (updatedThread.messages.length < 4) {
                //   updateConversationSummary(thread.threadId, newThread.messages)
                // } else if (updatedThread.messages.length > 4 && updatedThread.messages.length % 4 === 0) {
                //   updateConversationSummary(thread.threadId, newThread.messages)
                // }

                console.log("I should be fucking working here.");

                await updateConversationSummary(
                    thread.threadId,
                    currentSummary,
                    aiResponse.data
                );

                // const newSummaryContent =
                //     currentSummary +
                //     `\nUser: ${newUserMessage.content}\nGemini: ${aiResponse}`;

                // const newSummary: ThreadSummary = {
                //     content: newSummaryContent,
                //     lastUpdated: new Date().toISOString()
                // };

                // await saveSummaryToThread(newSummary, thread.threadId);
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
                        console.log(resultSet);

                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: System message.
                            console.error(resultSet.message);
                        }
                    }
                );

                console.log("Could not generate AI response");
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
        // this function will need to interact with a content script / service worker to grab the current pages content.
        // TODO: change this, we don't just want text content... better understand and page-makeup may require adding additional html elements?

        // TODO: Merge with preferences object (if the user wants additional questions they can ask chatgpt to help them understand the text better?)

        // TODO: Restructure this... switch on identifier first and create prompt + send relevant message and get a response... could have toast message set in a local state with a useEffect to trigger.

        // TODO: Cache this... don't want to repeat scraping if we don't have to... will need to identify if the page has been pulled from somehow.
        const pageContent = await fetchPageTextContent();
        // console.log(pageContent);

        const responseCharacteristicPreference =
            "Express things as simply as possible, be kind and empathetic, be patient.";

        // TODO: At the moment I have just fetched the gemini response and set the user message to be the prompt, without what actually goes to Gemini in there.
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
            messageToGemini = `Please summarize the website by looking at the following HTML content. Your response should be in correctly formatted markdown and you are to respond with these characteristics: ${responseCharacteristicPreference}. Here is the website's text-based HTML to be summarized: ${pageContent}`;
        } else if (identifier === "main-purpose") {
            // This prompt asks Gemini to identify the main purpose of the webpage
            messageToGemini = `What is the main purpose or goal of this webpage? Your response should be in correctly formatted markdown and you are to respond with these characteristics: ${responseCharacteristicPreference}. Here is the website's text-based HTML: ${pageContent}`;
        } else if (identifier === "explain-complex-terms") {
            // This prompt asks Gemini to explain any complex terms found on the webpage
            messageToGemini = `Please identify and explain any complex terms or concepts found in the following HTML content. Your response should be in correctly formatted markdown and you are to respond with these characteristics: ${responseCharacteristicPreference}. Here is the website's text-based HTML: ${pageContent}`;
        } else {
            messageToGemini = "";
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
                        console.log(resultSet);

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
                        console.log(resultSet);

                        if (resultSet.success) {
                            setThread(newThread);
                        } else {
                            // TODO: System message.
                            console.error(resultSet.message);
                        }
                    }
                );

                // Don't need to update conversation summary.
                console.log(
                    "Could not set new message type, something went wrong."
                );
            }
        } catch (error) {
            // TODO: handle generative ai blocking it and report it as a toast message... can't do much about sensitive content being requested...
            console.error(error);
        }

        setTypewriter(false);
    }

    if (!thread.messages) return null;

    return (
        <div className="flex flex-col mt-auto">
            {/* {hoveredElementRef.current && (
        <div className="mt-4">
          <h3>Hovered Element Details:</h3>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(hoveredElementRef.current, null, 2)}
          </pre>
        </div>
      )}
      {loading && <p>Loading...</p>} */}

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
