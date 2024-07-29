"use client";

import { ForwardButton } from "@/components/audio-player/forward-button";
import { MuteButton } from "@/components/audio-player/mute-button";
import { PlayButton } from "@/components/audio-player/play-button";
import { PlaybackRateButton } from "@/components/audio-player/playback-rate-button";
import { RewindButton } from "@/components/audio-player/rewind-button";
import { Slider } from "@/components/audio-player/slider";
import { useAudioPlayer } from "@/lib/providers/audio-provider";
import { useEffect, useRef, useState } from "react";

function parseTime(seconds: number) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds - hours * 3600) / 60);
    seconds = seconds - hours * 3600 - minutes * 60;
    return [hours, minutes, seconds];
}

function formatHumanTime(seconds: number) {
    let [h, m, s] = parseTime(seconds);
    return `${h} hour${h === 1 ? "" : "s"}, ${m} minute${
        m === 1 ? "" : "s"
    }, ${s} second${s === 1 ? "" : "s"}`;
}

interface Props {
    audioBlob: Blob | null;
}

export function AudioPlayer({ audioBlob }: Props) {
    let player = useAudioPlayer(undefined, audioBlob);

    let wasPlayingRef = useRef(false);

    let [currentTime, setCurrentTime] = useState<number | null>(
        player.currentTime
    );

    useEffect(() => {
        setCurrentTime(null);
    }, [player.currentTime]);

    if (!player.audio && !audioBlob) {
        return null;
    }

    return (
        <div className="flex items-center gap-6 bg-white/90 px-4 py-4 shadow shadow-slate-200/80 ring-1 ring-slate-900/5 backdrop-blur-sm md:px-6">
            <div className="hidden md:block">
                <PlayButton player={player} />
            </div>
            <div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
                <div className="truncate text-center text-sm font-bold leading-6 md:text-left">
                    {audioBlob ? "Audio Blob" : player.audio?.title}
                </div>

                {/*               
                <a
                    href={`/${player.audio.id}`}
                    className="truncate text-center text-sm font-bold leading-6 md:text-left"
                    title={player.audio.title}>
                    {player.audio.title}
                </a> */}
                <div className="flex justify-between gap-6">
                    <div className="flex items-center md:hidden">
                        <MuteButton player={player} />
                    </div>
                    <div className="flex flex-none items-center gap-4">
                        <RewindButton player={player} />
                        <div className="md:hidden">
                            <PlayButton player={player} />
                        </div>
                        <ForwardButton player={player} />
                    </div>
                    <Slider
                        label="Current time"
                        maxValue={player.duration}
                        step={1}
                        value={[currentTime ?? player.currentTime]}
                        onChange={([value]) => setCurrentTime(value)}
                        onChangeEnd={([value]) => {
                            player.seek(value);
                            if (wasPlayingRef.current) {
                                player.play();
                            }
                        }}
                        numberFormatter={
                            { format: formatHumanTime } as Intl.NumberFormat
                        }
                        onChangeStart={() => {
                            wasPlayingRef.current = player.playing;
                            player.pause();
                        }}
                    />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <PlaybackRateButton player={player} />
                        </div>
                        <div className="hidden items-center md:flex">
                            <MuteButton player={player} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
