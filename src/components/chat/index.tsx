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

    // handle forwarded messages from background script.
    useEffect(() => {
        const handleMessage = (message) => {
            if (message.action === "hoverElement") {
                hoveredElementRef.current = message.element;
                // console.log("Hovered Element: ", hoveredElementRef.current)
            } else if (message.action === "contextOption") {
                hoveredElementRef.current = message.element;
                setContextOption(message.option);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    useEffect(() => {
        if (contextOption && hoveredElementRef.current) {
            // push context option and all associated element details to Gemini, then wait for a response/suggested fix.
            handleContextOption(contextOption, hoveredElementRef.current);
        }
    }, [contextOption]);

    const handleContextOption = async (
        option: ContextOption,
        element: HTMLElement
    ) => {
        switch (option) {
            case "read":
                // Send a prompt to LLM to read aloud the element's text content
                console.log("Read Aloud:", element.textContent);
                break;
            case "summarize":
                // Send a prompt to LLM to summarize the element's text content
                console.log("Summarize:", element.textContent);
                break;

            case "simplify":
                // TODO: this should be pushed into the thread as a new message.
                console.log("Simplify", element.textContent);
                if (element.textContent) {
                    const prompt = `Simplify the following text content from a section in a website making sure you return the new text content in the same format as the received text content. If you cannot find a reasonable solution for simplification, just return back the original and add the following to the start of the message back: <simplification_not_available>. The text content is as follows: ${element.textContent}. `;
                    const simplifiedText = await fetchData(prompt);
                    if (simplifiedText) {
                        updateElementText(element.id, simplifiedText);
                    } else {
                        console.log("No simplified text, error");
                    }
                } else {
                    console.log("No text content in element");
                }
                break;

            case "translate":
                // Send a prompt to LLM to translate the element's text content
                console.log("Translate:", element.textContent);
                break;
            default:
                break;
        }
    };

    const updateElementText = (elementId: string, newText: string) => {
        console.log("Element Id: ", elementId);
        console.log("Simplified text: ", newText);
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = newText;
        }
    };

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

            return text;

            // const combinedText = text
            //     .split("\n")
            //     .filter((paragraph) => paragraph.trim().length > 0)
            //     .join("\n\n");
        } catch (err) {
            console.error(err);
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

            if (aiResponse) {
                const newGeminiMessage: Message = {
                    role: "assistant",
                    content: aiResponse,
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
                    aiResponse
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

            if (aiResponse) {
                const newGeminiMessage: Message = {
                    role: "assistant",
                    content: aiResponse,
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
                            console.error(resultSet.message);
                        }
                    }
                );

                await updateConversationSummary(
                    thread.threadId,
                    currentSummary,
                    aiResponse
                );
            } else {
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
