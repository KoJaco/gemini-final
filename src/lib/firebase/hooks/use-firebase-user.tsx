// src/firebase/useFirebaseUser.tsx

import {
    browserLocalPersistence,
    onAuthStateChanged,
    setPersistence,
    type User
} from "firebase/auth";
import { useEffect, useState } from "react";

import { sendToBackground } from "@plasmohq/messaging";

import { auth } from "../firebase-client";

setPersistence(auth, browserLocalPersistence);

export default function useFirebaseUser() {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const onLogout = async () => {
        setIsLoading(true);
        if (user) {
            await auth.signOut();

            await sendToBackground({
                name: "removeAuth",
                body: {}
            });
        }
    };

    const onLogin = () => {
        if (!user) return;

        const uid = user.uid;

        // Get current user auth token
        user.getIdToken(true).then(async (token) => {
            // Send token to background to save
            await sendToBackground({
                name: "saveAuth",
                body: {
                    token,
                    uid,
                    refreshToken: user.refreshToken
                }
            });
        });
    };

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            setIsLoading(false);
            setUser(user);
        });
    }, []);

    useEffect(() => {
        if (user) {
            onLogin();
        }
    }, [user]);

    return {
        isLoading,
        user,
        onLogin,
        onLogout
    };
}
