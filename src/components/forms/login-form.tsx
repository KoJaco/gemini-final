"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailableInitialViews } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import * as React from "react";

import { Checkbox } from "../ui/checkbox";
import { GoogleIcon } from "../ui/icons";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    setInitialView: (value: AvailableInitialViews) => void;
}

export function LoginForm({ className, setInitialView, ...props }: Props) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
        }, 3000);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="capitalize text-2xl font-bold mb-4">
                    Login to Companion
                </CardTitle>
                <CardDescription>
                    <span className="mb-4">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Tempora distinctio aliquid dolorum ullam voluptas
                        impedit accusamus commodi quae nesciunt eveniet ducimus
                        corporis, molestiae excepturi aspernatur.
                    </span>
                </CardDescription>
            </CardHeader>

            <CardContent className={cn("grid gap-6", className)} {...props}>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-2">
                        <div className="grid gap-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                required
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="email">Password</Label>
                            <Input
                                id="email"
                                required
                                type="password"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex justify-between my-2">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <Checkbox
                                        id="remember"
                                        aria-describedby="remember"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label
                                        htmlFor="remember"
                                        className="text-muted-foreground">
                                        Remember me
                                    </label>
                                </div>
                            </div>
                            <a
                                href="#"
                                className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline">
                                Forgot password?
                            </a>
                        </div>
                        <Button disabled={isLoading} variant="default">
                            {isLoading && (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In with Email
                        </Button>
                    </div>
                </form>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <Button variant="outline" type="button" disabled={isLoading}>
                    {isLoading ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <GoogleIcon className="mr-2 w-4 h-4" />
                    )}{" "}
                    Google
                </Button>

                <div className="mt-4 space-y-2">
                    <p className="text-sm font-light text-muted-foreground">
                        Don&apos;t have an account yet?{" "}
                        <button
                            type="button"
                            onClick={() => {
                                setInitialView("signup");
                            }}
                            className="text-primary font-semibold hover:underline ml-2">
                            Sign up
                        </button>
                    </p>
                    <p className="text-sm font-light text-muted-foreground">
                        Want to use your own API keys?{" "}
                        <button
                            type="button"
                            onClick={() => {
                                setInitialView("api-keys");
                            }}
                            className="text-primary font-semibold hover:underline ml-2">
                            Click here
                        </button>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
