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
import { AudioLines } from "lucide-react";
import React, { memo, useEffect, useState, type FC } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { Button } from "../ui/button";
import { IconGemini, IconUser } from "../ui/icons";

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
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const [currentAudio, setCurrentAudio] = useState<PlayerAPI | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // // console.log(displayedText);
    const { typewriter, setTypewriter } = useAppStore();

    // console.log(message)

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

    async function handleTextToSpeech(text: string) {
        /**
         * 1. Check whether the user is on Web Speech or is using Whisper (if Web Speech then render out web-tts component and pass text...)
         * 2. Check if an audio blob exists for the current message in the database, if so then setCurrentAudio to that in globalAppState.
         * 3. If no audio blob exists fro the current message, request one from whisperAPI and handle the resulting flow (set an error if necessary)
         * 4.
         */

        const res = await requestTTS(text);

        if (res.success) {
            console.log(res.message);
            const { data } = res;
            console.log(data);
        } else {
            console.log(res);
        }
    }

    // console.log("displayedText", displayedText);

    return (
        <AudioProvider>
            <div
                className={cn(
                    "group w-full mb-10 items-start h-full relative flex flex-col overflow-x-hidden transition-all duration-300"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                {...props}>
                <div
                    className={clsx(
                        "flex w-full mb-2",
                        message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                    )}>
                    {message.role === "user" ? (
                        <IconUser className="w-4 h-4" />
                    ) : (
                        <IconGemini className="w-4 h-4 text-red-500" />
                    )}
                </div>
                <div
                    className={cn(
                        "flex size-8 h-auto items-center text-left transition-colors duration-300",
                        message.role === "user"
                            ? "border rounded-lg py-2.5 px-2 border-muted/50 place-self-end w-2/3 shadow backdrop-blur-lg bg-muted/50 "
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
                                            markdown-formatted code. This will
                                            be fixed asap.
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            }>
                            <MemoizedReactMarkdown
                                className="h-full w-full prose dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 text-wrap whitespace-normal markdown prose-p:last:mb-0 prose-p:mb-2"
                                remarkPlugins={[remarkGfm, remarkMath]}
                                components={{
                                    p({ children }) {
                                        return (
                                            <p className="mb-2 last:mb-0">
                                                {children}
                                            </p>
                                        );
                                    },
                                    code({
                                        node,
                                        inline,
                                        className,
                                        children,
                                        ...props
                                    }) {
                                        if (children.length) {
                                            if (children[0] == "▍") {
                                                return (
                                                    <span className="mt-1 cursor-default animate-pulse">
                                                        ▍
                                                    </span>
                                                );
                                            }

                                            children[0] = (
                                                children[0] as string
                                            ).replace("`▍`", "▍");
                                        }

                                        const match = /language-(\w+)/.exec(
                                            className || ""
                                        );

                                        if (inline) {
                                            return (
                                                <code
                                                    className={className}
                                                    {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }

                                        return (
                                            <CodeBlock
                                                key={Math.random()}
                                                language={
                                                    (match && match[1]) || ""
                                                }
                                                value={String(children).replace(
                                                    /\n$/,
                                                    ""
                                                )}
                                                {...props}
                                            />
                                        );
                                    }
                                }}>
                                {displayedText}
                            </MemoizedReactMarkdown>
                        </ErrorBoundary>
                    )}
                </div>

                {/* Audio player component should appear on hover underneath cursor (like a context menu) */}

                {/* <div
                    className={clsx(
                        "transition-opacity duration-300 flex w-full mt-2",
                        isHovered
                        ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                    )}>
                    {currentAudio ? (
                        <>
                            <Button
                                type="button"
                                onClick={() => currentAudio.toggle()}>
                                {currentAudio.playing ? playing : paused}
                            </Button>
                            <AudioPlayer audioBlob={audioBlob} />
                        </>
                    ) : (
                        <Button
                            size="icon"
                            variant="default"
                            className={clsx(
                                "flex gap-x-2 rounded-full h-8 w-8",
                                message.role === "user" ? "ml-auto" : "ml-0"
                            )}
                            onClick={() => handleTextToSpeech(displayedText)}>
                            <AudioLines />
                        </Button>
                    )}
                </div> */}
            </div>
        </AudioProvider>
    );
}

const MemoizedReactMarkdown: FC<Options> = memo(
    ReactMarkdown,
    (prevProps, nextProps) =>
        prevProps.children === nextProps.children &&
        prevProps.className === nextProps.className
);
