// TODO: Refactor this. too many state variables.
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
import type { AudioData, Message, Transcript } from "@/lib/types";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { AudioLines, Highlighter, MonitorCog, Pause, Play } from "lucide-react";
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
    const { whisperApiKey, typewriter, setTypewriter, preferencesState } =
        useAppStore();

    // is this all we need?
    const { useWebSpeech } = preferencesState.applicationSettings;

    // message text tracking
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    // temp var
    const [toggleTranscript, setToggleTranscript] = useState(false);

    // audio
    const [audioPlayerTopPosition, setAudioPlayerTopPosition] = useState(0);
    const [audioIsInProgress, setAudioIsInProgress] = useState(false);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null);

    // loading state
    const [messageAudioLoading, setMessageAudioLoading] = useState(false);

    // refs
    const messageContainerRef = useRef<HTMLDivElement | null>(null);
    const ttsRef = useRef<HTMLDivElement | null>(null);

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

    if (typeof displayedText !== "string") {
        console.error("displayedText is not a string: ", displayedText);
        return null;
    }

    return (
        <AudioProvider
            transcript={currentAudio?.transcript || null}
            renderedText={displayedText || null}
            messageId={message.id}>
            <div
                id={`message-container-${message.id}`}
                ref={messageContainerRef}
                className={cn(
                    "group w-full mb-10 items-start h-auto relative flex flex-col overflow-x-hidden transition-all duration-300 max-w-full"
                )}
                // onMouseEnter={() => setDisplayAudio(true)}
                // onMouseLeave={handleMouseLeave}
                onMouseMove={debouncedMouseMove}
                style={{ overflow: "visible" }}
                {...props}>
                <div className="flex justify-between w-full items-center gap-x-2">
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
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                title="Activate Highlight Mode"
                                onClick={() =>
                                    // setDisplayedText(
                                    //     preprocessMarkdown(displayedText)
                                    // )
                                    setToggleTranscript(!toggleTranscript)
                                }
                                className={clsx(
                                    "mb-2 px-2 hover:scale-105",
                                    toggleTranscript ? "bg-secondary" : ""
                                )}>
                                <Highlighter className="w-4 h-4" />
                            </Button>
                            <MainPlayButton
                                audioBlob={currentAudio.audioBlob}
                                setShowAudioPlayer={setShowAudioPlayer}
                                title="Start Audio Player"
                                className="mr-auto flex-start mb-2 rounded-full px-3 hover:scale-105"
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
                        </>
                    )}

                    {!useWebSpeech && (
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Convert message to audio with Whisper"
                            className="transition-transform hover:scale-105 duration-300 mb-2 px-2"
                            disabled={!whisperApiKey || messageAudioLoading}
                            onClick={() => {
                                handleConvertMessageToWhisper(displayedText);
                            }}>
                            <AudioLines className="w-4 h-4" />
                        </Button>
                    )}

                    {useWebSpeech && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="transition-transform hover:scale-105 duration-300 mb-2 px-2"
                            onClick={() => {
                                if (audioIsInProgress) {
                                    setAudioIsInProgress(false);
                                    setShowAudioPlayer(false);
                                } else {
                                    setShowAudioPlayer(true);
                                    setAudioIsInProgress(true);
                                }
                            }}>
                            <Play className="h-3 w-3 fill-current" />
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
                                className="relative h-full w-full prose dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 text-wrap whitespace-normal prose-p:last:mb-0 prose-p:mb-2"
                                style={{
                                    background:
                                        "linear-gradient(to right, yellow 0%, yellow 50%, transparent 50%)",
                                    backgroundSize: "200% 100%",
                                    backgroundPosition: "right",
                                    transition:
                                        "background-position 0.5s ease-out"
                                }}>
                                <MemoizedMarkdown>
                                    {displayedText}
                                </MemoizedMarkdown>

                                {/* {toggleTranscript ? (
                                    currentAudio ? (
                                        <MemoizedMarkdownHighlight
                                            transcript={currentAudio.transcript}
                                            markdown={displayedText}
                                        />
                                    ) : (
                                        <MemoizedMarkdown>
                                            {displayedText}
                                        </MemoizedMarkdown>
                                    )
                                ) : (
                                    <MemoizedMarkdown>
                                        {displayedText}
                                    </MemoizedMarkdown>
                                )} */}
                                <div
                                    id="highlight-overlay"
                                    className="absolute bg-yellow-300 opacity-50 rounded-md"
                                />
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

                {useWebSpeech && showAudioPlayer && (
                    <>
                        {createPortal(
                            <div
                                ref={ttsRef}
                                className={clsx(
                                    "absolute right-0 z-[1000] transition-all duration-300 ease-in-out",
                                    showAudioPlayer
                                        ? "opacity-100"
                                        : "opacity-0"
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
                                    setShowAudioPlayer={setShowAudioPlayer}
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

// // TODO: Could not get accurate word and segment-level highlighting done in time... I'm kinda lost with how to do it using the markdown renderer...

// const TranscriptHighlight: FC<{
//     transcript: Transcript | Partial<Transcript>;
// }> = ({ transcript }) => {
//     const { currentTimeRef } = useAudioPlayer();
//     const wordsRef = useRef<HTMLSpanElement[]>([]);

//     useEffect(() => {
//         const highlightActiveWord = () => {
//             const currentTime = currentTimeRef.current;
//             const activeWordIndex = transcript.words.findIndex(
//                 (word) => word.start <= currentTime && word.end >= currentTime
//             );

//             wordsRef.current.forEach((wordElement, index) => {
//                 if (wordElement) {
//                     wordElement.style.fontWeight =
//                         index === activeWordIndex ? "bold" : "normal";
//                     wordElement.style.backgroundColor =
//                         index === activeWordIndex ? "#b91c1c" : "";
//                     wordElement.style.color =
//                         index === activeWordIndex ? "#fef2f2" : "";
//                     // wordElement.style.paddingLeft =
//                     //     index === activeWordIndex ? "1px" : "";
//                     // wordElement.style.paddingRight =
//                     //     index === activeWordIndex ? "1px" : "";
//                 }
//             });
//         };

//         const intervalId = setInterval(highlightActiveWord, 25);

//         return () => clearInterval(intervalId);
//     }, [transcript, currentTimeRef]);

//     return (
//         <div className="max-w-full whitespace-normal break-all">
//             {transcript.words.map((word, index) => (
//                 <span
//                     key={index}
//                     ref={(el) => (wordsRef.current[index] = el!)}
//                     className="mr-1 rounded-sm transition-all duration-100">
//                     {word.word}
//                 </span>
//             ))}
//         </div>
//     );
// };

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
                        span: {
                            component: ({ children, ...props }) => {
                                return <span {...props}>{children}</span>;
                            },
                            props: {
                                className: "px-1 rounded-md last:mb-0"
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

// const MemoizedMarkdown = memo(
//     ({
//         children,
//         options,
//         ...props
//     }: {
//         [key: string]: any;
//         children: string;
//         options?: MarkdownToJSX.Options;
//     }) => {
//         return (
//             <Markdown
//                 options={{
//                     overrides: {
//                         p: {
//                             component: ({ children, ...props }) => {
//                                 return <p {...props}>{children}</p>;
//                             },
//                             props: {
//                                 className: "mb-2 last:mb-0"
//                             }
//                         },
//                         span: {
//                             component: ({ children, ...props }) => {
//                                 return <span {...props}>{children}</span>;
//                             },
//                             props: {
//                                 className: "px-1 rounded-md last:mb-0"
//                             }
//                         },
//                         code: {
//                             component: ({
//                                 node,
//                                 inline,
//                                 className,
//                                 children,
//                                 ...props
//                             }) => {
//                                 if (children.length) {
//                                     if (children[0] == "▍") {
//                                         return (
//                                             <span className="mt-1 cursor-default animate-pulse">
//                                                 ▍
//                                             </span>
//                                         );
//                                     }

//                                     children[0] = (
//                                         children[0] as string
//                                     ).replace("`▍`", "▍");
//                                     // children[0] = (
//                                     //     children[0] as string
//                                     // ).replace("` `", " ");
//                                 }

//                                 const match = /language-(\w+)/.exec(
//                                     className || ""
//                                 );

//                                 if (inline) {
//                                     return (
//                                         <code className={className} {...props}>
//                                             {children}
//                                         </code>
//                                     );
//                                 }

//                                 return (
//                                     <CodeBlock
//                                         key={Math.random()}
//                                         language={(match && match[1]) || ""}
//                                         value={String(children).replace(
//                                             /\n$/,
//                                             ""
//                                         )}
//                                         {...props}
//                                     />
//                                 );
//                             }
//                         }
//                     }
//                 }}>
//                 {children}
//             </Markdown>
//         );
//     }
// );
