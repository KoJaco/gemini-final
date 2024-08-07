import { ButtonScrollToBottom } from "@/components/button-scroll-to-bottom";
import Chat from "@/components/chat";
import { ChatMessage } from "@/components/chat/message";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatThread } from "@/lib/types";
import { Fragment, useState } from "react";

type MainViewProps = {
    currentChatThread: ChatThread;
    setCurrentChatThread: (value: ChatThread) => void;
    isAtBottom: boolean;
    scrollToBottom: () => void;
    messagesRef: React.RefObject<HTMLDivElement>;
    scrollRef: React.RefObject<HTMLDivElement>;
    visibilityRef: React.RefObject<HTMLDivElement>;
};

export function MainView({
    currentChatThread,
    setCurrentChatThread,
    isAtBottom,
    scrollToBottom,
    messagesRef,
    scrollRef,
    visibilityRef
}: MainViewProps) {
    const [responseLoading, setResponseLoading] = useState(false);

    return (
        <>
            <ScrollArea
                ref={scrollRef}
                className="h-3/4 w-full flex flex-1 flex-col gap-y-4 overflow-y-auto p-4">
                {currentChatThread ? (
                    <>
                        <div ref={messagesRef}>
                            {currentChatThread.messages &&
                                currentChatThread.messages.map(
                                    (message, index) => {
                                        return (
                                            <Fragment key={index}>
                                                <ChatMessage
                                                    message={message}
                                                />
                                                {/* put response loading skeleton here. */}
                                            </Fragment>
                                        );
                                    }
                                )}

                            {responseLoading && (
                                <div className="h-96 w-full flex flex-col gap-y-4">
                                    <Skeleton className="w-3/4 h-10" />

                                    <Skeleton className="w-full h-32" />

                                    <div className="flex">
                                        <div className="flex flex-col items-center justify-between py-4">
                                            <Skeleton className="h-3 w-3 rounded-full" />
                                            <Skeleton className="h-3 w-3 rounded-full" />
                                            <Skeleton className="h-3 w-3 rounded-full" />
                                        </div>

                                        <Skeleton className="ml-4 w-full h-32" />
                                    </div>
                                </div>
                            )}
                            <ButtonScrollToBottom
                                isAtBottom={isAtBottom}
                                scrollToBottom={scrollToBottom}
                            />
                            <div className="w-full h-px" ref={visibilityRef} />
                        </div>
                        <ScrollBar orientation="horizontal" className="ml-2" />
                    </>
                ) : (
                    // TODO: add skeleton
                    <></>
                )}
            </ScrollArea>

            <Chat
                thread={currentChatThread}
                setThread={setCurrentChatThread}
                setResponseLoading={setResponseLoading}
            />
        </>
    );
}
