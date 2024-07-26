"use client"

import { IconArrowElbow } from "@/components/ui/icons"
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit"
import { Mic } from "lucide-react"
import React, { useEffect, useRef } from "react"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

type PromptFormProps = {
  input: string
  setInput: (value: string) => void
  handleSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void
}

const PromptForm = ({ input, setInput, handleSubmit }: PromptFormProps) => {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="relative flex flex-col justify-between max-h-60 w-full grow rounded-sm overflow-hidden bg-muted/50 items-center border">
        <div className="px-2 py-2 w-full">
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            placeholder="Ask me anything! :)"
            className="min-h-[30px] w-full bg-transparent placeholder:text-muted-foreground/50 resize-none rounded-sm px-4 py-[1.3rem] outline-none focus-within:outline-muted-foreground sm:text-sm overflow-y-auto focus-within:ring-0 focus:outline-none focus:ring-0 ring-transparent focus-within:border-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            name="message"
            rows={1}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
          />
        </div>
        <div className="grid grid-cols-2 w-full">
          <Button
            className="flex gap-x-2 w-full rounded-none text-muted-foreground hover:text-primary"
            size="icon"
            type="button"
            variant="ghost">
            <Mic className="w-4 h-4" />
            Speech to text
          </Button>
          <Button
            type="submit"
            size="icon"
            variant="default"
            disabled={input === ""}
            className="shadow-none rounded-none flex gap-x-2 w-full">
            <IconArrowElbow className="w-4 h-4" />
            Submit Message
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </div>
    </form>
  )
}

export default PromptForm
