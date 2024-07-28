import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getAllThreads, setLatestChatThread } from "@/lib/storage/indexed-db"
import type { AvailableViews, ChatThread } from "@/lib/types"
import clsx from "clsx"
import { CornerUpLeft } from "lucide-react"
import React, { useEffect, useState } from "react"

type Props = {
  setOpenView: (value: AvailableViews) => void
  currentThread: ChatThread
  setCurrentThread: (value: ChatThread) => void
}

const ThreadsView = ({
  setOpenView,
  currentThread,
  setCurrentThread
}: Props) => {
  const [threads, setThreads] = useState<ChatThread[]>([])

  useEffect(() => {
    let isMounted = true
    // Fetch threads from IndexedDB or other storage

    async function retrieveAllChatThreads() {
      try {
        const res = await getAllThreads()

        if (res && isMounted) {
          setThreads(res)
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to retrieve threads: ", error)
        }
      }
    }

    retrieveAllChatThreads()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSetCurrentChatThread(thread: ChatThread) {
    const res = await setLatestChatThread(thread.threadId)

    if (res.success) {
      // console.log(res.message)
      setCurrentThread(thread)
      setOpenView("main")
    } else {
      console.log(res.message)
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="mt-4 mb-2 text-lg font-bold">All Threads</h2>
      <ScrollArea>
        <ul className="flex flex-col gap-6">
          {threads.map((thrd) => {
            const timestamp = new Date(thrd.updatedAt)

            return (
              <li
                key={thrd.threadId}
                className="group hover:cursor-pointer"
                onMouseDown={() => {
                  handleSetCurrentChatThread(thrd)
                }}>
                <Card
                  className={clsx(
                    "p-2 backdrop-blur-lg group-hover:bg-muted/20",
                    currentThread.threadId === thrd.threadId
                      ? "border bg-muted/20"
                      : ""
                  )}>
                  <CardContent className="p-2">
                    <CardTitle className="flex w-full max-h-18 truncate whitespace-normal text-lg">
                      {thrd.messages.length > 1 ? (
                        <span>{thrd.messages[1].content}</span>
                      ) : (
                        <span>{thrd.messages[0].content}</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      <span>{`Messages: (${thrd.messages.length}) `}</span>
                      <br />
                      <span>{timestamp.toLocaleDateString()}</span>
                    </CardDescription>
                  </CardContent>
                </Card>
              </li>
            )
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
  )
}

export default ThreadsView
