"use client";

import { ForwardButton } from "@/components/audio-player/forward-button";
import { MuteButton } from "@/components/audio-player/mute-button";
import { PlayButton } from "@/components/audio-player/play-button";
import { PlaybackRateButton } from "@/components/audio-player/playback-rate-button";
import { RewindButton } from "@/components/audio-player/rewind-button";
import { Slider } from "@/components/audio-player/slider";
import { useAudioPlayer } from "@/lib/providers/audio-provider";
import type { Transcript } from "@/lib/types";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";

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
    showAudioPlayer: (value: boolean) => void;
    transcript: Transcript | Partial<Transcript>;
    // setCharIndex: (value: number) => void;
}

export function AudioPlayer({ showAudioPlayer, transcript }: Props) {
    let player = useAudioPlayer();

    let wasPlayingRef = useRef(false);

    let [currentTime, setCurrentTime] = useState<number | null>(
        player.currentTime
    );

    useEffect(() => {
        setCurrentTime(null);
    }, [player.currentTime, player.duration]);

    if (!player.audioBlob) {
        return null;
    }

    const handleCancelAudio = () => {
        player.pause();
        showAudioPlayer(false);
    };

    return (
        <div className="flex items-center gap-6 bg-background/75 rounded-full px-1 py-4 shadow border border-muted-foreground/50 backdrop-blur-sm md:px-6">
            <div className="hidden md:block">
                <PlayButton player={player} />
            </div>
            <div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
                <div className="flex justify-between gap-4 flex-col items-center">
                    <div className="flex flex-none items-center gap-4 flex-col">
                        <div className="md:hidden">
                            <PlayButton player={player} />
                        </div>
                        <ForwardButton player={player} />
                        <RewindButton player={player} />
                    </div>
                    {/* no slider for now */}
                    {/* <Slider
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
                    /> */}
                    <div className="flex items-center gap-4 flex-col">
                        <div className="flex items-center">
                            <MuteButton player={player} />
                        </div>
                        <div className="flex items-center">
                            <PlaybackRateButton player={player} />
                        </div>
                    </div>
                    <div className="w-full flex items-center justify-center border-t hover:bg-background transition-colors duration-300">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="rounded-0 mt-2"
                            onClick={handleCancelAudio}>
                            <X className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
