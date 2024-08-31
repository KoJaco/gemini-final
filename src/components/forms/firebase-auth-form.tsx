import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { auth } from "@/lib/firebase/firebase-client";
import useFirebaseUser from "@/lib/firebase/hooks/use-firebase-user";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import React, { useState } from "react";

export default function FirebaseAuthForm() {
    const [showLogin, setShowLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [password, setPassword] = useState("");
    const { isLoading, onLogin, onLogout } = useFirebaseUser();

    const signIn = async (e: any) => {
        if (!email || !password)
            return console.log("Please enter email and password");

        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            onLogin();
        }
    };

    const signUp = async (e: any) => {
        try {
            if (!email || !password || !confirmPassword)
                return console.log("Please enter email and password");

            if (password !== confirmPassword)
                return console.log("Passwords do not match");

            e.preventDefault();

            const user = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            onLogin();
            return {
                success: true,
                message: `Successfully created new user with email '${email}'`,
                data: user
            };
        } catch (error: any) {
            console.log(error.message);
            return { success: false, message: error.message, data: null };
        } finally {
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        }
    };

    // const signOut = async (e: any) => {
    //     e.preventDefault();

    //     try {
    //         await onLogout();
    //     } catch (error) {
    //         console.log(error);
    //     }
    // };

    return (
        <Card className="shadow-lg w-full h-auto">
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

            <CardContent>
                {!showLogin && !isLoading && (
                    <form className="space-y-4 md:space-y-6" onSubmit={signUp}>
                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-2 text-sm font-medium text-gray-900">
                                Your email
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-medium text-gray-900">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                placeholder="••••••••"
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="block mb-2 text-sm font-medium text-gray-900">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                name="confirm-password"
                                id="confirm-password"
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                value={confirmPassword}
                                placeholder="••••••••"
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                required
                            />
                        </div>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    aria-describedby="terms"
                                    type="checkbox"
                                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                                    required
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label
                                    htmlFor="terms"
                                    className="font-light text-gray-500">
                                    I accept the{" "}
                                    <a
                                        className="font-medium text-primary-600 hover:underline"
                                        href="#">
                                        Terms and Conditions
                                    </a>
                                </label>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full text-black bg-gray-300 hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            Create an account
                        </button>
                        <p className="text-sm font-light text-gray-500">
                            Already have an account?{" "}
                            <button
                                onClick={() => setShowLogin(true)}
                                className="bg-transparent font-medium text-primary-600 hover:underline">
                                Login here
                            </button>
                        </p>
                    </form>
                )}
                {showLogin && !isLoading && (
                    <form className="space-y-4 md:space-y-6" onSubmit={signIn}>
                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-2 text-sm font-medium text-gray-900">
                                Your email
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-medium text-gray-900">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                placeholder="••••••••"
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="remember"
                                        aria-describedby="remember"
                                        type="checkbox"
                                        className="w-4 h-4 border border-gray-300 rounded accent-primary bg-gray-50 focus:ring-3 focus:ring-primary"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label
                                        htmlFor="remember"
                                        className="text-gray-500 ">
                                        Remember me
                                    </label>
                                </div>
                            </div>
                            <a
                                href="#"
                                className="text-sm font-medium text-primary-600 hover:underline">
                                Forgot password?
                            </a>
                        </div>
                        <button
                            type="submit"
                            className="w-full text-black bg-gray-300 hover:bg-primary-dark focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            Sign in
                        </button>
                        <p className="text-sm font-light text-gray-500">
                            Don&apos;t have an account yet?{" "}
                            <button
                                onClick={() => setShowLogin(false)}
                                className="bg-transparent font-medium text-primary-600 hover:underline">
                                Sign up
                            </button>
                        </p>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
