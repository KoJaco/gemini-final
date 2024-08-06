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
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { removeApiKey } from "@/lib/storage/secure";
import { useAppStore } from "@/lib/stores/appStore";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Props = {
    currentValues: any;
    setGeminiApiKey: (value: string) => void;
    setWhisperApiKey: (value: string) => void;
};

const formSchema = z.object({
    geminiApi: z.string().min(1, {
        message: "Your Gemini API key cannot be blank."
    }),
    whisperApi: z
        .string()
        .min(1, {
            message: "Your OpenAI whisper API key cannot be blank."
        })
        .nullable()
});

export const PreferencesForm = () => {
    const { geminiApiKey, setGeminiApiKey, whisperApiKey, setWhisperAPiKey } =
        useAppStore();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            geminiApi: geminiApiKey,
            whisperApi: whisperApiKey
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
    }

    async function handleRemoveApiKey(
        name: "googleGeminiApiKey" | "whisperApiKey"
    ) {
        const res = await removeApiKey(name);
        if (res.success) {
            if (name === "googleGeminiApiKey") {
                setGeminiApiKey(null);
                // TODO: add toast notifications.
            } else {
                setWhisperAPiKey(null);
            }
        } else {
            console.warn(
                "Error! Could not remove api key. Failed with Error: ",
                res.error
            );
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <section id="api-keys">
                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle className="text-lg">Api Keys</CardTitle>
                            <CardDescription>
                                Add, change, or remove both your Gemini API Key
                                and OpenAI Whisper API key below.
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
                                            Here you can change or remove your
                                            Gemini API key. Remember, to use
                                            this extension you must have a valid
                                            gemini API key. You can{" "}
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
                                                Whisper API Key
                                            </FormLabel>
                                            {whisperApiKey && (
                                                <Button
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
                                            Here you can add, remove, or change
                                            your OpenAI Whisper API key.{" "}
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
                                            to learn how to get your own.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </section>

                <section id="gemini-behavior">
                    {/*  */}
                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Gemini Behavior
                            </CardTitle>
                            <CardDescription>
                                Adjust how you and Gemini interact, how Gemini
                                interacts with each website, and modify Gemini's
                                characteristics.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-8"></CardContent>
                    </Card>
                </section>

                <section id="application-settings">
                    {/* suggested questions to further understand the text:  */}
                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Application Settings
                            </CardTitle>
                            <CardDescription>
                                Change your translated language, automatic
                                readout, suggested questions to further
                                understand text.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-8"></CardContent>
                    </Card>
                </section>
            </form>
        </Form>
    );
};
