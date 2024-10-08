import type { Preferences } from "@/lib/types";

import { SecureStorage } from "@plasmohq/storage/secure";

import type { ResultObject } from "../types";

const storage = new SecureStorage();
const password = process.env.PLASMO_PUBLIC_SECURE_STORAGE_PASSWORD || "";

if (!password || password.length === 0) {
    console.error(
        "Secure Storage Password is not defined in environment file."
    );
}

// API keys are kept separate to preferences...
// Set Preferences
export const savePreferences = async (
    preferences: Preferences
): Promise<ResultObject> => {
    try {
        await storage.setPassword(password);
        await storage.set("preferences", JSON.stringify(preferences));
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error as Error,
            message: (error as Error).message
        };
    }
};

// Get Preferences
export const getPreferences = async (): Promise<{
    success: boolean;
    data?: Preferences;
    error?: string;
}> => {
    try {
        await storage.setPassword(password);
        const res = await storage.get("preferences");
        if (res) {
            const preferences: Preferences = JSON.parse(res);
            return { success: true, data: preferences };
        } else {
            return { success: false, error: "Preferences not found" };
        }
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const storeGeminiApiKey = async (
    geminiApiKey: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        await storage.setPassword(password);
        await storage.set("googleGeminiApiKey", geminiApiKey);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const storeWhisperApiKey = async (
    whisperApiKey: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        await storage.setPassword(password);
        await storage.set("whisperApiKey", whisperApiKey);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const getApiKey = async (
    name: "googleGeminiApiKey" | "whisperApiKey"
): Promise<{
    success: boolean;
    data?: string;
    error?: string;
}> => {
    try {
        await storage.setPassword(password);
        const res = await storage.get(name);
        if (res) {
            return { success: true, data: res };
        } else {
            return { success: false, error: `${name} not found` };
        }
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const removeApiKey = async (
    name: "googleGeminiApiKey" | "whisperApiKey"
): Promise<ResultObject> => {
    try {
        await storage.setPassword(password);
        await storage.remove(name);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error as Error,
            message: error.message
        };
    }
};
