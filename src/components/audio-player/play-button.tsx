import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { type PlayerAPI } from "@/lib/providers/audio-provider";

import { Button } from "../ui/button";

export function PlayButton({ player }: { player: PlayerAPI }) {
    let Icon = player.playing ? PauseIcon : PlayIcon;

    return (
        <Button
            size="icon"
            variant="ghost"
            type="button"
            onClick={() => player.toggle()}
            aria-label={player.playing ? "Pause" : "Play"}>
            <div className="absolute -inset-3 md:hidden" />
            <Icon className="h-4 w-4 fill-white group-active:fill-white md:h-7 md:w-7" />
        </Button>
    );
}
