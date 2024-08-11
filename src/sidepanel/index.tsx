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
import type { AvailableViews, ChatThread, Message } from "@/lib/types";
import { CircleHelp, Mic } from "lucide-react";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";

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
        preferencesState,
        savePreferencesState,
        recording
    } = useAppStore();

    useEffect(() => {
        const initDefaults = async () => {
            try {
                if (preferencesState !== null) return;

                if (currentChatThread !== null) return;

                // fetch latest thread (Current Chat)
                const latestThread = await getLatestThread();

                if (latestThread !== undefined) {
                    setCurrentChatThread(latestThread);
                    console.log(
                        "Set initial chat thread as the latest found: ",
                        latestThread
                    );
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
                        console.error(
                            "Something went wrong while attempting to set an initial chat thread: ",
                            res
                        );
                    }
                }

                // fetch preferences

                const preferencesResponse =
                    await savePreferences(defaultPreferences);

                if (preferencesResponse.success) {
                    savePreferencesState(defaultPreferences);
                } else {
                    console.error(
                        "Could not set default preferences, something went wrong! ",
                        preferencesResponse
                    );
                }
            } catch (error) {
                console.error(error);
            }
        };

        initDefaults();
    }, []);

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
                    console.warn(geminiResponse.error);
                    return; // return out before other functions complete
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
                        console.error(res.message);
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
        setCurrentChatThread,
        recording
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

    if (!currentChatThread) {
        return (
            <div className="flex flex-col w-full h-[100vh] max-h-[100vh] pt-4 overflow-x-hidden bg-gradient-to-b from-background to-background/50">
                <p>
                    No current chat thread, try closing and opening the
                    extension.
                </p>
            </div>
        );
    }

    return (
        <Providers>
            <div className="flex flex-col w-full h-[100vh] max-h-[100vh] pt-4 overflow-x-hidden bg-gradient-to-b from-background to-background/50">
                {geminiApiKey ? (
                    <div className="flex flex-col h-full w-full relative">
                        <header className="px-4 mb-4 items-center justify-between flex">
                            <h1 className="text-lg text-left">Companion</h1>
                            <div>
                                <Button
                                    size="icon"
                                    title="Open Welcome Page"
                                    variant="ghost"
                                    onClick={() => openWelcomePage()}>
                                    <CircleHelp className="w-5 h-5" />
                                </Button>
                            </div>
                        </header>

                        {/* recording for prompt voice commands */}
                        {!preferencesState.applicationSettings
                            .useVoiceCommandsOnHoverMode &&
                            recording && (
                                <div className="absolute z-[1000] -top-4 bottom-16 w-full left-0 bg-black/75">
                                    <div className="flex items-center justify-center w-full h-full">
                                        <div className="w-full h-auto flex items-center justify-center pb-6">
                                            <button
                                                title="Stop Recording Voice Command"
                                                className="relative w-16 h-16 flex items-center justify-center bg-[#ef4444] rounded-full focus:outline-none">
                                                <span className="absolute w-20 h-20 rounded-full bg-[#ef4444] opacity-25 animate-ping"></span>
                                                <Mic className="h-8 w-8 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {preferencesState.applicationSettings
                            .useVoiceCommandsOnHoverMode &&
                            recording && (
                                <div className="absolute z-[1000] -top-4 bottom-16 w-full left-0 bg-black/75">
                                    <div className="flex items-center justify-center w-full h-full">
                                        <div className="w-full h-auto flex items-center justify-center pb-6">
                                            <div className="flex flex-col items-center bg-background border border-muted/50 backdrop-blur-lg p-4 rounded-lg shadow">
                                                <div className="relative w-16 h-16 flex items-center justify-center bg-muted-foreground rounded-full focus:outline-none animate-pulse">
                                                    {/* <span className="absolute w-20 h-20 rounded-full bg-muted-foreground opacity-25 animate-ping"></span> */}
                                                    <Mic className="h-8 w-8 text-background" />
                                                </div>
                                                <h2 className="mt-[20px]">
                                                    Listening for Speech...
                                                </h2>
                                                <p className="mt-[10px] max-w-[200px] text-center text-muted-foreground">
                                                    Try hovering over something
                                                    in your current website.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                            This step is only required while the
                                            application is in development.
                                            Please see the timeline in the app's
                                            welcome page to get an idea of the
                                            improvements and features that are
                                            on the way.
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
