"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { GoogleIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase/firebase-client";
import useFirebaseUser from "@/lib/firebase/hooks/use-firebase-user";
import type { AvailableInitialViews } from "@/lib/types";
import clsx from "clsx";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    type UserCredential
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

// https://docs.stripe.com/checkout/embedded/quickstart

// TODO: FUUUCCCKKKK, stripe script cannot be accessed due to CORS policy... need to push users to a hosted webpage... could be v simple.

type Props = {
    setInitialView: (value: AvailableInitialViews) => void;
};

// don't want to recreate stripe object on every render...
// const stripePromise = loadStripe(
//     process.env.PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY
// );

type SignUpStateKey = "auth" | "plan" | "review" | "payment" | "completed";

type Plan = {
    id: string;
    title: string;
    features: string[];
    price: string;
    frequency: string;
};

interface SignUpState {
    auth: {
        signUpSuccessful: boolean;
        user: UserCredential | null;
        error: string;
    };
    plan: {
        selectedPlan: Plan;
    };
    payment: {
        cardDetailsSuccessful: boolean;
        // method: string | PaymentMethod;
        method: string;
        error: string;
    };
    review: {
        userHasAcknowledged: boolean;
        success: boolean;
        error: string;
    };
}

const signUpStages = ["auth", "plan", "review", "payment", "completed"];

const FREE_TRIAL_PLAN: Plan = {
    id: "free-trial",
    title: "Free Trial",
    features: [
        "Usage-restricted access to all features",
        "Limited support",
        "7-day access"
    ],
    price: "$0",
    frequency: "One-time" // or "Free" if you prefer
};

const PAID_PLAN: Plan = {
    id: "paid-plan",
    title: "Pro Plan",
    features: [
        "Unlimited access to all features",
        "Priority support",
        "Includes future updates"
    ],
    price: "$20",
    frequency: "Monthly"
};

const plans = [FREE_TRIAL_PLAN, PAID_PLAN];

export function SignUpFlow({ setInitialView }: Props) {
    const { isLoading, onLogin, onLogout } = useFirebaseUser();

    const [signUpState, setSignUpState] = useState<SignUpState>({
        auth: {
            signUpSuccessful: false,
            user: null,
            error: ""
        },
        plan: {
            selectedPlan: PAID_PLAN
        },
        payment: {
            cardDetailsSuccessful: false,
            method: "",
            error: ""
        },
        review: {
            userHasAcknowledged: false,
            success: false,
            error: ""
        }
    });

    const [currentSignUpState, setCurrentSignUpState] =
        useState<SignUpStateKey>("auth");

    const handleNextStage = (nextStage: SignUpStateKey) => {
        setCurrentSignUpState(nextStage);
    };

    const handlePreviousStage = (prevStage: SignUpStateKey) => {
        setCurrentSignUpState(prevStage);
    };

    return (
        <div className="space-y-4">
            {/* status indicator */}
            <div className="w-full flex gap-x-4 items-center justify-center">
                {signUpStages.map((stage: SignUpStateKey, index) => {
                    const activeIndex =
                        signUpStages.indexOf(currentSignUpState);

                    // const nextStage = index === signUpStages.length - 1 ? null : signUpStages[index + 1]

                    // const prevStage = index === 0 ? null : signUpStages[index-1]

                    return (
                        <button
                            key={index}
                            onClick={() => setCurrentSignUpState(stage)}
                            className="flex items-end gap-x-1">
                            <span
                                className={clsx(
                                    "text-md",
                                    activeIndex === index
                                        ? "opacity-100"
                                        : "opacity-50"
                                )}>
                                {index + 1}
                            </span>
                            {/* <span
                                className={clsx(
                                    "bg-primary w-1 h-1 flex rounded-full",
                                    activeIndex === index
                                        ? "opacity-100 scale-150"
                                        : "opacity-50"
                                )}
                            /> */}
                            <span
                                className={clsx(
                                    "bg-primary h-[2px] flex rounded-full transition-all duration-300 mb-1",
                                    activeIndex === index
                                        ? "w-[100px] opacity-100"
                                        : "w-[2px] opacity-50"
                                )}
                            />
                        </button>
                    );
                })}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="capitalize text-xl">
                        {currentSignUpState === "auth" && "Create an Account"}
                        {currentSignUpState === "plan" && "Select a plan"}
                        {currentSignUpState === "review" &&
                            "Review your information"}
                        {currentSignUpState === "payment" &&
                            "Enter payment details"}
                    </CardTitle>
                </CardHeader>

                {/* render out forms based on stage */}
                <CardContent>
                    {currentSignUpState === "auth" && (
                        <SignUpForm
                            signUpState={signUpState}
                            setSignUpState={setSignUpState}
                            onNext={() => setCurrentSignUpState("plan")}
                        />
                    )}

                    {currentSignUpState === "plan" && (
                        <PlanSelectionForm
                            signUpState={signUpState}
                            setSignUpState={setSignUpState}
                            onNext={() => setCurrentSignUpState("review")}
                            onPrevious={() => setCurrentSignUpState("plan")}
                        />
                    )}
                    {currentSignUpState === "review" && (
                        <Review
                            signUpState={signUpState}
                            setSignUpState={setSignUpState}
                            onNext={() => setCurrentSignUpState("payment")}
                            onPrevious={() => setCurrentSignUpState("plan")}
                        />
                    )}
                    {/* {currentSignUpState === "payment" && (
                        <Elements stripe={stripePromise}>
                            <PaymentSetupForm
                                signUpState={signUpState}
                                setSignUpState={setSignUpState}
                                onNext={() =>
                                    setCurrentSignUpState("completed")
                                }
                            />
                        </Elements>

                    )} */}
                </CardContent>
                <CardFooter>
                    {currentSignUpState === "auth" && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-light text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInitialView("login");
                                    }}
                                    className="text-primary font-semibold hover:underline ml-2">
                                    Log in
                                </button>
                            </p>
                        </div>
                    )}

                    {/* add previous and next here... */}
                </CardFooter>
            </Card>

            <div></div>
        </div>
    );
}

type SignUpFormProps = {
    signUpState: SignUpState;
    setSignUpState: (value: SignUpState) => void;
    onNext: (value: "payment") => void;
};

export function SignUpForm({
    signUpState,
    setSignUpState,
    onNext
}: SignUpFormProps) {
    const [email, setEmail] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [password, setPassword] = useState("");

    const handleSignUp = async (e: any) => {
        try {
            if (!email || !password || !confirmPassword) {
                setSignUpState({
                    ...signUpState,
                    auth: {
                        ...signUpState.auth,
                        error: "Please enter email and password"
                    }
                });
                return;
            }

            if (password !== confirmPassword) {
                setSignUpState({
                    ...signUpState,
                    auth: {
                        ...signUpState.auth,
                        error: "Passwords do not match."
                    }
                });
                return;
            }

            e.preventDefault();

            const userRes = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            // onLogin();

            if (userRes) {
                setSignUpState({
                    ...signUpState,
                    auth: { signUpSuccessful: true, user: userRes, error: "" }
                });
                onNext("payment");
            } else {
                setSignUpState({
                    ...signUpState,
                    auth: {
                        signUpSuccessful: false,
                        user: null,
                        error: "Unable to retrieve user credentials from Google."
                    }
                });
            }
        } catch (error: any) {
            console.log(error.message);
            setSignUpState({
                ...signUpState,
                auth: {
                    signUpSuccessful: false,
                    user: null,
                    error: `Error! An error occurred during sign-up: ${error.message || error}`
                }
            });
        } finally {
            if (!signUpState.auth.error.length) {
                setEmail("");
                setPassword("");
                setConfirmPassword("");
            }
        }
    };

    const handleSignUpWithPopup = async (e: any) => {
        console.log("Before logic");
        const google = new GoogleAuthProvider();

        console.log("init Google");

        try {
            const userRes: UserCredential = await signInWithPopup(auth, google);

            console.log("userRes", userRes);

            if (userRes) {
                // handle the successful sign-up of a user. Store this for now until they put payment details in. Don't know if I should send this to backend yet and save to a DB if Stripe payment is not secured...

                setSignUpState({
                    ...signUpState,
                    auth: { signUpSuccessful: true, user: userRes, error: "" }
                });
                onNext("payment");
            } else {
                setSignUpState({
                    ...signUpState,
                    auth: {
                        signUpSuccessful: false,
                        user: null,
                        error: "Unable to retrieve user credentials from Google."
                    }
                });
            }
        } catch (error) {
            setSignUpState({
                ...signUpState,
                auth: {
                    signUpSuccessful: false,
                    user: null,
                    error: `Error! An error occurred during sign-up: ${error.message || error}`
                }
            });
        }
    };

    return (
        <form onSubmit={handleSignUp} className="flex flex-col w-full gap-y-4">
            <div className="flex w-full">
                <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={handleSignUpWithPopup}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </div>
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
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="me@example.com"
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" required />
            </div>

            <div className="grid w-full">
                <Button type="submit">Create Account</Button>
            </div>
        </form>
    );
}

type PlanSelectionFormProps = {
    signUpState: SignUpState;
    setSignUpState: (value: SignUpState) => void;
    onNext: () => void;
    onPrevious: () => void;
};

export function PlanSelectionForm({
    signUpState,
    setSignUpState,
    onNext,
    onPrevious
}: PlanSelectionFormProps) {
    const handlePlanSelect = (plan: Plan) => {
        setSignUpState({
            ...signUpState,
            plan: {
                selectedPlan: plan
            }
        });
    };

    return (
        <div>
            <div className="grid gap-8">
                {plans.map((plan) => {
                    const isCurrent =
                        signUpState.plan.selectedPlan.id === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={clsx(
                                "rounded-lg border space-y-2 p-4",
                                isCurrent
                                    ? "border-primary/75 bg-muted/25"
                                    : "border-muted/75"
                            )}>
                            <h2 className="text-lg text-primary/90">
                                Companion - {plan.title}
                            </h2>
                            <div className="flex flex-col gap-y-2 text-muted-foreground">
                                <p>
                                    {plan.price} / <span>{plan.frequency}</span>
                                </p>

                                <ul className="text-primary/75 list-disc ml-4">
                                    {plan.features.map((f, index) => (
                                        <li key={index}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full mt-4"
                                onClick={() => handlePlanSelect(plan)}>
                                Select Plan
                            </Button>
                        </div>
                    );
                })}
            </div>
            <div className="mt-8">
                <Button
                    onClick={() => onNext()}
                    className="w-full max-w-[300px]">
                    Continue
                </Button>
            </div>
        </div>
    );
}

type PaymentSetupFormProps = {
    signUpState: SignUpState;
    setSignUpState: (value: SignUpState) => void;
    onNext: () => void;
};

const PaymentSetupForm = ({
    signUpState,
    setSignUpState,
    onNext
}: PaymentSetupFormProps) => {
    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
        // Fetch Setup Intent client secret from your backend
        fetch("/v1/stripe/create-setup-intent", {
            method: "POST"
        })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret));
    }, []);

    return (
        <form>
            {/* <CardElement /> */}
            <button type="submit">Save Card Details</button>
        </form>
        // <div id="checkout">
        //     <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        //         <EmbeddedCheckout />
        //     </EmbeddedCheckoutProvider>
        //     <div>
        //         <Button type="button" onClick={onPrevious}></Button>
        //     </div>
        // </div>
    );
};

type ReviewFormProps = {
    signUpState: SignUpState;
    setSignUpState: (state: SignUpState) => void;
    onNext: () => void;
    onPrevious: () => void;
};

export function Review({
    signUpState,
    setSignUpState,
    onNext,
    onPrevious
}: ReviewFormProps) {
    const handleConfirm = async () => {
        // Create Payment Intent when user confirms
        const response = await fetch("/v1/stripe/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paymentMethodId: signUpState.payment.method,
                amount: 5000, // Example amount in cents
                currency: "usd"
            })
        });

        const { clientSecret } = await response.json();

        if (clientSecret) {
            setSignUpState({
                ...signUpState,
                review: { userHasAcknowledged: true, success: true, error: "" }
            });
            // Proceed to next step or finalize the sign-up
            onNext();
        } else {
            setSignUpState({
                ...signUpState,
                review: {
                    userHasAcknowledged: true,
                    success: false,
                    error: "Failed to process payment"
                }
            });
        }
    };

    return (
        <div>
            <h3>Review your details</h3>
            <p>Plan: {signUpState.plan.selectedPlan.title}</p>
            <p>Amount: {signUpState.plan.selectedPlan.price}</p>
            <button onClick={handleConfirm}>Confirm and Pay</button>
        </div>
    );
}
