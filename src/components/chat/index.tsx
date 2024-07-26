"use client"

import { helpfulQuestions } from "@/lib/constants/components"
import { updateThread } from "@/lib/storage/indexed-db"
import { useAppStore } from "@/lib/stores/appStore"
import type { ChatThread, ContextOption, Message } from "@/lib/types"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { nanoid } from "nanoid"
import { useEffect, useRef, useState } from "react"

import PromptForm from "../forms/prompt-form"
import { Button } from "../ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "../ui/carousel"

const Chat = ({
  thread,
  setThread,
  setResponseLoading
}: {
  thread: ChatThread
  setThread: (thread: ChatThread) => void
  setResponseLoading: (value: boolean) => void
}) => {
  const { setTypewriter, apiKey } = useAppStore()

  const genAI = new GoogleGenerativeAI(apiKey)

  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState<string>("")

  const hoveredElementRef = useRef<HTMLElement | null>(null)
  const [contextOption, setContextOption] = useState(null)

  // handle forwarded messages from background script.
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.action === "hoverElement") {
        hoveredElementRef.current = message.element
        console.log("Hovered Element: ", hoveredElementRef.current)
      } else if (message.action === "contextOption") {
        hoveredElementRef.current = message.element
        setContextOption(message.option)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  useEffect(() => {
    if (contextOption && hoveredElementRef.current) {
      // push context option and all associated element details to Gemini, then wait for a response/suggested fix.
      handleContextOption(contextOption, hoveredElementRef.current)
    }
  }, [contextOption])

  const handleContextOption = async (
    option: ContextOption,
    element: HTMLElement
  ) => {
    switch (option) {
      case "read":
        // Send a prompt to LLM to read aloud the element's text content
        console.log("Read Aloud:", element.textContent)
        break
      case "summarize":
        // Send a prompt to LLM to summarize the element's text content
        console.log("Summarize:", element.textContent)
        break

      case "simplify":
        // TODO: this should be pushed into the thread as a new message.
        console.log("Simplify", element.textContent)
        if (element.textContent) {
          const prompt = `Simplify the following text content from a section in a website making sure you return the new text content in the same format as the received text content. If you cannot find a reasonable solution for simplification, just return back the original and add the following to the start of the message back: <simplification_not_available>. The text content is as follows: ${element.textContent}. `
          const simplifiedText = await fetchData(prompt)
          if (simplifiedText) {
            updateElementText(element.id, simplifiedText)
          } else {
            console.log("No simplified text, error")
          }
        } else {
          console.log("No text content in element")
        }
        break

      case "translate":
        // Send a prompt to LLM to translate the element's text content
        console.log("Translate:", element.textContent)
        break
      default:
        break
    }
  }

  const updateElementText = (elementId: string, newText: string) => {
    console.log("Element Id: ", elementId)
    console.log("Simplified text: ", newText)
    const element = document.getElementById(elementId)
    if (element) {
      element.textContent = newText
    }
  }

  const fetchData = async (prompt: string) => {
    setResponseLoading(true)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    // let newMessage: Message | null = null;

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return text

      // const combinedText = text
      //     .split("\n")
      //     .filter((paragraph) => paragraph.trim().length > 0)
      //     .join("\n\n");
    } catch (err) {
      console.error(err)
    } finally {
      setResponseLoading(false)
    }
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    // blur focus on mobile

    if (window.innerWidth < 600) {
      event.currentTarget["message"]?.blur()
    }

    const value = input.trim()
    setInput("")

    if (!value) return

    setTypewriter(true)

    const newUserMessage: Message = {
      role: "user",
      content: value,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      threadId: thread.threadId
    }

    const updatedThread = {
      ...thread,
      messages: [...thread.messages, newUserMessage]
    }

    // optimistically add user messages to indexdb, this should push a user message to into the chat. If a chat thread doesn't exist, create one.

    updateThread(thread.threadId, newUserMessage).then((resultSet) => {
      if (resultSet.success) {
        setThread(updatedThread)
        console.log(resultSet.message)
      } else {
        console.error(resultSet.message)
      }
    })

    const aiResponse = await fetchData(newUserMessage.content)

    if (aiResponse) {
      const newGeminiMessage: Message = {
        role: "assistant",
        content: aiResponse,
        id: nanoid(),
        createdAt: new Date().toISOString(),
        threadId: thread.threadId
      }
      const newThread = {
        ...updatedThread,
        messages: [...updatedThread.messages, newGeminiMessage]
      }

      updateThread(thread.threadId, newGeminiMessage).then((resultSet) => {
        console.log(resultSet)

        if (resultSet.success) {
          setThread(newThread)
        } else {
          console.error(resultSet.message)
        }
      })
    } else {
      console.log("Could not set new message type, something went wrong.")
    }
  }

  async function handleMergePromptAndSubmit(
    identifier:
      | "read-aloud"
      | "summarize-page"
      | "better-understand"
      | "page-makeup",
    prompt: string
  ) {
    // this function will need to interact with a content script / service worker to grab the current pages content.

    chrome.runtime.sendMessage(
      {
        action: "getPageTextContent"
      },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
          return
        }

        const pageContent = response.content
        const responseCharacteristicPreference =
          "express things as simply as possible, be kind and empathetic, be patient."

        // TODO: At the moment I have just fetched the gemini response and set the user message to be the prompt, without what actually goes to Gemini in there.
        const newUserMessage: Message = {
          role: "user",
          content: prompt,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          threadId: thread.threadId
        }

        const updatedThread = {
          ...thread,
          messages: [...thread.messages, newUserMessage]
        }

        setTypewriter(true)

        if (identifier === "summarize-page") {
          // this can be handle by simply asking Gemini to look it up and summarise it.
          // insert context from preferences (how you want Gemini to respond to you... used dummy preference for now)
          const messageToGemini = `Please summarize the website by looking at the following HTML content. Your response should be in correctly formatted markdown and you are to respond with these characteristics: ${responseCharacteristicPreference}. Here is the website's HTML to be summarized: ${pageContent}`

          updateThread(thread.threadId, newUserMessage).then((resultSet) => {
            if (resultSet.success) {
              setThread(updatedThread)
            } else {
              console.error(resultSet.message)
            }
          })

          let aiResponse: string | undefined = undefined

          try {
            aiResponse = await fetchData(messageToGemini)
          } catch (error) {
            // TODO: handle generative ai blocking it and report it as a message.
            console.error(error)
          }

          if (aiResponse) {
            const newGeminiMessage: Message = {
              role: "assistant",
              content: aiResponse,
              id: nanoid(),
              createdAt: new Date().toISOString(),
              threadId: thread.threadId
            }
            const newThread = {
              ...updatedThread,
              messages: [...updatedThread.messages, newGeminiMessage]
            }

            updateThread(thread.threadId, newGeminiMessage).then(
              (resultSet) => {
                console.log(resultSet)

                if (resultSet.success) {
                  setThread(newThread)
                } else {
                  console.error(resultSet.message)
                }
              }
            )
          } else {
            console.log("Could not set new message type, something went wrong.")
          }
        }

        setTypewriter(false)
      }
    )
  }

  if (!thread.messages) return null

  return (
    <div className="flex flex-col mt-auto">
      {/* {hoveredElementRef.current && (
        <div className="mt-4">
          <h3>Hovered Element Details:</h3>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(hoveredElementRef.current, null, 2)}
          </pre>
        </div>
      )}
      {loading && <p>Loading...</p>} */}

      <Carousel className="px-4 w-full mb-4 group relative">
        <div className="w-full justify-center translate-y-2 z-10 relative space-x-4">
          <CarouselPrevious />
          <CarouselNext />
        </div>

        <CarouselContent className="flex">
          {helpfulQuestions.map((q, index) => (
            <CarouselItem key={index} className="flex max-w-[160px] h-20">
              <Button
                variant="ghost"
                type="button"
                className="rounded-sm bg-muted/50 flex flex-wrap whitespace-normal w-full text-left p-2 h-full text-muted-foreground items-start justify-start"
                // onClick={() =>
                //   handleMergePromptAndSubmit(q.labelName, q.prompt)
                // }
              >
                {q.prompt}
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mb-4 mt-auto px-4">
        <PromptForm
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

export default Chat
