import { type PlayerAPI } from "@/lib/providers/audio-provider";

import { Button } from "../ui/button";

function MuteIcon({
    muted,
    ...props
}: React.ComponentPropsWithoutRef<"svg"> & {
    muted: boolean;
}) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}>
            {muted ? (
                <>
                    <path d="M12 6L8 10H6C5.44772 10 5 10.4477 5 11V13C5 13.5523 5.44772 14 6 14H8L12 18V6Z" />
                    <path d="M16 10L19 13" fill="none" />
                    <path d="M19 10L16 13" fill="none" />
                </>
            ) : (
                <>
                    <path d="M12 6L8 10H6C5.44772 10 5 10.4477 5 11V13C5 13.5523 5.44772 14 6 14H8L12 18V6Z" />
                    <path
                        d="M17 7C17 7 19 9 19 12C19 15 17 17 17 17"
                        fill="none"
                    />
                    <path
                        d="M15.5 10.5C15.5 10.5 16 10.9998 16 11.9999C16 13 15.5 13.5 15.5 13.5"
                        fill="none"
                    />
                </>
            )}
        </svg>
    );
}

export function MuteButton({ player }: { player: PlayerAPI }) {
    return (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            className="group/mute relative rounded-md focus:outline-none focus:ring-2 focus:ring-muted-foreground focus:ring-offset-2"
            onClick={() => player.toggleMute()}
            aria-label={player.muted ? "Unmute" : "Mute"}>
            <MuteIcon
                muted={player.muted}
                className="h-6 w-6 stroke-muted-foreground group-hover:stroke-primary"
            />
        </Button>
    );
}
