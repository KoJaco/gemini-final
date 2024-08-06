"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { Forward, Pause, Play, X } from "lucide-react";
import { marked } from "marked";
import React, { useEffect, useRef, useState } from "react";

interface TranscriptWord {
    word: string;
    startIndex: number;
    endIndex: number;
}

// TODO: Fix bug where hovering out of container removes player while it is speaking.... should remain and lock out rendering of all other players.

const WebTTS = ({
    messageId,
    text,
    displayAudioPlayer
}: {
    messageId: string;
    text: string;
    displayAudioPlayer: (value: boolean) => void;
}) => {
    const [speaking, setSpeaking] = useState(false);
    const [sanitizedText, setSanitizedText] = useState("");
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [transcript, setTranscript] = useState<TranscriptWord[]>([]);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // console.log(transcript);

    useEffect(() => {
        const sanitized = stripMarkdownSyntax(text);
        setSanitizedText(sanitized);
        // console.log(sanitizedText);
        generateTranscript(sanitized);

        // console.log("transcript", transcript);
    }, [text]);

    const generateTranscript = (text: string) => {
        // TODO: handle newline and tab chars.
        const words = text.split(/\s+/); // strip by any whitespace char
        // const words = text.split(" "); // split on space...
        const transcriptWords = [];
        let startIndex = 0;

        for (const word of words) {
            const endIndex = startIndex + word.length;
            transcriptWords.push({ word, startIndex, endIndex });
            startIndex = endIndex + 1; // account for the space.
        }

        setTranscript(transcriptWords);
    };

    // straight from chatgpt, hope it works.
    const stripMarkdownSyntax = (markdownText: string) => {
        // Remove code blocks
        let sanitizedText = markdownText.replace(/```[\s\S]*?```/g, "");

        // Remove inline code
        sanitizedText = sanitizedText.replace(/`[^`]*`/g, "");

        // Remove images
        sanitizedText = sanitizedText.replace(/!\[.*?\]\(.*?\)/g, "");

        // Remove links
        sanitizedText = sanitizedText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

        // Remove bold and italic
        sanitizedText = sanitizedText.replace(/(\*\*|__)(.*?)\1/g, "$2"); // bold
        sanitizedText = sanitizedText.replace(/(\*|_)(.*?)\1/g, "$2"); // italic

        // Remove headings
        sanitizedText = sanitizedText.replace(/^#{1,6}\s+/gm, "");

        // Remove blockquotes
        sanitizedText = sanitizedText.replace(/^>\s+/gm, "");

        // Remove horizontal rules
        sanitizedText = sanitizedText.replace(/^(-\s*){3,}$/gm, "");

        // Remove unordered lists
        sanitizedText = sanitizedText.replace(/^\s*[-*+]\s+/gm, "");

        // Remove ordered lists
        sanitizedText = sanitizedText.replace(/^\s*\d+\.\s+/gm, "");

        // Remove remaining Markdown symbols
        sanitizedText = sanitizedText.replace(/[_*~]/g, "");

        return sanitizedText;
    };

    // TODO: Allow choice between highlighting full word and highlighting just the starting character?

    const highlightText = (startIndex: number, endIndex: number) => {
        const range = document.createRange();
        const selection = window.getSelection();

        selection?.removeAllRanges();

        const textContainer = document.getElementById(
            `text-content-${messageId}`
        );
        if (!textContainer) return;

        let currentCharIdx = 0;
        let foundStart = false;
        let startNode: Node | null = null;
        let startOffset = 0;
        let endNode: Node | null = null;
        let endOffset = 0;

        function traverseNodes(node: ChildNode) {
            if (foundStart && endNode) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent || "";
                const nodeEndIndex = currentCharIdx + textContent.length;

                if (
                    !foundStart &&
                    startIndex >= currentCharIdx &&
                    startIndex < nodeEndIndex
                ) {
                    startNode = node;
                    startOffset = startIndex - currentCharIdx;
                    foundStart = true;
                }

                if (foundStart && !endNode && endIndex <= nodeEndIndex) {
                    endNode = node;
                    endOffset = endIndex - currentCharIdx;
                }

                currentCharIdx = nodeEndIndex;
            } else {
                node.childNodes.forEach(traverseNodes);
            }
        }

        textContainer.childNodes.forEach(traverseNodes);

        if (startNode && endNode) {
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            selection?.addRange(range);
        }
    };

    const highlightWord = (charIndex: number) => {
        setCurrentCharIndex(charIndex);
        for (const word of transcript) {
            if (charIndex >= word.startIndex && charIndex < word.endIndex) {
                highlightText(word.startIndex, word.endIndex);
                break;
            }
        }
    };

    const handlePlay = (startIdx = 0) => {
        const synth = synthRef.current;
        const utterance = new SpeechSynthesisUtterance(
            sanitizedText.slice(startIdx)
        );

        // TODO: grab this from preferences, map to language (save this mapping in database {title: English; label: en-AU})
        // https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/lang

        utterance.lang = "en-AU";
        // utterance.lang = "es-419";

        utterance.onstart = () => {
            setSpeaking(true);
        };
        utterance.onend = () => {
            setSpeaking(false);
        };
        utterance.onerror = (event) => {
            if (event.error === "interrupted") {
                return;
            } else {
                console.error("SpeechSynthesisUtterance.onerror", event);
            }
        };

        utterance.onboundary = (event: SpeechSynthesisEvent) => {
            // console.log(event);
            if (event.name === "word") {
                // console.log(event.charIndex);
                highlightWord(event.charIndex + startIdx);
            }
        };

        synth.speak(utterance);
        utteranceRef.current = utterance;
    };

    // TODO: add handle pause

    const handleStop = () => {
        const synth = synthRef.current;
        synth.cancel();
        window.getSelection()?.removeAllRanges();
        setSpeaking(false);
    };

    const handleSkipForward = () => {
        handleStop();
        handlePlay(currentCharIndex + 25);
    };

    const handleSkipBackward = () => {
        handleStop();
        handlePlay(Math.max(currentCharIndex - 25, 0));
    };

    return (
        <>
            <div className="bg-background/50 backdrop-blur-lg border rounded-[50px] overflow-hidden ">
                <div className={clsx("px-1", speaking ? "pt-4" : "py-1")}>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePlay()}
                        disabled={speaking}
                        className={clsx(
                            "rounded-lg p-1",
                            speaking && "bg-muted/50"
                        )}>
                        <Play className="w-4 h-4" />
                    </Button>
                </div>
                <div
                    className={clsx(
                        speaking
                            ? "flex h-auto opacity-100 pb-4 px-1 flex-col gap-y-2 items-center justify-center "
                            : "h-0 opacity-0 hidden",
                        "transition-all duration-300"
                    )}>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleStop}
                        className="rounded-lg p-1"
                        disabled={!speaking}>
                        <Pause className="w-4 h-4" />
                    </Button>

                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-lg p-1"
                        onClick={handleSkipForward}>
                        <Forward className="w-4 h-4" />
                    </Button>

                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-lg p-1"
                        onClick={handleSkipBackward}>
                        <Forward className="w-4 h-4 rotate-180" />
                    </Button>
                </div>
                {speaking && (
                    <div className="w-full flex items-center justify-center border-t hover:bg-background transition-colors duration-300">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="rounded-0 p-1 hover:bg-transparent"
                            // onClick={() => displayAudioPlayer(false)}
                        >
                            <X className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
};

export default WebTTS;
