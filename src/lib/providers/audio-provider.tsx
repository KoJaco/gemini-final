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

interface WordPosition {
    word: string;
    start: number;
    end: number;
    top: number;
    left: number;
    width: number;
    height: number;
}
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

    const calculateWordPositions = (
        transcript: Partial<Transcript>,
        containerId: string
    ): WordPosition[] => {
        const container = document.getElementById(containerId);
        const wordPositions: WordPosition[] = [];

        if (!container) {
            console.error(`Container with id ${containerId} not found`);
            return wordPositions;
        }

        let currentCharIdx = 0; // Keep track of the cumulative character index
        let foundStart = false;

        // Iterate over each word in the transcript
        transcript.words?.forEach((transcriptWord) => {
            const range = document.createRange();
            let startNode: Node | null = null;
            let startOffset = 0;
            let endNode: Node | null = null;
            let endOffset = 0;

            function traverseNodes(node: ChildNode) {
                if (foundStart && endNode) return; // Stop if we've found the word

                if (node.nodeType === Node.TEXT_NODE) {
                    const textContent = node.textContent || "";
                    const nodeEndIndex = currentCharIdx + textContent.length;

                    if (
                        !foundStart &&
                        currentCharIdx <= transcriptWord.start! &&
                        transcriptWord.start! < nodeEndIndex
                    ) {
                        startNode = node;
                        startOffset = transcriptWord.start! - currentCharIdx;
                        foundStart = true;
                    }

                    if (
                        foundStart &&
                        !endNode &&
                        transcriptWord.end! <= nodeEndIndex
                    ) {
                        endNode = node;
                        endOffset = transcriptWord.end! - currentCharIdx;
                    }

                    currentCharIdx = nodeEndIndex;
                } else {
                    node.childNodes.forEach(traverseNodes);
                }
            }

            container.childNodes.forEach(traverseNodes);

            if (startNode && endNode) {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                const rect = range.getBoundingClientRect();

                wordPositions.push({
                    word: transcriptWord.word,
                    start: transcriptWord.start!,
                    end: transcriptWord.end!,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }

            // Reset for the next word
            foundStart = false;
        });

        return wordPositions;
    };

    useEffect(() => {
        if (transcript && transcript.words) {
            const wordPositions = calculateWordPositions(
                transcript,
                `text-content-${messageId}`
            );

            console.log(wordPositions);
            setWordPositions(wordPositions);
        }
    }, []);

    const highlightWord = (wordPosition) => {
        const highlightOverlay = document.getElementById("highlight-overlay");
        highlightOverlay.style.top = `${wordPosition.top}px`;
        highlightOverlay.style.left = `${wordPosition.left}px`;
        highlightOverlay.style.width = `${wordPosition.width}px`;
        highlightOverlay.style.height = `${wordPosition.height}px`;
        highlightOverlay.style.display = "block";
    };

    const updateHighlight = useCallback(() => {
        if (playerRef.current) {
            const currentTime = playerRef.current.currentTime;
            currentTimeRef.current = currentTime;

            if (wordPositions.length > 0) {
                const wordPosition = wordPositions.find(
                    (word) =>
                        currentTime >= word.start && currentTime < word.end
                );

                if (wordPosition) {
                    highlightWord(wordPosition);
                }

                // highlightWordBasedOnTime(currentTime);

                animationFrameIdRef.current =
                    requestAnimationFrame(updateHighlight);
            }
        }
    }, []);

    const highlightWordBasedOnTime = (currentTime) => {
        if (
            !activeWordIndex.current &&
            !transcript.words &&
            activeWordIndex.current === transcript.words.length - 1
        )
            return;

        const nextWord = transcript.words[activeWordIndex.current + 1];

        if (currentTime > nextWord.start) {
            console.log(
                currentTime + " | " + nextWord.word + " | " + calculateRange()
            );

            const start = calculateRange();
            const end = start + nextWord.word.length;

            // highlightText(start, end);
            console.log("Start Index: " + start + "\n\n" + "End Index: " + end);

            activeWordIndex.current = activeWordIndex.current + 1;
        }
    };

    function calculateRange() {
        let cumulativeRange = 0;

        for (let i = 0; i < activeWordIndex.current; i++) {
            cumulativeRange += transcript.words[i].word.length;
        }

        return cumulativeRange;
    }

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
