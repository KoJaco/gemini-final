import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { footerButtons } from "@/lib/constants"
import { createNewChatThread } from "@/lib/storage/indexed-db"
import type { AvailableViews, ChatThread } from "@/lib/types"
import clsx from "clsx"
import { nanoid } from "nanoid"
import React, { useState } from "react"

type Props = {
  currentView: AvailableViews
  setCurrentView: (value: AvailableViews) => void
  setCurrentChatThread: (value: ChatThread) => void
}

const SidepanelFooter = ({
  currentView,
  setCurrentView,
  setCurrentChatThread
}: Props) => {
  const [hoverMode, setHoverMode] = useState(false)

  const activateHoverMode = () => {
    console.log("activate hit")
    chrome.runtime.sendMessage({ action: "activateHoverMode" })
  }

  const deactivateHoverMode = () => {
    console.log("deactivate hit")
    chrome.runtime.sendMessage({ action: "deactivateHoverMode" })
  }

  async function determineButtonFunction(
    identifier:
      | "new-chat"
      | "all-threads"
      | "hover-mode"
      | "reading-mode"
      | "change-preferences"
  ) {
    switch (identifier) {
      case "new-chat":
        handleCreateNewChatThread()
        if (currentView !== "main") {
          setCurrentView("main")
        }
        break
      case "hover-mode":
        if (!hoverMode) {
          activateHoverMode()
          setHoverMode(true)
        } else {
          deactivateHoverMode()
          setHoverMode(false)
        }
        break
      case "all-threads":
        setCurrentView("all-threads")
        break

      default:
        console.log("Identifier was incorrect.")
    }
  }

  async function handleCreateNewChatThread() {
    const id = nanoid()

    const newThread: ChatThread = {
      threadId: id,
      messages: [
        {
          role: "system",
          content:
            "Hey! I'm your personal AI assistant trying to make the web a more accessible place for all. Ask me anything!",
          id: `msg-open`,
          createdAt: new Date().toISOString(),
          threadId: id
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const res = await createNewChatThread(newThread)
    console.log(res)

    // TODO: Something is going wrong with the res
    if (res.success) {
      setCurrentChatThread(newThread)
      console.log("Hit")
    } else {
      console.log(`Error of status: ${res.status}: `, res.message)
    }
  }

  return (
    <div className="bg-background dark:bg-black mt-auto flex justify-between py-4 border-t border-muted-foreground/50 w-full px-4">
      {footerButtons.map((button) => (
        <Tooltip key={button.labelName}>
          <TooltipTrigger>
            <Button
              name={button.labelName}
              aria-label={button.labelName}
              role="button"
              type="button"
              variant="ghost"
              size="icon"
              className={clsx(
                "text-muted-foreground hover:scale-105 transition-all duration-300",
                button.labelName === "hover-mode"
                  ? `${
                      hoverMode
                        ? "bg-foreground text-background"
                        : "bg-transparent"
                    }`
                  : ""
              )}
              onClick={() => determineButtonFunction(button.labelName)}>
              {button.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[200px] bg-background text-muted-foreground shadow text-md border border-muted-foreground/20">
            {button.tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

export default SidepanelFooter
