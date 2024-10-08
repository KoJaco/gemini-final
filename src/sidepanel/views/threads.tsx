import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    getAllThreads,
    getSummaryOnThread,
    removeThread,
    setLatestChatThread
} from "@/lib/storage/indexed-db";
import type { AvailableViews, ChatThread } from "@/lib/types";
import clsx from "clsx";
import { CornerUpLeft, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";

type Props = {
    setOpenView: (value: AvailableViews) => void;
    currentThread: ChatThread;
    setCurrentThread: (value: ChatThread) => void;
};

// TODO: creating a new chat in threads should push this here, or redirect to the new chat.

// TODO: maybe don't include the ID... no point? Just the first few lines of message truncated.

export const ThreadsView = ({
    setOpenView,
    currentThread,
    setCurrentThread
}: Props) => {
    const [threads, setThreads] = useState<ChatThread[]>([]);

    useEffect(() => {
        let isMounted = true;
        // Fetch threads from IndexedDB or other storage

        async function retrieveAllChatThreads() {
            try {
                const res = await getAllThreads();

                if (res && isMounted) {
                    setThreads(res);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to retrieve threads: ", error);
                }
            }
        }

        retrieveAllChatThreads();

        return () => {
            isMounted = false;
        };
    }, []);

    const stripSummary = (summary: string) => {
        if (summary) {
            const newSummary = summary.split("**");
            return newSummary[2];
        } else {
            return null;
        }
    };

    // TODO: Bug --- must refresh sidepanel page as local state becomes stale (db is fine).

    async function handleRemoveThread(threadId: string) {
        const res = await removeThread(threadId);

        if (res.success) {
            setThreads((prev) =>
                prev.filter((thread) => thread.threadId !== threadId)
            );
        } else {
            console.warn(res.message);
        }
    }

    async function handleSetCurrentChatThread(thread: ChatThread) {
        const res = await setLatestChatThread(thread.threadId);

        if (res.success) {
            setCurrentThread(thread);
            setOpenView("main");
        } else {
            console.warn(res.message);
        }
    }

    return (
        <div className="h-3/4 w-full flex flex-1 flex-col gap-y-4 overflow-y-auto p-4">
            <h2 className="mt-4 mb-2 text-lg font-bold">All Threads</h2>
            <ScrollArea className="h-full py-2">
                <ul className="flex flex-col gap-6 h-full">
                    {threads.map((thrd, index) => {
                        const timestamp = new Date(thrd.updatedAt);

                        return (
                            <li
                                key={thrd.threadId}
                                className="group hover:cursor-pointer relative">
                                <Button
                                    type="button"
                                    className="absolute z-10 right-2 hover:text-red-500 top-2"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        handleRemoveThread(thrd.threadId)
                                    }>
                                    <Trash className="w-4 h-4" />
                                </Button>
                                <Card
                                    className={clsx(
                                        "p-2 backdrop-blur-lg group-hover:bg-muted/20 relative",
                                        currentThread.threadId === thrd.threadId
                                            ? "border bg-muted/20"
                                            : ""
                                    )}
                                    onMouseDown={() => {
                                        handleSetCurrentChatThread(thrd);
                                    }}>
                                    <CardContent className="p-2">
                                        <CardTitle className="flex w-[90%] h-10 overflow-hidden truncate whitespace-normal text-sm leading-2 text-clip flex-wrap break-all">
                                            {
                                                thrd.messages[
                                                    thrd.messages.length - 1
                                                ].content
                                            }
                                        </CardTitle>

                                        <CardDescription className="text-muted-foreground mt-2">
                                            <span>{`Messages: (${thrd.messages.length}) `}</span>
                                            <br />
                                            <span>
                                                {timestamp.toLocaleDateString()}
                                            </span>
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </li>
                        );
                    })}
                </ul>

                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Button
                onClick={() => setOpenView("main")}
                variant="outline"
                className="px-4 py-2 rounded mt-auto">
                Back to Main View
                <span className="ml-4">
                    <CornerUpLeft className="w-4 h-4" />
                </span>
            </Button>
        </div>
    );
};
