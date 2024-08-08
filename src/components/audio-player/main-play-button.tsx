"use client";

import { useAudioPlayer } from "@/lib/providers/audio-provider";

import { Button } from "../ui/button";

export function MainPlayButton({
    audioBlob,
    setShowAudioPlayer,
    playing,
    paused,
    ...props
}: React.ComponentPropsWithoutRef<"button"> & {
    audioBlob: Blob;
    setShowAudioPlayer: (value: boolean) => void;
    playing: React.ReactNode;
    paused: React.ReactNode;
}) {
    let player = useAudioPlayer(undefined, audioBlob);

    return (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
                player.playing
                    ? setShowAudioPlayer(false)
                    : setShowAudioPlayer(true);
                player.toggle();
            }}
            aria-label={`${player.playing ? "Pause" : "Play"}`}
            {...props}>
            {player.playing ? playing : paused}
        </Button>
    );
}
