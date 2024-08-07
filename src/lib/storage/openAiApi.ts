import { getApiKey } from "./secure";

// TODO: pass this api key... will all be changed when I move api requests to background script anyway... this is slow.
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

export const getTranscription = async (
    audioBlob: Blob
): Promise<{ success: boolean; message: string; transcript: any | null }> => {
    try {
        const apiKeyRes = await getApiKey("whisperApiKey");

        if (apiKeyRes.success) {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.mp3");
            formData.append("timestamp_granularities[]", "word");
            formData.append("timestamp_granularities[]", "sentence");
            formData.append("model", "whisper-1");
            formData.append("response_format", "verbose_json");

            const response = await fetch(
                "https://api.openai.com/v1/audio/transcriptions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKeyRes.data}`
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    message: "Could not parse response from Whisper API",
                    transcript: null
                };
            }

            const result = await response.json();

            return {
                success: true,
                message: "Successfully retrieved transcription!",
                transcript: result
            };
        } else {
            return {
                success: false,
                message: "Could not retrieve API key",
                transcript: null
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `An error occurred: ${error}`,
            transcript: null
        };
    }
};
