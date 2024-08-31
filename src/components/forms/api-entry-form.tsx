"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { storeGeminiApiKey, storeWhisperApiKey } from "@/lib/storage/secure";
import type { AvailableInitialViews } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "../ui/card";

type Props = {
    setGeminiKey: (value: string) => void;
    setWhisperApiKey: (value: string) => void;
    setApiKeysLoading: (value: boolean) => void;
    setError: ({
        display,
        message
    }: {
        display: boolean;
        message: string;
    }) => void;
    setInitialView: (value: AvailableInitialViews) => void;
};

const formSchema = z.object({
    geminiApiKey: z.string().min(1, {
        message: "API key must not be blank."
    }),
    whisperApiKey: z
        .string()
        .min(1, {
            message:
                "API key must not be left blank. Deselect 'I want better text-to-speech' if you do not want to use OpenAI's Whisper."
        })
        .nullable()
});

export function ApiEntryForm({
    setGeminiKey,
    setWhisperApiKey,
    setApiKeysLoading,
    setError,
    setInitialView
}: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            geminiApiKey: "",
            whisperApiKey: ""
        }
    });

    async function onSubmit(data: z.infer<typeof formSchema>) {
        // after validation, submit the API key into secure storage and add it to session (in memory storage).
        const { geminiApiKey, whisperApiKey } = data;

        // Attempt to use the api key and test if it is valid.
        setApiKeysLoading(true);

        // TODO: Make this flow correctly. If we successfully submit a gemini key but some validation goes wrong with our whisperkey then we should appropriately handle this... geminiKey can be set in storage, but don't push to main view.

        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const result = await model.generateContent(
                "Hello Gemini, how are you?"
            );
            const response = await result.response;
            const text = response.text();

            if (text) {
                const res = await storeGeminiApiKey(geminiApiKey);

                if (res.success) {
                    setGeminiKey(geminiApiKey);
                    setError({ display: false, message: "" });
                } else {
                    setError({
                        display: true,
                        message:
                            "Error. Something went wrong while attempting to store the api key. Please try again."
                    });
                }
            } else {
                setError({
                    display: true,
                    message:
                        "Something went wrong while generating text. Try entering your API key again."
                });
            }
        } catch (error) {
            setError({
                display: true,
                message:
                    "Invalid API Key. Please make sure your api key is valid and try again."
            });

            return { success: false };
        } finally {
            if (whisperApiKey === null || whisperApiKey === "") {
                setApiKeysLoading(false);
            }
        }

        if (whisperApiKey.length > 0) {
            // test response from whisper, check working.
            try {
                const response = await fetch(
                    "https://api.openai.com/v1/audio/speech",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${whisperApiKey}`,
                            "content-type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "tts-1",
                            input: "Today is a wonderful day to build something meaningful.",
                            voice: "alloy"
                        })
                    }
                );

                console.log(response);

                if (!response.ok) {
                    setError({
                        display: true,
                        message: "Failed to validate Whisper API Key"
                    });
                } else {
                    const res = await storeWhisperApiKey(whisperApiKey);

                    if (res.success) {
                        setWhisperApiKey(whisperApiKey);
                        setError({ display: false, message: "" });
                    } else {
                        setError({
                            display: true,
                            message: "Failed to store Whisper API Key."
                        });
                    }
                }
            } catch (error) {
                setError({
                    display: true,
                    message:
                        "Something went wrong while validating your Whisper API Key, please try again."
                });
            } finally {
                setApiKeysLoading(false);
            }
        }
    }

    return (
        <Card className="shadow-lg w-full h-auto">
            <CardHeader className="mb-4">
                <CardTitle className="capitalize text-2xl font-bold mb-4">
                    Use your own API Keys
                </CardTitle>

                <CardDescription>
                    <span className="mb-4">
                        This options is for those who do not want to sign up for
                        Companion or for those who already have their own API
                        keys and want to manage their subscriptions themselves.
                    </span>
                    {/* {error.display && (
                        <span className="text-red-500 mb-4 whitespace-normal w-full">
                            {error.message}
                        </span>
                    )} */}
                </CardDescription>
            </CardHeader>

            <CardContent>
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
                                        <Input
                                            type="password"
                                            placeholder="vw0Zo..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground">
                                        To use this extension you must first
                                        sign up for a Google Gemini API Key. You
                                        can{" "}
                                        <a
                                            href="https://ai.google.dev/gemini-api/docs/api-key"
                                            target="_blank"
                                            className={clsx(
                                                {
                                                    buttonVariants: {
                                                        variant: "inline"
                                                    }
                                                },
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
                            name="whisperApiKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Whisper API Key{" "}
                                        <span className="ml-auto text-muted-foreground/50">
                                            (optional)
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="sk-proj-Aek..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground leading-1">
                                        OpenAI's Whisper API provides quality
                                        speech synthesis across many languages.
                                        This is an external API you will need to
                                        setup yourself, however, detailed
                                        instructions can be found by{" "}
                                        <a
                                            href="https://platform.openai.com/api-keys"
                                            target="_blank"
                                            className={clsx(
                                                {
                                                    buttonVariants: {
                                                        variant: "inline"
                                                    }
                                                },
                                                "underline font-bold"
                                            )}>
                                            following this link.
                                        </a>{" "}
                                        The voice you will hear when using this
                                        API is AI-generated and not a human
                                        voice.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            Submit
                        </Button>

                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-light text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInitialView("login");
                                    }}
                                    className="text-primary font-semibold hover:underline ml-2">
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
