// TODO: Edge case, should not be able to play two WebTTS components at the same time... results in buggy behaviour.

// TODO: Adjust system message styling..

// TODO: add automatic scroll to when audio is playing... should following transcript.

// TODO: Error in rendering markdown... not working with external links and code... ?????

// TODO: Memoize markdown

// TODO: clean this up a lot... so many state var... unnecessary

// TODO: instead of tracking cursor positioning, this should track the current position of the read out... I'm going to have to make another provider that just does the highlighting for both WebSpeech and the Whisper Stuff.
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
import {
    getAudioDataByMessageId,
    saveAudioData
} from "@/lib/storage/indexed-db";
import { getTranscription, requestTTS } from "@/lib/storage/openAiApi";
import { useAppStore } from "@/lib/stores/appStore";
import type { AudioData, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { AudioLines, MonitorCog, Pause, Play } from "lucide-react";
import Markdown, { type MarkdownToJSX } from "markdown-to-jsx";
import { nanoid } from "nanoid";
import React, {
    Fragment,
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FC
} from "react";
import { createPortal } from "react-dom";

import { MainPlayButton } from "../audio-player/main-play-button";
import { Button } from "../ui/button";
import { IconGemini, IconUser } from "../ui/icons";
import WebTTS from "../web-tts";

// TODO: functionality change... should I have the audio player hover on the side or be underneath/above the component?

function getWordHighlightClass(startTime, endTime, currentTime) {
    return currentTime >= startTime && currentTime <= endTime
        ? "highlighted"
        : "";
}

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
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);

    const [messageAudioLoading, setMessageAudioLoading] = useState(false);
    // TODO: add another state for transcription loading?

    const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null);

    // const [currentTime, setCurrentTime] = useState(0);

    // refs

    const messageContainerRef = useRef<HTMLDivElement | null>(null);
    const ttsRef = useRef<HTMLDivElement | null>(null);
    // const wordsRef = useRef<
    //     { word: string; start: number; end: number }[] | null
    // >(null);

    // global state

    const { typewriter, setTypewriter, preferencesState } = useAppStore();

    // Context for highlight... TTS should be merged into audio player with a provider for all of this... very ugly at the moment.
    // const [currentCharIndex, setCurrentCharIndex] = useState(0);

    // consts

    const { useWebSpeech } = preferencesState.applicationSettings;

    // const stripPunctuation = (text: string): string => {
    //     return text
    //         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    //         .replace(/\s{2,}/g, " ");
    // };

    // useEffect(() => {
    //     if (currentAudio && currentAudio.transcript) {
    //         wordsRef.current = currentAudio.transcript.words;
    //     }
    // }, []);

    // typewriter... get this working properly... it's just straight without any bounciness.
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

    // TODO: probably shouldn't be tracking this... update according to char index / where we are in the transcript relative to boundingClientRect

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

    // on audio save, update current audio (local state for each message)
    useEffect(() => {
        const fetchAudio = async () => {
            try {
                const audioData: AudioData = await getAudioDataByMessageId(
                    message.id
                );

                if (audioData) {
                    setCurrentAudio(audioData);
                }
            } catch (error) {
                console.warn(
                    `Could not fetch audio data on message with id: ${message.id}`,
                    error
                );
            }
        };

        fetchAudio();
    }, [saveAudioData]);

    const handleConvertMessageToWhisper = async (messageContent: string) => {
        setMessageAudioLoading(true);

        // handle case that you already have an audio item generated for the message.

        try {
            // Step 1: Convert text to audio
            const ttsResult = await requestTTS(messageContent);

            if (!ttsResult.success || !ttsResult.data) {
                console.error(ttsResult.message);
                setMessageAudioLoading(false);
                return;
            }

            const audioBlob = ttsResult.data;

            // TODO: transcript currently not working.

            // Step 2: Get transcription
            const transcriptionResult = await getTranscription(audioBlob);

            if (
                !transcriptionResult.success ||
                !transcriptionResult.transcript
            ) {
                console.error(transcriptionResult.message);
                setMessageAudioLoading(false);
                return;
            }

            const transcript = transcriptionResult.transcript;

            // Step 3: Save audio data and transcription to IndexedDB
            const audioData = {
                audioId: nanoid(),
                messageId: message.id,
                audioBlob: audioBlob,
                transcript: transcript
            };

            // console.log(audioData);

            const saveResult = await saveAudioData(audioData);

            if (!saveResult.success) {
                console.error(saveResult.message);
            } else {
                console.log("Audio data and transcription saved successfully.");
                setCurrentAudio(audioData);
            }
        } catch (error) {
            console.error("An error occurred:", error);
        } finally {
            setMessageAudioLoading(false);
        }
    };

    const handleMouseLeave = () => {
        if (audioIsInProgress) {
            return;
        } else {
            setDisplayAudio(false);
        }
    };

    if (typeof displayedText !== "string") {
        console.error("displayedText is not a string: ", displayedText);
        return null;
    }

    return (
        <AudioProvider>
            <div
                id={`message-container-${message.id}`}
                ref={messageContainerRef}
                className={cn(
                    "group w-full mb-10 items-start h-auto relative flex flex-col overflow-x-hidden transition-all duration-300 max-w-full"
                )}
                onMouseEnter={() => setDisplayAudio(true)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={debouncedMouseMove}
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

                    {currentAudio && !useWebSpeech && (
                        <MainPlayButton
                            audioBlob={currentAudio.audioBlob}
                            setShowAudioPlayer={setShowAudioPlayer}
                            title="Start Audio Player"
                            className="mr-auto flex-start mb-2 rounded-full"
                            playing={
                                <>
                                    <Pause className="h-3 w-3 fill-current" />
                                    {/* <span aria-hidden="true">Listen</span> */}
                                </>
                            }
                            paused={
                                <>
                                    <Play className="h-3 w-3 fill-current" />
                                    {/* <span aria-hidden="true">Listen</span> */}
                                </>
                            }
                        />
                    )}

                    {!useWebSpeech && (
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Convert message to audio with Whisper"
                            className="transition-transform hover:scale-105 duration-300 mb-2"
                            disabled={!whisperApiKey || messageAudioLoading}
                            onClick={() => {
                                handleConvertMessageToWhisper(displayedText);
                            }}>
                            <AudioLines className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <div
                    className={cn(
                        messageAudioLoading &&
                            "animate-pulse opacity-50 pointer-events-none",
                        "flex size-8 h-auto items-center text-left transition-colors duration-300 relative",
                        message.role === "user" || message.role === "system"
                            ? "border rounded-lg py-2.5 px-2 border-muted/50 place-self-end w-2/3 shadow backdrop-blur-lg bg-muted/50 flex-col"
                            : "place-self-start w-full"
                    )}>
                    {messageAudioLoading && (
                        <>
                            <p className="absolute -top-[32px] text-muted-foreground left-6">
                                Generating audio...
                            </p>
                            <div className="absolute h-full w-full flex bg-black/75 animate-pulse" />
                        </>
                    )}
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
                            <div
                                id={`text-content-${message.id}`}
                                className="h-full w-full prose dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 text-wrap whitespace-normal prose-p:last:mb-0 prose-p:mb-2">
                                <MemoizedMarkdown>
                                    {displayedText}
                                </MemoizedMarkdown>
                            </div>
                        </ErrorBoundary>
                    )}
                </div>

                {currentAudio && !useWebSpeech && showAudioPlayer && (
                    <>
                        {createPortal(
                            <div
                                ref={ttsRef}
                                className={clsx(
                                    "absolute right-1 z-[1000] transition-all duration-300 ease-in-out"
                                )}
                                style={{
                                    top: audioPlayerTopPosition,
                                    transform: "translateY(-10%)"
                                }}>
                                <AudioPlayer
                                    showAudioPlayer={setShowAudioPlayer}
                                />
                            </div>,
                            document.getElementById(
                                `message-container-${message.id}`
                            )
                        )}
                    </>
                )}

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
                                    languageId={
                                        preferencesState.applicationSettings
                                            .translateToLanguage.value.id
                                    }
                                />
                            </div>,
                            document.getElementById(
                                `message-container-${message.id}`
                            )
                        )}
                    </>
                )}
            </div>
        </AudioProvider>
    );
}

const MemoizedMarkdown = memo(
    ({
        children,
        options,
        ...props
    }: {
        [key: string]: any;
        children: string;
        options?: MarkdownToJSX.Options;
    }) => {
        return (
            <Markdown
                options={{
                    overrides: {
                        p: {
                            component: ({ children, ...props }) => {
                                return <p {...props}>{children}</p>;
                            },
                            props: {
                                className: "mb-2 last:mb-0"
                            }
                        },
                        code: {
                            component: ({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                            }) => {
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
                                    // children[0] = (
                                    //     children[0] as string
                                    // ).replace("` `", " ");
                                }

                                const match = /language-(\w+)/.exec(
                                    className || ""
                                );

                                if (inline) {
                                    return (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }

                                return (
                                    <CodeBlock
                                        key={Math.random()}
                                        language={(match && match[1]) || ""}
                                        value={String(children).replace(
                                            /\n$/,
                                            ""
                                        )}
                                        {...props}
                                    />
                                );
                            }
                        }
                    }
                }}>
                {children}
            </Markdown>
        );
    }
);

// const MemoizedReactMarkdown: FC<Options> = memo(
//     ReactMarkdown,
//     (prevProps, nextProps) => {
//         return (
//             prevProps.children === nextProps.children &&
//             prevProps.className === nextProps.className
//         );
//     }
// );
