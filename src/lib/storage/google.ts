async function synthesizeSpeech(text) {
    const response = await fetch("/api/google/tts", {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({ text })
    });

    const data = await response.json();
    return data.audioContent;
}

async function transcribeAudio(audioContent) {
    const response = await fetch("/api/google/stt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ audioContent })
    });
    const data = await response.json();
    return data.transcript;
}
