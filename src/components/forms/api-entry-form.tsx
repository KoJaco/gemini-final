"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { setGeminiApiKey } from "@/lib/storage/secure"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useForm } from "react-hook-form"
import { z } from "zod"

import WebTts from "../web-tts"

type Props = {
  geminiApiKey: string | null
  whisperApiKey?: string | null
  setGeminiKey: (value: string) => void
  setWhisperApiKey?: (value: string) => void
  setApiKeysLoading: (value: boolean) => void
  setError: ({
    display,
    message
  }: {
    display: boolean
    message: string
  }) => void
}

const formSchema = z.object({
  geminiApiKey: z.string().min(1, {
    message: "API key must not be blank."
  }),
  useWhisper: z.boolean().default(false).optional(),
  whisperApiKey: z
    .string()
    .min(1, {
      message:
        "API key must not be left blank. Deselect 'I want better text-to-speech' if you do not want to use OpenAI's Whisper."
    })
    .nullable()
})

export function ApiEntryForm({
  geminiApiKey,
  whisperApiKey,
  setGeminiKey,
  setApiKeysLoading,
  setError
}: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      geminiApiKey: geminiApiKey || "",
      useWhisper: false,
      whisperApiKey: whisperApiKey || null
    }
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // after validation, submit the API key into secure storage and add it to session (in memory storage).
    const { geminiApiKey, useWhisper, whisperApiKey } = data

    // Attempt to use the api key and test if it is valid.
    setApiKeysLoading(true)

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const result = await model.generateContent("Hello Gemini, how are you?")
      const response = await result.response
      const text = response.text()

      if (text) {
        console.log(text)

        const res = await setGeminiApiKey(geminiApiKey)

        if (res.success) {
          setGeminiKey(geminiApiKey)
          setError({ display: false, message: "" })
        } else {
          setError({
            display: true,
            message:
              "Error. Something went wrong while attempting to store the api key. Please try again."
          })
        }
      } else {
        setError({
          display: true,
          message:
            "Something went wrong while generating text. Try entering your API key again."
        })
      }
    } catch (error) {
      setError({
        display: true,
        message:
          "Invalid API Key. Please make sure your api key is valid and try again."
      })

      return { success: false }
    } finally {
      if (!useWhisper) {
        setApiKeysLoading(false)
      }
    }

    if (useWhisper) {
      // test response from whisper, check working.
      try {
      } catch (error) {
      } finally {
        setApiKeysLoading(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg-background">
        <FormField
          control={form.control}
          name="geminiApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gemini API Key</FormLabel>
              <FormControl>
                <Input placeholder="vw0Zo..." {...field} />
              </FormControl>
              <FormDescription className="text-muted-foreground">
                To use this extension you must first sign up for a Google Gemini
                API Key. You can{" "}
                <a
                  href="https://ai.google.dev/gemini-api/docs/api-key"
                  target="_blank"
                  className={clsx(
                    { buttonVariants: { variant: "inline" } },
                    "underline font-bold"
                  )}>
                  follow this link
                </a>{" "}
                to learn how.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="useWhisper"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-1">
                <FormLabel>I want better text-to-speech</FormLabel>
                <FormDescription>
                  By default this extension uses the native browser Web Speech
                  API for reading out Gemini's messages. Check this text box if
                  you would like better text-to-speech functionality by using
                  the OpenAI Whisper API.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whisperApiKey"
          render={({ field }) => (
            <FormItem
              className={clsx(
                form.getValues("useWhisper")
                  ? ""
                  : "pointer-events-none opacity-50"
              )}>
              <FormLabel>Whisper API Key</FormLabel>
              <FormControl>
                <Input placeholder="sk-proj-VEc..." {...field} />
              </FormControl>
              <FormDescription className="text-muted-foreground leading-1">
                OpenAI's Whisper API provides quality speech synthesis across
                many languages. This is an external API you will need to setup
                yourself, however, detailed instructions can be found by{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  className={clsx(
                    { buttonVariants: { variant: "inline" } },
                    "underline font-bold"
                  )}>
                  following this link.
                </a>{" "}
                The voice you will hear when using this API is AI-generated and
                not a human voice.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Submit
        </Button>
        {/* <WebTts
          text={
            "By default this extension uses the native browser Web Speech API for reading out Gemini's messages. Check this text box if you would like better text-to-speech functionality by using the OpenAI Whisper API."
          }
        /> */}
      </form>
    </Form>
  )
}
