import "@/style.css"

import { ApiEntryForm } from "@/components/forms/api-entry-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useScrollAnchor } from "@/lib/hooks/use-scroll-anchor"
import { Providers } from "@/lib/providers"
import { createNewChatThread, getLatestThread } from "@/lib/storage/indexed-db"
import { getApiKey, removeApiKey } from "@/lib/storage/secure"
import { useAppStore } from "@/lib/stores/appStore"
import type { AvailableViews, ChatThread } from "@/lib/types"
import clsx from "clsx"
import { nanoid } from "nanoid"
import React, { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook"

import SidepanelFooter from "./footer"
import MainView from "./views/main"
import ThreadsView from "./views/threads"

const Sidepanel = () => {
  // States
  const [enabled, setEnabled] = useState(false)
  const [currentChatThread, setCurrentChatThread] = useState<ChatThread | null>(
    null
  )
  const [currentView, setCurrentView] = useState<AvailableViews>("main")

  const [loading, setLoading] = useState(true)
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  const [error, setError] = useState({ display: false, message: "" })

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  const { geminiApiKey, setGeminiApiKey, whisperApiKey, setWhisperAPiKey } =
    useAppStore()

  useEffect(() => {
    const fetchApiKey = async () => {
      const response = await getApiKey()

      if (response.success && response.data) {
        setGeminiApiKey(response.data)
      } else {
        console.log(response.error)
      }

      setLoading(false)
    }

    fetchApiKey()
  }, [])

  useEffect(() => {
    async function fetchOrCreateLatestThread() {
      const latestThread = await getLatestThread()

      if (latestThread !== undefined) {
        setCurrentChatThread(latestThread)
      } else {
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

        // TODO: Something is going wrong with the res....
        if (res.success) {
          setCurrentChatThread(newThread)
          console.log("Successfully created new thread")
        } else {
          console.log(res.message)
        }
      }
    }

    fetchOrCreateLatestThread()
  }, [])

  // console.log(currentChatThread)

  // Messaging / Chrome
  //   const resp = await sendToBackground({
  //     name: "ping",
  //     body: {
  //       id: "123"
  //     }
  //   })

  async function handleRemoveApiKey() {
    const res = await removeApiKey()
    if (res.success) {
      setGeminiApiKey(null)
      console.log("removed api key")
      console.log("API KEY", geminiApiKey)
      console.log(res.message || "No message")
    }
  }

  function renderCurrentView() {
    switch (currentView) {
      case "main":
        return (
          <MainView
            currentChatThread={currentChatThread}
            setCurrentChatThread={setCurrentChatThread}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            messagesRef={messagesRef}
            scrollRef={scrollRef}
            visibilityRef={visibilityRef}
          />
        )

      case "all-threads":
        return (
          <ThreadsView
            setOpenView={setCurrentView}
            currentThread={currentChatThread}
            setCurrentThread={setCurrentChatThread}
          />
        )

      case "preferences":
        return (
          <MainView
            currentChatThread={currentChatThread}
            setCurrentChatThread={setCurrentChatThread}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            messagesRef={messagesRef}
            scrollRef={scrollRef}
            visibilityRef={visibilityRef}
          />
        )
      case "read-mode":
        return (
          <MainView
            currentChatThread={currentChatThread}
            setCurrentChatThread={setCurrentChatThread}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            messagesRef={messagesRef}
            scrollRef={scrollRef}
            visibilityRef={visibilityRef}
          />
        )
      default:
        return (
          <MainView
            currentChatThread={currentChatThread}
            setCurrentChatThread={setCurrentChatThread}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            messagesRef={messagesRef}
            scrollRef={scrollRef}
            visibilityRef={visibilityRef}
          />
        )
    }
  }

  const openWelcomePage = () => {
    const tabUrl = chrome.runtime.getURL("tabs/welcome.html")
    chrome.tabs.create({ url: tabUrl })
  }

  // TODO: add skeleton

  if (currentChatThread === null) {
    // TODO: Add loading skeleton or spinner.
    return <p>Loading...</p>
  }

  return (
    <Providers>
      <div className="flex flex-col w-full h-[100vh] max-h-[100vh] pt-4 overflow-x-hidden bg-gradient-to-b from-background to-background/50">
        {geminiApiKey ? (
          <div className="flex flex-col h-full w-full">
            <header className="px-4 mb-4 flex-col flex">
              <h1 className="text-lg text-left">Gemini Helper</h1>
              {/* <div className="flex w-full items-center gap-x-2">
                <span
                  className={clsx(
                    "bg-emerald-500 rounded-full w-4 h-4 flex",
                    enabled ? "bg-green-500" : "bg-red-500"
                  )}
                />
                <h1 className="text-lg">{enabled ? "Enabled" : "Disabled"}</h1>
                <div className="ml-auto">
                  <ActivateGeminiToggle
                    enabled={enabled}
                    setEnabled={setEnabled}
                  />
                </div>
              </div> */}
            </header>

            {/* main content */}
            {renderCurrentView()}
            {/* <MainView
              currentChatThread={currentChatThread}
              setCurrentChatThread={setCurrentChatThread}
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
              messagesRef={messagesRef}
              scrollRef={scrollRef}
              visibilityRef={visibilityRef}
            /> */}

            {/* Sidepanel<button onClick={openWelcomePage}>Open Welcome Page</button> */}
            <Button onClick={() => handleRemoveApiKey()}>Remove API Key</Button>
            <SidepanelFooter
              currentView={"main"}
              setCurrentView={setCurrentView}
              setCurrentChatThread={setCurrentChatThread}
            />
          </div>
        ) : (
          <div className="p-4">
            {/* this should be a loading skeleton for the app as a whole. */}
            {apiKeysLoading ? (
              <Card className="w-full h-auto shadow-lg flex flex-col gap-y-8 p-6">
                <Skeleton className="w-full h-16 rounded-md" />
                <div className="flex flex-col space-y-2 w-full">
                  <Skeleton className="w-20 h-8 rounded-md" />
                  <Skeleton className="w-full h-8 rounded-md" />
                  <Skeleton className="w-full h-16 rounded-md" />
                </div>
                <Skeleton className="w-32 h-8 rounded-md" />
              </Card>
            ) : (
              <Card className="shadow-lg w-full h-auto">
                <CardHeader className="mb-4">
                  <CardTitle className="capitalize text-2xl font-bold mb-4">
                    Setup you API keys
                  </CardTitle>

                  <CardDescription>
                    <span className="mb-4">
                      Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                      Similique modi odit reprehenderit facilis assumenda
                      architecto
                    </span>
                    {error.display && (
                      <span className="text-red-500 mb-4 whitespace-normal w-full">
                        {error.message}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ApiEntryForm
                    geminiApiKey={geminiApiKey}
                    setGeminiKey={setGeminiApiKey}
                    setApiKeysLoading={setApiKeysLoading}
                    setError={setError}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Providers>
  )
}

export default Sidepanel
