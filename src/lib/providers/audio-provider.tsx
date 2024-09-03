import { type Audio, type Transcript } from "@/lib/types";
import { ConstructionIcon } from "lucide-react";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState
} from "react";

interface PlayerState {
    playing: boolean;
    muted: boolean;
    duration: number;
    currentTime: number;
    audio: Audio | null;
    audioBlob: Blob | null;
}

type WordMapping = {
    normalized: string;
    original: string;
};

type RangeInfo = {
    range: Range;
    original: string;
    start?: number;
    end?: number;
};

type NodeInfo = {
    id: string;
    text: string;
    top: number;
    right: number;
    bottom: number;
    left: number;
    start?: number;
    end?: number;
    ranges: RangeInfo[];
};

type WordPosition = {
    word: string;
    start: number;
    end: number;
    spans: number;
    textNodeId: string;
};

interface PublicPlayerActions {
    play: (audio?: Audio, audioBlob?: Blob) => void;
    pause: () => void;
    toggle: (audio?: Audio, audioBlob?: Blob) => void;
    seekBy: (amount: number) => void;
    seek: (time: number) => void;
    playbackRate: (rate: number) => void;
    toggleMute: () => void;
    isPlaying: (audio?: Audio, audioBlob?: Blob) => boolean;
}

export type PlayerAPI = PlayerState &
    PublicPlayerActions & { currentTimeRef: React.MutableRefObject<number> };

const enum ActionKind {
    SET_META = "SET_META",
    SET_BLOB = "SET_BLOB",
    PLAY = "PLAY",
    PAUSE = "PAUSE",
    TOGGLE_MUTE = "TOGGLE_MUTE",
    SET_CURRENT_TIME = "SET_CURRENT_TIME",
    SET_DURATION = "SET_DURATION"
}

type Action =
    | { type: ActionKind.SET_META; payload: Audio }
    | { type: ActionKind.SET_BLOB; payload: Blob }
    | { type: ActionKind.PLAY }
    | { type: ActionKind.PAUSE }
    | { type: ActionKind.TOGGLE_MUTE }
    | { type: ActionKind.SET_CURRENT_TIME; payload: number }
    | { type: ActionKind.SET_DURATION; payload: number };

const AudioPlayerContext = createContext<PlayerAPI | null>(null);

function audioReducer(state: PlayerState, action: Action): PlayerState {
    switch (action.type) {
        case ActionKind.SET_BLOB:
            return { ...state, audioBlob: action.payload, audio: null };
        case ActionKind.SET_META:
            return { ...state, audio: action.payload, audioBlob: null };
        case ActionKind.PLAY:
            return { ...state, playing: true };
        case ActionKind.PAUSE:
            return { ...state, playing: false };
        case ActionKind.TOGGLE_MUTE:
            return { ...state, muted: !state.muted };
        case ActionKind.SET_CURRENT_TIME:
            return { ...state, currentTime: action.payload };
        case ActionKind.SET_DURATION:
            return { ...state, duration: action.payload };
        default:
            return state;
    }
}

const leeway = 0.05;

export function AudioProvider({
    children,
    transcript,
    renderedText,
    messageId
}: {
    children: React.ReactNode;
    transcript: Partial<Transcript> | null;
    renderedText: string | null;
    messageId: string;
    onTimeUpdate?: (currentTime: number) => void;
}) {
    const [state, dispatch] = useReducer(audioReducer, {
        playing: false,
        muted: false,
        duration: 0,
        currentTime: 0,
        audio: null,
        audioBlob: null
    });
    const playerRef = useRef<React.ElementRef<"audio">>(null);
    const currentTimeRef = useRef(0); // Store the current time in a ref
    const animationFrameIdRef = useRef<number | null>(null);
    const activeWordIndex = useRef<number | null>(null);

    const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
    const [nodeInfo, setNodeInfo] = useState<any[]>([]);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

    // function mapTranscriptToNodeInfo(
    //     transcript: Partial<Transcript>,
    //     nodeInfo: NodeInfo[]
    // ) {
    //     const wordMappings: any[] = [];
    //     let remainingWords = [...transcript.words];

    //     for (const node of nodeInfo) {
    //         const wordMapping = normalizeTextWithPunctuation(node.text);

    //         let nodeStartTime: number | null = null;
    //         let nodeEndTime: number | null = null;
    //         let transcriptIndex = 0;

    //         for (let i = 0; i < wordMapping.length; i++) {
    //             const m = wordMapping[i];

    //             // Find the first matching word in the remainingWords array
    //             while (
    //                 transcriptIndex < remainingWords.length &&
    //                 remainingWords[transcriptIndex].word.toLowerCase() !==
    //                     m.normalized.toLowerCase()
    //             ) {
    //                 transcriptIndex++;
    //             }

    //             if (transcriptIndex < remainingWords.length) {
    //                 const transcriptWord = remainingWords[transcriptIndex];

    //                 if (nodeStartTime === null) {
    //                     nodeStartTime = transcriptWord.start;
    //                 }

    //                 nodeEndTime = transcriptWord.end;

    //                 // Find the range within the node that corresponds to the current word
    //                 const rangeInfo = node.ranges.find(
    //                     (range) =>
    //                         range.original === m.original &&
    //                         !range.start &&
    //                         !range.end
    //                 );

    //                 if (rangeInfo) {
    //                     rangeInfo.start = transcriptWord.start;
    //                     rangeInfo.end = transcriptWord.end;
    //                 }

    //                 const mappingWord = {
    //                     textNodeId: node.id,
    //                     word: m.original,
    //                     start: transcriptWord.start,
    //                     end: transcriptWord.end,
    //                     spans: m.original.length
    //                 };

    //                 wordMappings.push(mappingWord);

    //                 // Increment the transcript index for the next iteration
    //                 transcriptIndex++;
    //             }
    //         }

    //         if (nodeStartTime !== null && nodeEndTime !== null) {
    //             node.start = nodeStartTime;
    //             node.end = nodeEndTime;
    //         }
    //     }

    //     return { nodeInfoParsed: nodeInfo, mappings: wordMappings };
    // }

    function mapTranscriptToNodeInfo(
        transcript: Partial<Transcript>,
        nodeInfo: NodeInfo[]
    ) {
        const wordMappings: any[] = [];

        let remainingWords = [...transcript.words];

        for (const node of nodeInfo) {
            const wordMapping = normalizeTextWithPunctuation(node.text);

            let nodeStartTime: number | null = null;
            let nodeEndTime: number | null = null;

            for (const m of wordMapping) {
                const transcriptWordIndex = remainingWords.findIndex(
                    (tWord) => {
                        return (
                            // index >= currentRemainingWordsIndex &&
                            tWord.word.toLowerCase() ===
                            m.normalized.toLowerCase()
                        );
                    }
                );

                // if (newRanges.length !== wordMapping.length) {
                //     console.log("KABOONGA: ");
                //     console.log(newRanges);
                //     console.log(wordMapping);
                // }

                if (transcriptWordIndex !== -1) {
                    const transcriptWord = remainingWords[transcriptWordIndex];

                    if (nodeStartTime === null) {
                        nodeStartTime = transcriptWord.start;
                    }

                    nodeEndTime = transcriptWord.end;

                    // How about iterating through transcript words between nodeStartTime and nodeEndTime, comparing m.original to range.original, then changing rangeInfo in place (adjust start and end time).

                    const mappingWord = {
                        textNodeId: node.id,
                        word: m.original,
                        start: transcriptWord.start,
                        end: transcriptWord.end,
                        spans: m.original.length
                    };
                    wordMappings.push(mappingWord);

                    // Remove the found word from the remainingWords array
                    remainingWords.splice(transcriptWordIndex, 1);
                    // currentRemainingWordsIndex = transcriptWordIndex + 1;
                }
            }

            if (nodeStartTime !== null && nodeEndTime !== null) {
                node.start = nodeStartTime;
                node.end = nodeEndTime;
            }
        }

        return { nodeInfoParsed: nodeInfo, mappings: wordMappings };
    }

    function normalizeTextWithPunctuation(text: string) {
        // Replace hyphens with spaces and remove other punctuation, but preserve original words
        const words = text.split(/\s+/);
        // const words = text.split(/[\s-]+/);

        const wordMapping: Array<{ normalized: string; original: string }> = [];

        for (const word of words) {
            if (word.includes("-")) {
                // split the word by hyphen but retain the hyphen in the subsequent parts
                const parts = word.split("-");
                parts.forEach((part, index) => {
                    if (index > 0) {
                        part = "-" + part;
                    }
                    const normalizedPart = part.replace(/[^\w\s]/g, "");
                    if (normalizedPart) {
                        wordMapping.push({
                            normalized: normalizedPart,
                            original: part
                        });
                    }
                });
            } else {
                const normalizedWord = word
                    // .replace(/-/g, " ")
                    .replace(/[^\w\s]/g, "");
                if (normalizedWord) {
                    wordMapping.push({
                        normalized: normalizedWord,
                        original: word
                    });
                }
            }
        }

        return wordMapping;
    }

    const calculateWordPositions = (
        transcript: Partial<Transcript>,
        containerId: string
    ): WordPosition[] => {
        const container = document.getElementById(containerId);
        const nodeInfo: {
            id: string;
            text: string;
            top: number;
            right: number;
            bottom: number;
            left: number;
            ranges;
        }[] = [];

        if (!container) {
            console.error(`Container with id ${containerId} not found`);
            return wordPositions;
        }

        // console.log("Container: ", container);
        // console.log("Transcript Words: ", transcript.words);

        let currentIndex = 0;

        // traverse child nodes recursively
        function traverseNodes(node: ChildNode) {
            // console.log(node);

            // check if the node is an element
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                // check if the element has a direct child that is a text node (want to store <li> but not <ul>)

                const hasTextChild = Array.from(element.childNodes).some(
                    (child) => child.nodeType === Node.TEXT_NODE
                );

                if (hasTextChild) {
                    // Generate unique ID
                    const uniqueId = `text-node-${currentIndex}`;
                    element.id = uniqueId;

                    const rect = element.getBoundingClientRect();

                    const ranges: {
                        range: Range;
                        original: string;
                    }[] = [];

                    element.childNodes.forEach((childNode) => {
                        if (childNode.nodeType === Node.TEXT_NODE) {
                            const textNode = childNode as Text;
                            const textContent = textNode.textContent || "";

                            const wordMapping =
                                normalizeTextWithPunctuation(textContent);

                            let currentOffset = 0;

                            wordMapping.forEach((mapping) => {
                                const range = document.createRange();

                                range.setStart(childNode, currentOffset);
                                range.setEnd(
                                    childNode,
                                    currentOffset + mapping.original.length
                                );

                                ranges.push({
                                    range,
                                    original: mapping.original
                                });

                                currentOffset += mapping.original.length;
                            });
                        }
                    });

                    // also traverse text nodes

                    currentIndex++;
                    nodeInfo.push({
                        id: uniqueId,
                        text: element.textContent,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                        left: rect.left,
                        ranges: ranges
                    });
                }
            }

            node.childNodes.forEach((childNode) => traverseNodes(childNode));
        }

        container.childNodes.forEach((childNode) => traverseNodes(childNode));

        const { nodeInfoParsed, mappings } = mapTranscriptToNodeInfo(
            transcript,
            nodeInfo
        );

        setNodeInfo(nodeInfoParsed);

        console.log("mappings: ", mappings);
        console.log("node info: ", nodeInfo);
        return mappings;
    };

    useEffect(() => {
        nodeInfo.forEach((node) => {
            const element = document.getElementById(node.id);

            if (element) {
                if (node.id === activeNodeId) {
                    element.style.backgroundColor = "#d1d5db25";
                    element.style.color = "invert";
                    element.style.padding = "4px 8px"; // Add padding to make the text stand out
                    element.style.borderRadius = "8px"; // Rounded corners
                    element.style.transition =
                        "background-color 0.3s ease, padding 0.3s ease"; // Smooth transition for the highlight
                    element.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // Subtle shadow for a lifted effect
                } else {
                    element.style.backgroundColor = "";
                    element.style.padding = "";
                    element.style.borderRadius = "";
                    element.style.boxShadow = "";
                }
            }
        });
    }, [activeNodeId, nodeInfo]);

    const updateHighlight = useCallback(() => {
        if (playerRef.current && nodeInfo) {
            const currentTime = playerRef.current.currentTime;
            currentTimeRef.current = currentTime;

            const activeNode = nodeInfo.find(
                (node) =>
                    currentTime >= node.start - leeway &&
                    currentTime <= node.end
            );

            if (activeNode && activeWordIndex) {
                setActiveNodeId(activeNode.id);
            } else {
                setActiveNodeId(null);
            }

            animationFrameIdRef.current =
                requestAnimationFrame(updateHighlight);
        }
    }, []);

    // on mount, if transcript exists calc word positions
    useEffect(() => {
        if (transcript && transcript.words && messageId) {
            const wordPositions = calculateWordPositions(
                transcript,
                `text-content-${messageId}`
            );

            setWordPositions(wordPositions);
        }
    }, []);

    useEffect(() => {
        if (!transcript?.words || !messageId) return;

        if (!activeWordIndex.current) activeWordIndex.current = 0;

        if (state.playing) {
            // Start the animation frame loop when audio is playing
            animationFrameIdRef.current =
                requestAnimationFrame(updateHighlight);
        } else if (animationFrameIdRef.current) {
            // Stop the loop when audio is paused
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
            activeWordIndex.current = null;
        }

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [state.playing, updateHighlight]);

    const actions = useMemo<PublicPlayerActions>(() => {
        return {
            play(audio, audioBlob) {
                if (audio) {
                    dispatch({ type: ActionKind.SET_META, payload: audio });

                    if (
                        playerRef.current &&
                        playerRef.current.currentSrc !== audio.audio.src
                    ) {
                        const playbackRate = playerRef.current.playbackRate;
                        playerRef.current.src = audio.audio.src;
                        playerRef.current.load();
                        playerRef.current.pause();
                        playerRef.current.playbackRate = playbackRate;
                        playerRef.current.currentTime = 0;
                    }
                } else if (audioBlob) {
                    dispatch({ type: ActionKind.SET_BLOB, payload: audioBlob });

                    if (
                        playerRef.current &&
                        playerRef.current.src !== URL.createObjectURL(audioBlob)
                    ) {
                        const playbackRate = playerRef.current.playbackRate;
                        playerRef.current.src = URL.createObjectURL(audioBlob);
                        playerRef.current.pause();
                        playerRef.current.playbackRate = playbackRate;
                        playerRef.current.currentTime = 0;
                    }
                }

                playerRef.current?.play();
            },
            pause() {
                playerRef.current?.pause();
            },
            toggle(audio, audioBlob) {
                this.isPlaying(audio, audioBlob)
                    ? actions.pause()
                    : actions.play(audio, audioBlob);
            },
            seekBy(amount) {
                if (playerRef.current) {
                    playerRef.current.currentTime += amount;
                }
            },
            seek(time) {
                if (playerRef.current) {
                    playerRef.current.currentTime = time;
                }
            },
            playbackRate(rate) {
                if (playerRef.current) {
                    playerRef.current.playbackRate = rate;
                }
            },
            toggleMute() {
                dispatch({ type: ActionKind.TOGGLE_MUTE });
            },
            isPlaying(audio, audioBlob) {
                if (audio) {
                    return (
                        state.playing &&
                        playerRef.current?.currentSrc === audio.audio.src
                    );
                } else if (audioBlob) {
                    return (
                        state.playing &&
                        playerRef.current?.src ===
                            URL.createObjectURL(audioBlob)
                    );
                } else {
                    return state.playing;
                }
            }
        };
    }, [state.playing]);

    const api = useMemo<PlayerAPI>(
        () => ({ ...state, ...actions, currentTimeRef }),
        [state, actions]
    );

    return (
        <>
            <AudioPlayerContext.Provider value={api}>
                {children}
            </AudioPlayerContext.Provider>
            <audio
                ref={playerRef}
                onPlay={() => dispatch({ type: ActionKind.PLAY })}
                onPause={() => dispatch({ type: ActionKind.PAUSE })}
                onDurationChange={(event) => {
                    dispatch({
                        type: ActionKind.SET_DURATION,
                        payload: Math.floor(event.currentTarget.duration)
                    });
                }}
                muted={state.muted}
            />
        </>
    );
}

export function useAudioPlayer(audio?: Audio, audioBlob?: Blob) {
    const player = useContext(AudioPlayerContext);

    return useMemo<PlayerAPI>(
        () => ({
            ...player!,
            play() {
                player!.play(audio, audioBlob);
            },
            toggle() {
                player!.toggle(audio, audioBlob);
            },
            get playing() {
                return player!.isPlaying(audio, audioBlob);
            }
        }),
        [player, audio, audioBlob]
    );
}
