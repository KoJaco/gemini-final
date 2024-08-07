import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
    removeApiKey,
    savePreferences,
    storeGeminiApiKey,
    storeWhisperApiKey
} from "@/lib/storage/secure";
import { useAppStore } from "@/lib/stores/appStore";
import {
    AI_CHARACTERISTICS,
    AI_CHARACTERISTICS_VALUE,
    AI_INTERACTIONS,
    AI_INTERACTIONS_VALUE,
    TRANSLATE_LANGUAGES,
    type AiCharacteristics,
    type AiCharacteristicsLabel,
    type AiInteractions,
    type AvailableViews,
    type Preferences
} from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the Zod schema
const preferencesSchema = z.object({
    aiSettings: z.array(
        z.union([
            z.object({
                characteristics:
                    // z.object({
                    // label:
                    z.union([
                        z.literal("simplicity"),
                        z.literal("detail"),
                        z.literal("clarity"),
                        z.literal("conciseness"),
                        z.literal("tone"),
                        z.literal("engagement"),
                        z.literal("creativity")
                        // z.literal("custom")
                    ])
                // value:
                // z.union([
                //     z.literal(
                //         "Express things as simply as possible, be kind and empathetic, be patient."
                //     ),
                //     z.literal(
                //         "Provide detailed explanations and thorough insights."
                //     ),
                //     z.literal(
                //         "Ensure explanations are clear and easy to understand."
                //     ),
                //     z.literal("Keep responses short and to the point."),
                //     z.literal(
                //         "Adjust the tone to be friendly, formal, or neutral based on the context."
                //     ),
                //     z.literal(
                //         "Make interactions engaging and interactive."
                //     ),
                //     z.literal(
                //         "Allow for creative and imaginative responses."
                //     )
                // z.string().min(2)
                // ])
            }),
            // }),
            z.object({
                interactions:
                    // z.object({
                    //     label:
                    z.union([
                        z.literal("follow_up_questions"),
                        z.literal("further_explanations"),
                        z.literal("examples"),
                        z.literal("none")
                    ])

                // value: z.union([
                //     z.literal(
                //         "Provide additional explanations and context where necessary."
                //     ),
                //     z.literal(
                //         "Include examples to illustrate complex concepts."
                //     ),
                //     z.literal(
                //         "Offer follow-up questions to deepen understanding."
                //     ),
                //     z.literal("")
                // ])
                // })
            })
        ])
    ),
    applicationSettings: z.array(
        z
            .object({
                translateToLanguage: z.union([
                    z.literal("spanish"),
                    z.literal("english")
                ])

                // translateToLanguage: z.object({
                //     // value: z.object({
                //     id: z.enum(["es", "en-AU"]),
                //     language: z.enum(["spanish", "english"])
                //     // })
                // })
            })
            .nullable()
    )
});

const formSchema = z.object({
    geminiApi: z.string().min(1, {
        message: "Your Gemini API key cannot be blank."
    }),
    whisperApi: z.string(),
    preferences: preferencesSchema
});

export const PreferencesForm = ({
    setView
}: {
    setView: (value: AvailableViews) => void;
}) => {
    const {
        geminiApiKey,
        setGeminiApiKey,
        whisperApiKey,
        setWhisperAPIKey,
        preferencesState,
        savePreferencesState
    } = useAppStore();

    const [apiKeysLoading, setApiKeysLoading] = useState(false);
    const [preferencesLoading, setPreferencesLoading] = useState(false);
    const [error, setError] = useState({ display: false, message: "" });

    const { aiSettings, applicationSettings } = preferencesState;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            geminiApi: geminiApiKey,
            whisperApi: whisperApiKey || "",
            preferences: {
                aiSettings: [
                    {
                        characteristics:
                            (aiSettings[0] as AiCharacteristics).characteristics
                                .label || "simplicity"
                    },
                    {
                        interactions:
                            (aiSettings[1] as AiInteractions).interactions
                                .label || "follow_up_questions"
                    }
                ],
                applicationSettings: [
                    {
                        translateToLanguage:
                            applicationSettings[0]?.translateToLanguage.value
                                .language || null
                    }
                ]
            }
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { geminiApi, whisperApi, preferences } = values;

        setPreferencesLoading(true);
        // API Keys
        if (geminiApi.length > 0) {
            if (geminiApi !== geminiApiKey) {
                setApiKeysLoading(true);
                try {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const model = genAI.getGenerativeModel({
                        model: "gemini-pro"
                    });

                    const result = await model.generateContent("Hello Gemini");
                    const response = await result.response;
                    const text = response.text();

                    if (text) {
                        // console.log(text);

                        const res = await storeGeminiApiKey(geminiApi);

                        if (res.success) {
                            setGeminiApiKey(geminiApi);
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
                    if (whisperApi.length === 0) {
                        setApiKeysLoading(false);
                    }
                }
            } // else clause not required, not changing key.

            // whisper stuff

            if (
                whisperApi &&
                whisperApi.length > 2 &&
                whisperApi !== whisperApiKey
            ) {
                try {
                    const response = await fetch(
                        "https://api.openai.com/v1/audio/speech",
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${whisperApi}`,
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
                        const res = await storeWhisperApiKey(whisperApi);

                        if (res.success) {
                            setWhisperAPIKey(whisperApi);
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
        } else {
            // handle case of user trying to remove their gemini api key
            handleRemoveApiKey("googleGeminiApiKey");
        }

        // TODO: redo all of this... confusing and inefficient
        // update preferences

        // @ts-expect-error
        const characteristicLabel = preferences.aiSettings[0].characteristics;

        // @ts-expect-error

        const interactionLabel = preferences.aiSettings[1].interactions;

        const translateLanguageLabel =
            preferences.applicationSettings[0].translateToLanguage;

        // console.log(characteristicLabel);
        // console.log(interactionLabel);
        // console.log(translateLanguageLabel);

        const newPreferences: Preferences = {
            aiSettings: [
                {
                    characteristics: {
                        label: characteristicLabel,
                        value: AI_CHARACTERISTICS_VALUE[
                            characteristicLabel.toUpperCase()
                        ]
                    }
                },
                {
                    interactions: {
                        label: interactionLabel,
                        value: AI_INTERACTIONS_VALUE[
                            interactionLabel.toUpperCase()
                        ]
                    }
                }
            ],
            applicationSettings: [
                {
                    translateToLanguage: {
                        value: TRANSLATE_LANGUAGES[
                            translateLanguageLabel.toUpperCase()
                        ]
                    }
                }
            ]
        };

        try {
            const preferencesResponse = await savePreferences(newPreferences);
            if (preferencesResponse.success) {
                savePreferencesState(newPreferences);
            } else {
                setError({
                    display: true,
                    message:
                        "Error when setting preferences! See message: " +
                        preferencesResponse.message
                });
            }
        } catch (error) {
            setError({
                display: true,
                message: "Something went wrong while trying to set preferences."
            });
        } finally {
            setPreferencesLoading(false);
            setView("main");
        }

        // console.log(newPreferences);
    }

    function handleResetForm() {
        form.setValue("geminiApi", geminiApiKey);
        form.setValue("whisperApi", whisperApiKey);
        form.setValue("preferences", {
            aiSettings: [
                {
                    characteristics:
                        (aiSettings[0] as AiCharacteristics).characteristics
                            .label || "simplicity"
                },
                {
                    interactions:
                        (aiSettings[1] as AiInteractions).interactions.label ||
                        "follow_up_questions"
                }
            ],
            applicationSettings: [
                {
                    translateToLanguage:
                        applicationSettings[0]?.translateToLanguage.value
                            .language || null
                }
            ]
        });
    }

    // function handleSave() {
    //     console.log("hit");
    // }

    async function handleRemoveApiKey(
        name: "googleGeminiApiKey" | "whisperApiKey"
    ) {
        const res = await removeApiKey(name);
        if (res.success) {
            if (name === "googleGeminiApiKey") {
                setGeminiApiKey(null);
                // push to main view
                // TODO: add toast notifications.
            } else {
                form.setValue("whisperApi", "");
                setWhisperAPIKey(null);
            }
        } else {
            console.warn(
                "Error! Could not remove api key. Failed with Error: ",
                res.error
            );
        }
    }

    return (
        <>
            <div className="w-full flex flex-wrap whitespace-normal">
                <span className="text-red-500 text-lg font-semibold">
                    {error.display && error.message}
                </span>
            </div>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8">
                    <section id="ai-settings">
                        <Card className="p-0">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    AI Settings
                                </CardTitle>
                                <CardDescription>
                                    Adjust how you and Gemini interact, and
                                    modify Gemini's characteristics.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="preferences.aiSettings.0.characteristics"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex w-full items-center justify-between">
                                                <FormLabel>
                                                    Characteristics
                                                </FormLabel>
                                            </div>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a characteristic." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(
                                                        AI_CHARACTERISTICS
                                                    ).map((val, index) => (
                                                        <SelectItem
                                                            key={index}
                                                            value={val}>
                                                            {val}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {field.value && (
                                                <FormDescription className="text-muted-foreground">
                                                    {
                                                        AI_CHARACTERISTICS_VALUE[
                                                            field.value.toUpperCase() as keyof typeof AI_CHARACTERISTICS_VALUE
                                                        ]
                                                    }
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="preferences.aiSettings.1.interactions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex w-full items-center justify-between">
                                                <FormLabel>
                                                    Gemini Interactions
                                                </FormLabel>
                                            </div>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder={
                                                                field.value
                                                            }
                                                        />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(
                                                        AI_INTERACTIONS
                                                    ).map((val, index) => (
                                                        <SelectItem
                                                            key={index}
                                                            value={val}>
                                                            {val}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {field.value && (
                                                <FormDescription className="text-muted-foreground">
                                                    {
                                                        AI_INTERACTIONS_VALUE[
                                                            field.value.toUpperCase() as keyof typeof AI_INTERACTIONS_VALUE
                                                        ]
                                                    }
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </section>

                    <section id="application-settings">
                        <Card className="p-0">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Application Settings
                                </CardTitle>
                                <CardDescription>
                                    Change your translated language. There are
                                    more settings and language options coming
                                    soon!
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="preferences.applicationSettings.0.translateToLanguage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex w-full items-center justify-between">
                                                <FormLabel className="capitalize">
                                                    Language to translate to
                                                </FormLabel>
                                            </div>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a language" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(
                                                        TRANSLATE_LANGUAGES
                                                    ).map((val, index) => (
                                                        <SelectItem
                                                            key={index}
                                                            value={
                                                                val.language
                                                            }>
                                                            {val.language}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </section>

                    <section id="api-keys">
                        <Card className="p-0">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Api Keys
                                </CardTitle>
                                <CardDescription>
                                    Add, change, or remove both your Gemini API
                                    Key and OpenAI Whisper API key below.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="geminiApi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex w-full items-center justify-between">
                                                <FormLabel>
                                                    Gemini API Key
                                                </FormLabel>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="outline"
                                                    className="rounded-full h-6 w-6 hover:bg-red-600"
                                                    title="Remove API Key"
                                                    onClick={() =>
                                                        handleRemoveApiKey(
                                                            "googleGeminiApiKey"
                                                        )
                                                    }>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    placeholder="vw0Zo..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-muted-foreground">
                                                Here you can change or remove
                                                your Gemini API key. Remember,
                                                to use this extension you must
                                                have a valid gemini API key. You
                                                can{" "}
                                                <a
                                                    href="https://ai.google.dev/gemini-api/docs/api-key"
                                                    target="_blank"
                                                    className="underline font-bold">
                                                    follow this link
                                                </a>{" "}
                                                to learn how to get your own.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="whisperApi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex w-full items-center justify-between">
                                                <FormLabel>
                                                    Whisper API Key{" "}
                                                    <span className="text-muted">
                                                        (optional)
                                                    </span>
                                                </FormLabel>
                                                {whisperApiKey && (
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="outline"
                                                        className="rounded-full h-6 w-6 hover:bg-red-600"
                                                        title="Remove API Key"
                                                        onClick={() =>
                                                            handleRemoveApiKey(
                                                                "whisperApiKey"
                                                            )
                                                        }>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <FormControl>
                                                <Input
                                                    placeholder="vw0Zo..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-muted-foreground">
                                                Here you can add, remove, or
                                                change your OpenAI Whisper API
                                                key.{" "}
                                                <a
                                                    href="https://platform.openai.com/api-keys"
                                                    target="_blank"
                                                    className="underline font-bold">
                                                    following this link.
                                                </a>{" "}
                                                to learn how to get your own.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </section>

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex gap-x-2 items-center"
                            onClick={handleResetForm}>
                            Reset <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button type="submit" variant="default" className="">
                            {preferencesLoading || apiKeysLoading ? (
                                <span>Loading...</span>
                            ) : (
                                <span className="flex gap-x-2 items-center">
                                    Save
                                    <Check className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
};
