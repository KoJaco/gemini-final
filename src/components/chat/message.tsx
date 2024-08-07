"use client";

// import { useAppStore } from "@/lib/stores/appStore"
// import { useAppStore } from "@/lib/stores/appStore"
import { AudioPlayer } from "@/components/audio-player/audio-player";
import ErrorBoundary from "@/components/errors/ErrorBoundary";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle
} from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/codeblock";
import {
    AudioProvider,
    useAudioPlayer,
    type PlayerAPI
} from "@/lib/providers/audio-provider";
import { requestTTS } from "@/lib/storage/openAiApi";
import { useAppStore } from "@/lib/stores/appStore";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { AudioLines, MonitorCog } from "lucide-react";
import React, { memo, useEffect, useRef, useState, type FC } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { Button } from "../ui/button";
import { IconGemini, IconUser } from "../ui/icons";
import WebTTS from "../web-tts";

// TODO: functionality change... should I have the audio player hover on the side or be underneath/above the component?

export interface ChatMessageProps {
    message: Message;
    speed?: number;
}

// TODO: Implement error message display (destructive card).
export function ChatMessage({
    message,
    speed = 10,
    ...props
}: ChatMessageProps) {
    // global state
    const { whisperApiKey } = useAppStore();

    // local State
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [audioPlayerTopPosition, setAudioPlayerTopPosition] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [displayAudio, setDisplayAudio] = useState(false);
    const [audioIsInProgress, setAudioIsInProgress] = useState(false);
    const [messageAudioLoading, setMessageAudioLoading] = useState(false);

    const [currentAudio, setCurrentAudio] = useState<PlayerAPI | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const messageContainerRef = useRef<HTMLDivElement | null>(null);
    const ttsRef = useRef<HTMLDivElement | null>(null);

    const { typewriter, setTypewriter, preferencesState } = useAppStore();

    const { useWebSpeech } = preferencesState.applicationSettings;

    useEffect(() => {
        if (typewriter) {
            if (message.content.length > 256 && message.role === "user") {
                setDisplayedText(message.content);
            } else if (currentIndex < message.content.length) {
                const randomSpeed =
                    Math.floor(Math.random() * (speed + 30 - (speed + 8))) +
                    (speed - 8);

                const timeout = setTimeout(() => {
                    setDisplayedText(
                        (prevText) => prevText + message.content[currentIndex]
                    );
                    setCurrentIndex((prevIndex) => prevIndex + 1);
                }, randomSpeed);

                return () => {
                    setTypewriter(false);
                    clearTimeout(timeout);
                };
            }
        } else {
            setDisplayedText(message.content);
        }
    }, [currentIndex, speed, message]);

    // async function handleTextToSpeech(text: string) {
    //     /**
    //      * 1. Check whether the user is on Web Speech or is using Whisper (if Web Speech then render out web-tts component and pass text...)
    //      * 2. Check if an audio blob exists for the current message in the database, if so then setCurrentAudio to that in globalAppState.
    //      * 3. If no audio blob exists fro the current message, request one from whisperAPI and handle the resulting flow (set an error if necessary)
    //      * 4.
    //      */

    //     const res = await requestTTS(text);

    //     if (res.success) {
    //         const { data } = res;
    //     } else {
    //         console.log(res);
    //     }
    // }

    // TODO: make this a hook...

    function debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;

        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    const handleMouseMove = (event: React.MouseEvent) => {
        const messageContainer = messageContainerRef.current;
        const tts = ttsRef.current;

        if (messageContainer && tts) {
            if (tts.contains(event.target as Node)) {
                return;
            }

            const top = event.clientY;
            const position =
                top - messageContainerRef.current.getBoundingClientRect().top;

            setAudioPlayerTopPosition(position);
        }
    };

    const debouncedMouseMove = debounce(handleMouseMove, 50);

    const handleConvertMessageToWhisper = async (messageContent: string) => {};

    const handleMouseLeave = () => {
        if (audioIsInProgress) {
            return;
        } else {
            setDisplayAudio(false);
        }
    };
    // TODO: Edge case, should not be able to play two WebTTS components at the same time... results in buggy behaviour.

    // TODO: Adjust system message styling..

    // TODO: add automatic scroll to when audio is playing... should following transcript.

    return (
        // <AudioProvider>
        <div
            id={`message-container-${message.id}`}
            ref={messageContainerRef}
            className={cn(
                "group w-full mb-10 items-start h-auto relative flex flex-col overflow-x-hidden transition-all duration-300"
            )}
            onMouseEnter={() => setDisplayAudio(true)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={debouncedMouseMove}
            // onMouseMove={handleMouseMove}
            style={{ overflow: "visible" }}
            {...props}>
            <div className="flex justify-between w-full items-center gap-x-4">
                <div
                    className={clsx(
                        "flex w-full mb-2",
                        message.role === "user" || message.role === "system"
                            ? "justify-end"
                            : "justify-start"
                    )}>
                    {message.role === "user" && (
                        <IconUser className="w-4 h-4" />
                    )}
                    {message.role === "assistant" && (
                        <IconGemini className="w-4 h-4 text-red-500" />
                    )}
                    {message.role === "system" && (
                        <MonitorCog className="w-4 h-4 text-orange-500" />
                    )}
                </div>

                <Button
                    size="icon"
                    variant="ghost"
                    title="Convert message to audio with Whisper"
                    className={clsx(
                        "transition-transform hover:scale-105 duration-300 mb-2",
                        !useWebSpeech ? "opacity-100" : "opacity-0"
                    )}
                    disabled={!whisperApiKey}
                    onClick={() => {
                        handleConvertMessageToWhisper(displayedText);
                    }}>
                    <AudioLines className="w-4 h-4" />
                </Button>
            </div>
            <div
                className={cn(
                    "flex size-8 h-auto items-center text-left transition-colors duration-300",
                    message.role === "user" || message.role === "system"
                        ? "border rounded-lg py-2.5 px-2 border-muted/50 place-self-end w-2/3 shadow backdrop-blur-lg bg-muted/50 flex-col"
                        : "place-self-start w-full"
                )}>
                {message.role === "ai-error" ? (
                    <Card className="border-destructive-foreground/20 border bg-destructive/50 rounded-lg prose dark:prose-invert prose-p:leading-relaxed w-full h-auto overflow-hidden flex">
                        <CardContent className="space-y-4 w-full text-wrap flex-wrap">
                            <CardTitle className="text-sm">
                                Generative AI Error
                            </CardTitle>
                            <CardDescription className="w-full text-wrap truncate flex flex-wrap whitespace-normal break-all">
                                {displayedText}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ) : (
                    <ErrorBoundary
                        fallback={
                            <Card className="border-destructive-foreground/20 border bg-destructive/50 rounded-lg prose dark:prose-invert prose-p:leading-relaxed">
                                <CardContent className="space-y-4">
                                    <CardTitle className="text-sm">
                                        Uh oh! Something went wrong.
                                    </CardTitle>
                                    <CardDescription>
                                        There is a known bug in parsing
                                        markdown-formatted code. This will be
                                        fixed asap.
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        }>
                        <div
                            id={`text-content-${message.id}`}
                            className="h-full w-full prose dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 text-wrap whitespace-normal markdown prose-p:last:mb-0 prose-p:mb-2">
                            <MemoizedReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                components={{
                                    p({ children }) {
                                        return (
                                            <p
                                                id="text-content"
                                                className="mb-2 last:mb-0">
                                                {children}
                                            </p>
                                        );
                                    }
                                    // code({
                                    //     node,
                                    //     inline,
                                    //     className,
                                    //     children,
                                    //     ...props
                                    // }) {
                                    //     if (children.length) {
                                    //         if (children[0] == "▍") {
                                    //             return (
                                    //                 <span className="mt-1 cursor-default animate-pulse">
                                    //                     ▍
                                    //                 </span>
                                    //             );
                                    //         }

                                    //         children[0] = (
                                    //             children[0] as string
                                    //         ).replace("`▍`", "▍");
                                    //     }

                                    //     const match = /language-(\w+)/.exec(
                                    //         className || ""
                                    //     );

                                    //     if (inline) {
                                    //         return (
                                    //             <code
                                    //                 className={className}
                                    //                 {...props}>
                                    //                 {children}
                                    //             </code>
                                    //         );
                                    //     }

                                    //     return (
                                    //         <CodeBlock
                                    //             key={Math.random()}
                                    //             language={
                                    //                 (match && match[1]) ||
                                    //                 ""
                                    //             }
                                    //             value={String(
                                    //                 children
                                    //             ).replace(/\n$/, "")}
                                    //             {...props}
                                    //         />
                                    //     );
                                    // }
                                }}>
                                {displayedText}
                            </MemoizedReactMarkdown>
                        </div>
                    </ErrorBoundary>
                )}
            </div>

            {useWebSpeech && displayAudio && (
                <>
                    {createPortal(
                        <div
                            ref={ttsRef}
                            className={clsx(
                                "absolute right-0 z-[1000] transition-all duration-300 ease-in-out",
                                displayAudio ? "opacity-100" : "opacity-0"
                            )}
                            style={{
                                top: audioPlayerTopPosition,
                                transform: "translateY(-10%)"
                            }}>
                            <WebTTS
                                messageId={message.id}
                                text={displayedText}
                                audioInProgress={audioIsInProgress}
                                setAudioInProgress={setAudioIsInProgress}
                                displayAudioPlayer={setDisplayAudio}
                            />
                        </div>,
                        document.getElementById(
                            `message-container-${message.id}`
                        )
                    )}
                </>
            )}
        </div>
        // </AudioProvider>
    );
}

const MemoizedReactMarkdown: FC<Options> = memo(
    ReactMarkdown,
    (prevProps, nextProps) =>
        prevProps.children === nextProps.children &&
        prevProps.className === nextProps.className
);
