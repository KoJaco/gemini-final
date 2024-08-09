// import { TOGGLE_HOVER_MODE } from "@/background/ports/toggle-hover-mode";
import { buttonVariants } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { footerButtons } from "@/lib/constants";
import { createNewChatThread } from "@/lib/storage/indexed-db";
import type { AvailableViews, ChatThread } from "@/lib/types";
import clsx from "clsx";
import { nanoid } from "nanoid";
import React, { useState } from "react";

type Props = {
    currentView: AvailableViews;
    setCurrentView: (value: AvailableViews) => void;
    setCurrentChatThread: (value: ChatThread) => void;
};

const SidepanelFooter = ({
    currentView,
    setCurrentView,
    setCurrentChatThread
}: Props) => {
    const [hoverMode, setHoverMode] = useState<boolean>(false);

    async function handleToggleHoverMode() {
        // TODO: Extrapolate response return types out into appropriate types (success only, success with message, success with data)
        const response: { success: boolean } = await chrome.runtime.sendMessage(
            {
                action: "TOGGLE_HOVER_MODE",
                payload: !hoverMode
            }
        );

        if (response?.success) {
            setHoverMode(!hoverMode);
        } else {
            console.warn("Error toggling hover mode.");
        }
    }

    async function determineButtonFunction(
        identifier: "new-chat" | "all-threads" | "hover-mode" | "preferences"
    ) {
        switch (identifier) {
            case "new-chat":
                handleCreateNewChatThread();
                if (currentView !== "main") {
                    setCurrentView("main");
                }
                break;
            case "hover-mode":
                handleToggleHoverMode();
                break;
            case "all-threads":
                setCurrentView(identifier);
                break;
            case "preferences":
                setCurrentView(identifier);
                break;
            default:
                console.warn(`Identifier '${identifier}' was incorrect.`);
        }
    }

    async function handleCreateNewChatThread() {
        const id = nanoid();

        const newThread: ChatThread = {
            threadId: id,
            messages: [
                {
                    role: "assistant",
                    content:
                        "Hey! I'm your personal AI assistant trying to make the web a more accessible place for all. Ask me anything!",
                    id: `msg-open`,
                    createdAt: new Date().toISOString(),
                    threadId: id
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const res = await createNewChatThread(newThread);

            if (res.success) {
                setCurrentChatThread(newThread);
            } else {
                console.error(`Error of status: ${res.status}: `, res.message);
            }
        } catch (error) {
            console.error(
                `Error when attempting to create new chat thread: ${error}`
            );
        } finally {
            if (currentView !== "main") {
                setCurrentView("main");
            }
        }
    }

    return (
        <div className="bg-background dark:bg-black mt-auto flex justify-between py-4 border-t border-muted-foreground/50 w-full px-4">
            {footerButtons.map((button) => (
                <Tooltip key={button.labelName}>
                    <TooltipTrigger>
                        <div
                            // name={button.labelName}
                            aria-label={button.labelName}
                            role="button"
                            // type="button"
                            // variant="ghost"
                            // size="icon"
                            className={clsx(
                                buttonVariants({
                                    variant: "ghost",
                                    size: "icon"
                                }),
                                "text-muted-foreground hover:scale-105 transition-all duration-300",
                                button.labelName === "hover-mode"
                                    ? `${
                                          hoverMode
                                              ? "bg-foreground text-background"
                                              : "bg-transparent"
                                      }`
                                    : ""
                            )}
                            onClick={() =>
                                determineButtonFunction(button.labelName)
                            }>
                            {button.icon}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] bg-background text-muted-foreground shadow text-md border border-muted-foreground/20">
                        {button.tooltip}
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
};

export default SidepanelFooter;
