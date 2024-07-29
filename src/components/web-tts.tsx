"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";

interface TranscriptWord {
    word: string;
    id: string;
    startTime: number;
    endTime: number;
}

const WebTTS = ({ text }: { text: string }) => {
    const [speaking, setSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptWord[]>([]);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        generateTranscript(text);
    }, [text]);

    //   useEffect(() => {
    //     const synth = synthRef.current
    //     const utterance = utteranceRef.current

    //     utterance.text = text
    //     utterance.lang = "en-US"

    //     utterance.onstart = () => {
    //       setSpeaking(true)
    //       //   generateTranscript(utterance.text)
    //     }

    //     utterance.onend = () => setSpeaking(false)
    //     utterance.onerror = (event) =>
    //       console.error("SpeechSynthesisUtterance.onerror", event)

    //     utterance.onboundary = (event: SpeechSynthesisEvent) => {
    //       console.log(event)

    //       if (event.name === "word") {
    //         highlightWord(event.charIndex)
    //       }

    //       //   if (event.name === 'sentence') {
    //       //     highlightSentence(event.charIndex)
    //       //   }
    //     }

    //     synth.speak(utterance)

    //     return () => {
    //       synth.cancel()
    //     }
    //   }, [text])

    const generateTranscript = (text: string) => {
        const words = text.split(" ").map((word, index) => ({
            word,
            id: `word-${index}`,
            startTime: 0,
            endTime: 0
        }));

        setTranscript(words);
    };

    const highlightWord = (charIndex: number) => {
        let cumulativeLength = 0;
        for (const word of transcript) {
            const wordSpan = document.getElementById(word.id);
            if (wordSpan) {
                wordSpan.style.backgroundColor = ""; // Clear previous highlights
                wordSpan.style.color = "";
            }
            cumulativeLength += word.word.length + 1; // +1 for the space
            if (cumulativeLength > charIndex) {
                if (wordSpan) {
                    wordSpan.style.backgroundColor = "yellow";
                    wordSpan.style.color = "black";
                }
                break;
            }
        }
    };

    const handlePlay = () => {
        const synth = synthRef.current;
        const utterance = new SpeechSynthesisUtterance(text);

        // utterance.text = text
        utterance.lang = "en-AU";

        // Event handlers
        utterance.onstart = () => {
            setSpeaking(true);
        };

        utterance.onend = () => setSpeaking(false);
        utterance.onerror = (event) => {
            if (event.error === "interrupted") {
                return;
            } else {
                console.error("SpeechSynthesisUtterance.onerror", event);
            }
        };

        // utterance.addEventListener("boundary", (event: SpeechSynthesisEvent) => {
        //   console.log(
        //     `${event.name} boundary reached after ${event.elapsedTime} seconds.`
        //   )
        // })

        console.log(utterance);

        utterance.onboundary = (event: SpeechSynthesisEvent) => {
            console.log(
                `${event.name} boundary reached after ${event.elapsedTime} seconds.`
            );
            if (event.name === "word") {
                highlightWord(event.charIndex);
            }
        };

        synth.speak(utterance);
        utteranceRef.current = utterance;
    };

    const handleStop = () => {
        const synth = synthRef.current;
        synth.cancel();
        for (const word of transcript) {
            const wordSpan = document.getElementById(word.id);
            if (wordSpan) {
                wordSpan.style.backgroundColor = ""; // Clear previous highlights
                wordSpan.style.color = "";
            }
        }
        setSpeaking(false);
    };

    //   console.log(transcript)

    //   const highlightWord = (charIndex: number, elapsedTime: number) => {
    //     if (charIndex <= transcript.length) {
    //       const highlighted = transcript[charIndex]
    //       const wordSpan = document.getElementById(highlighted.id)

    //       if (wordSpan) {
    //         wordSpan.style.backgroundColor = "yellow"
    //       }
    //     }
    //   }

    //   const highlightWord = (charIndex: number) => {
    //     const currentWord = transcript.find(
    //       (word, index) => charIndex >= word.startTime && charIndex < word.endTime
    //     )

    //     if (currentWord) {
    //       const wordSpan = document.getElementById(currentWord.id)

    //       if (wordSpan) {
    //         wordSpan.style.backgroundColor = "yellow"
    //       }

    //       setTimeout(() => {
    //         if (wordSpan) {
    //           wordSpan.style.backgroundColor = ""
    //         }
    //       }, currentWord.endTime - currentWord.startTime)
    //     }
    //   }

    return (
        <>
            <div id="web-tts-transcript">
                {transcript.map(({ word, id }) => (
                    <span key={id} id={id} className="inline-block px-1">
                        {word}
                    </span>
                ))}
            </div>

            <Button
                type="button"
                onClick={handlePlay}
                disabled={speaking}
                className="mr-2 p-2 rounded">
                Play
            </Button>

            <Button type="button" onClick={handleStop} disabled={!speaking}>
                Stop
            </Button>
        </>
    );
};

export default WebTTS;
