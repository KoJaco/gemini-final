import { getApiKey } from "./secure";

export const requestTTS = async (
    text: string
): Promise<{ success: boolean; message: string; data: Blob | null }> => {
    try {
        const apiKeyRes = await getApiKey("whisperApiKey");

        if (apiKeyRes.success) {
            const response = await fetch(
                "https://api.openai.com/v1/audio/speech",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKeyRes.data}`,
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "tts-1",
                        input: text,
                        voice: "alloy"
                    })
                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    message: "Could not parse response from Whisper API",
                    data: null
                };
            }

            const audioBlob = await response.blob();

            return {
                success: true,
                message: "Successfully transcribed text-to-speech!",
                data: audioBlob
            };
        } else {
            return {
                success: false,
                message: "Could not retrieve API key",
                data: null
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `An error occurred: ${error}`,
            data: null
        };
    }
};
