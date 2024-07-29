"use client";

import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/lib/providers/audio-provider";

// import { type Audio } from '@/lib/types'

export function EpisodePlayButton({
    audioBlob,
    playing,
    paused,
    ...props
}: React.ComponentPropsWithoutRef<"button"> & {
    audioBlob: Blob;
    playing: React.ReactNode;
    paused: React.ReactNode;
}) {
    let player = useAudioPlayer(undefined, audioBlob);

    return (
        <Button
            type="button"
            onClick={() => player.toggle()}
            aria-label={`${player.playing ? "Pause" : "Play"} audio blobby`}
            {...props}>
            {player.playing ? playing : paused}
        </Button>
    );
}
