export type FooterButtonType = {
  title: string
  labelName:
    | "new-chat"
    | "all-threads"
    | "hover-mode"
    | "reading-mode"
    | "change-preferences"
  tooltip: string
  icon: JSX.Element
}

export type ContextOption = "read" | "summarize" | "simplify" | "translate"

export type HelpfulQuestion = {
  labelName:
    | "read-aloud"
    | "summarize-page"
    | "better-understand"
    | "page-makeup"
  prompt: string
}

export interface Message {
  role: "user" | "assistant" | "system" | "function" | "data" | "tool"
  content: string
  id?: string
  name?: string
  display?: {
    name: string
    props: Record<string, unknown>
  }
  createdAt: string // ISO string
  threadId: string
}

export interface ChatThread {
  threadId: string
  messages: Message[]
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export interface StorageItems {
  chatThreads?: ChatThread[]
}

export type AvailableViews =
  | "main"
  | "add-api"
  | "all-threads"
  | "preferences"
  | "read-mode"

export type ResultObject = {
  success: boolean
  data?: any
  error?: Error
  message?: string
}

export interface Audio {
  id: number
  title: string
  published: Date
  description: string
  content: string
  audio: {
    src: string
    type: string
  }
}
