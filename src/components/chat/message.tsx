"use client"

// import { useAppStore } from "@/lib/stores/appStore"
// import { useAppStore } from "@/lib/stores/appStore"
import { CodeBlock } from "@/components/ui/codeblock"
import { useAppStore } from "@/lib/stores/appStore"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import clsx from "clsx"
import { memo, useEffect, useState, type FC } from "react"
import ReactMarkdown, { type Options } from "react-markdown"
import remarkGfm from "remark-gfm"

import { IconGemini, IconUser } from "../ui/icons"
import AudioPlayer from "./audio-player"

export interface ChatMessageProps {
  message: Message
  speed?: number
}

export function ChatMessage({
  message,
  speed = 10,
  ...props
}: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  // // console.log(displayedText);
  const { typewriter, setTypewriter } = useAppStore()

  console.log(message)

  useEffect(() => {
    if (typewriter) {
      if (message.content.length > 256 && message.role === "user") {
        setDisplayedText(message.content)
      } else if (currentIndex < message.content.length) {
        const randomSpeed =
          Math.floor(Math.random() * (speed + 30 - (speed + 8))) + (speed - 8)

        const timeout = setTimeout(() => {
          setDisplayedText(
            (prevText) => prevText + message.content[currentIndex]
          )
          setCurrentIndex((prevIndex) => prevIndex + 1)
        }, randomSpeed)

        return () => {
          setTypewriter(false)
          clearTimeout(timeout)
        }
      }
    } else {
      setDisplayedText(message.content)
    }
  }, [currentIndex, speed, message])

  // useEffect(() => {
  //   if (typewriter) {
  //     if (message.content.length > 256 && message.role === "user") {
  //       setDisplayedText(message.content)
  //     } else {
  //       // randomised speed typewriter.
  //       let index = 0
  //       let isPaused = false
  //       let timeout: NodeJS.Timeout

  //       const typeCharacter = () => {
  //         if (isPaused) return

  //         if (index < message.content.length - 1) {
  //           setDisplayedText((prev) => prev + message.content[index])
  //           index += 1

  //           const randomSpeed =
  //             Math.floor(Math.random() * (speed + 50 - (speed + 10))) +
  //             (speed - 10)
  //           const isPausedCharacter = Math.random() < 0.1

  //           if (isPausedCharacter) {
  //             isPaused = true
  //             timeout = setTimeout(() => {
  //               isPaused = false
  //               typeCharacter()
  //             }, randomSpeed * 5)
  //           } else {
  //             timeout = setTimeout(typeCharacter, randomSpeed)
  //           }
  //         }
  //       }

  //       typeCharacter()

  //       return () => {
  //         isPaused = true
  //         clearTimeout(timeout)
  //       }
  //     }
  //   } else {
  //     setDisplayedText(message.content)
  //   }
  // }, [message.content, speed])

  return (
    <div
      className={cn(
        "group w-full mb-10 items-start h-full relative flex flex-col overflow-x-hidden"
      )}
      {...props}>
      <div
        className={clsx(
          "flex w-full mb-2",
          message.role === "user" ? "justify-end" : "justify-start"
        )}>
        {message.role === "user" ? (
          <IconUser className="w-4 h-4" />
        ) : (
          <IconGemini className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div
        className={cn(
          "flex size-8 h-auto items-center text-left",
          message.role === "user"
            ? "border rounded-lg py-2.5 px-2 border-muted/50 place-self-end w-2/3 shadow backdrop-blur-lg bg-muted/50"
            : "place-self-start w-full"
        )}>
        <MemoizedReactMarkdown
          className="h-full w-full prose dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 text-wrap whitespace-normal"
          remarkPlugins={[remarkGfm]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children && children.length) {
                if (children[0] == "▍") {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace("`▍`", "▍")
              }

              const match = /language-(\w+)/.exec(className || "")

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ""}
                  value={String(children).replace(/\n$/, "")}
                  {...props}
                />
              )
            }
          }}>
          {displayedText}
        </MemoizedReactMarkdown>
      </div>

      {/* Audio player component should appear on hover underneath cursor (like a context menu) */}
      {/* <div className="">
        <AudioPlayer />
      </div> */}
    </div>
  )
}

const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
)
