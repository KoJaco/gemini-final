"use client"

import { Button, buttonVariants } from "@/components/ui/button"
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
import { setApiKey } from "@/lib/storage/secure"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useForm } from "react-hook-form"
import { z } from "zod"

type Props = {
  apiKey: string | null
  setCurrentKey: (value: string) => void
  setApiKeyLoading: (value: boolean) => void
  setError: ({
    display,
    message
  }: {
    display: boolean
    message: string
  }) => void
}

const formSchema = z.object({
  apiKey: z.string().min(1, {
    message: "API key must not be blank."
  })
})

export function ApiEntryForm({
  apiKey,
  setCurrentKey,
  setApiKeyLoading,
  setError
}: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: apiKey || ""
    }
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // after validation, submit the API key into secure storage and add it to session (in memory storage).
    const { apiKey } = data

    // Attempt to use the api key and test if it is valid.
    setApiKeyLoading(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const result = await model.generateContent("Hello Gemini, how are you?")
      const response = await result.response
      const text = response.text()

      if (text) {
        console.log(text)

        const res = await setApiKey(apiKey)

        if (res.success) {
          setCurrentKey(apiKey)
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
      setApiKeyLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg-background">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground font-semibold">
                API Key
              </FormLabel>
              <FormControl>
                <Input placeholder="ahks281..." {...field} />
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
