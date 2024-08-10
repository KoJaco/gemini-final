import { type Audio } from "@/lib/types";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef
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

export function AudioProvider({
    children,
    onTimeUpdate
}: {
    children: React.ReactNode;
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

    // const updateTime = useCallback(() => {
    //     if (playerRef.current) {
    //         const exactCurrentTime = playerRef.current.currentTime;

    //         dispatch({
    //             type: ActionKind.SET_CURRENT_TIME,
    //             payload: exactCurrentTime
    //         });

    //         if (onTimeUpdate) {
    //             onTimeUpdate(exactCurrentTime);
    //         }
    //     }
    // }, [onTimeUpdate]);

    useEffect(() => {
        const onTimeUpdate = () => {
            if (playerRef.current) {
                currentTimeRef.current = playerRef.current.currentTime;
            }
        };

        const audioElement = playerRef.current;
        if (audioElement) {
            audioElement.addEventListener("timeupdate", onTimeUpdate);
        }

        return () => {
            if (audioElement) {
                audioElement.removeEventListener("timeupdate", onTimeUpdate);
            }
        };
    }, []);

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
