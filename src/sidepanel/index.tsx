import "@/style.css";

import { ApiEntryForm } from "@/components/forms/api-entry-form";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WebTTS from "@/components/web-tts";
import { defaultPreferences } from "@/lib/constants";
import { useScrollAnchor } from "@/lib/hooks/use-scroll-anchor";
import { Providers } from "@/lib/providers";
import { createNewChatThread, getLatestThread } from "@/lib/storage/indexed-db";
import {
    getApiKey,
    getPreferences,
    removeApiKey,
    savePreferences
} from "@/lib/storage/secure";
import { useAppStore } from "@/lib/stores/appStore";
import type { AvailableViews, ChatThread } from "@/lib/types";
import clsx from "clsx";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";

import { sendToBackground } from "@plasmohq/messaging";
import { useStorage } from "@plasmohq/storage/hook";

import SidepanelFooter from "./footer";
import { MainView, PreferencesView, ThreadsView } from "./views";

const Sidepanel = () => {
    // States
    const [enabled, setEnabled] = useState(false);
    const [currentChatThread, setCurrentChatThread] =
        useState<ChatThread | null>(null);
    const [currentView, setCurrentView] = useState<AvailableViews>("main");

    const [loading, setLoading] = useState(true);
    const [apiKeysLoading, setApiKeysLoading] = useState(false);
    const [error, setError] = useState({ display: false, message: "" });

    const {
        messagesRef,
        scrollRef,
        visibilityRef,
        isAtBottom,
        scrollToBottom
    } = useScrollAnchor();

    const {
        geminiApiKey,
        setGeminiApiKey,
        whisperApiKey,
        setWhisperAPIKey,
        savePreferencesState
    } = useAppStore();

    useEffect(() => {
        const initApp = async () => {
            try {
                setLoading(true);
                // fetch api keys
                const geminiResponse = await getApiKey("googleGeminiApiKey");
                const whisperResponse = await getApiKey("whisperApiKey");

                if (geminiResponse.success && geminiResponse.data) {
                    setGeminiApiKey(geminiResponse.data);
                } else {
                    // handle this accordingly, user cannot interact with application... push to form
                    console.error(geminiResponse.error);
                }

                if (whisperResponse.success && whisperResponse.data) {
                    setWhisperAPIKey(whisperResponse.data);
                } else {
                    // (optional) so can continue
                    setWhisperAPIKey(null);
                }

                // fetch latest thread (Current Chat)
                const latestThread = await getLatestThread();

                if (latestThread !== undefined) {
                    setCurrentChatThread(latestThread);
                } else {
                    // create new thread and set
                    const id = nanoid();
                    const newThread: ChatThread = {
                        threadId: id,
                        messages: [
                            {
                                role: "assistant",
                                content:
                                    "Hey! I'm your personal AI assistant trying to make the web a more accessible place for all. Ask me anything!",
                                id: `msg-open`,
                                createdAt: new Date().toISOString(),
                                threadId: id
                            }
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    const res = await createNewChatThread(newThread);

                    if (res.success) {
                        setCurrentChatThread(newThread);
                    } else {
                        console.log(res.message);
                    }
                }

                // fetch preferences

                const preferencesResponse = await getPreferences();

                if (preferencesResponse.success && preferencesResponse.data) {
                    savePreferencesState(preferencesResponse.data);
                } else {
                    console.warn(
                        "No preferences found, using defaults: ",
                        preferencesResponse.error
                    );
                    savePreferences(defaultPreferences);
                }
            } catch (error) {
                console.error("Error during initialization: ", error);
                setError({ display: true, message: (error as Error).message });
            } finally {
                setLoading(false);
            }
        };

        initApp();
    }, [
        geminiApiKey,
        whisperApiKey,
        savePreferencesState,
        setCurrentChatThread
    ]);

    function renderCurrentView() {
        switch (currentView) {
            case "main":
                return (
                    <MainView
                        currentChatThread={currentChatThread}
                        setCurrentChatThread={setCurrentChatThread}
                        isAtBottom={isAtBottom}
                        scrollToBottom={scrollToBottom}
                        messagesRef={messagesRef}
                        scrollRef={scrollRef}
                        visibilityRef={visibilityRef}
                    />
                );

            case "all-threads":
                return (
                    <ThreadsView
                        setOpenView={setCurrentView}
                        currentThread={currentChatThread}
                        setCurrentThread={setCurrentChatThread}
                    />
                );

            case "preferences":
                return <PreferencesView setOpenView={setCurrentView} />;

            default:
                return (
                    <MainView
                        currentChatThread={currentChatThread}
                        setCurrentChatThread={setCurrentChatThread}
                        isAtBottom={isAtBottom}
                        scrollToBottom={scrollToBottom}
                        messagesRef={messagesRef}
                        scrollRef={scrollRef}
                        visibilityRef={visibilityRef}
                    />
                );
        }
    }

    const openWelcomePage = () => {
        const tabUrl = chrome.runtime.getURL("tabs/welcome.html");
        chrome.tabs.create({ url: tabUrl });
    };

    // TODO: add skeleton

    if (currentChatThread === null) {
        // TODO: Add loading skeleton or spinner.
        return <p>Loading...</p>;
    }

    return (
        <Providers>
            <div className="flex flex-col w-full h-[100vh] max-h-[100vh] pt-4 overflow-x-hidden bg-gradient-to-b from-background to-background/50">
                {geminiApiKey ? (
                    <div className="flex flex-col h-full w-full">
                        <header className="px-4 mb-4 flex-col flex">
                            <h1 className="text-lg text-left">Gemini Helper</h1>
                        </header>

                        {/* main content */}
                        {renderCurrentView()}

                        <SidepanelFooter
                            currentView={"main"}
                            setCurrentView={setCurrentView}
                            setCurrentChatThread={setCurrentChatThread}
                        />
                    </div>
                ) : (
                    <div className="p-4 h-full">
                        {apiKeysLoading ? (
                            <div className="h-full shadow-lg flex flex-col gap-y-8 justify-between overflow-hidden">
                                <Skeleton className="w-1/2 h-10 rounded-md" />
                                <div className="flex flex-col space-y-2 w-full">
                                    <Skeleton className="w-20 h-8 rounded-md" />

                                    <Skeleton className="w-full h-20 rounded-md" />
                                </div>
                                <div className="mt-auto flex">
                                    <div className="flex flex-col gap-y-4">
                                        <div className="flex gap-x-2">
                                            <Skeleton className="rounded-full w-8 h-8" />
                                            <Skeleton className="rounded-full w-8 h-8" />
                                        </div>
                                        <div className="max-w-max flex w-full gap-x-4">
                                            <Skeleton className="h-20 w-[200px]" />
                                            <Skeleton className="h-20 w-[200px]" />
                                        </div>
                                        <Skeleton className="h-32 w-full" />
                                        <div className="border-t border-muted pt-4">
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Card className="shadow-lg w-full h-auto">
                                <CardHeader className="mb-4">
                                    <CardTitle className="capitalize text-2xl font-bold mb-4">
                                        Setup you API keys
                                    </CardTitle>

                                    <CardDescription>
                                        <span className="mb-4">
                                            Lorem ipsum dolor, sit amet
                                            consectetur adipisicing elit.
                                            Similique modi odit reprehenderit
                                            facilis assumenda architecto
                                        </span>
                                        {error.display && (
                                            <span className="text-red-500 mb-4 whitespace-normal w-full">
                                                {error.message}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <ApiEntryForm
                                        geminiApiKey={geminiApiKey}
                                        setGeminiKey={setGeminiApiKey}
                                        setWhisperApiKey={setWhisperAPIKey}
                                        setApiKeysLoading={setApiKeysLoading}
                                        setError={setError}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </Providers>
    );
};

export default Sidepanel;
