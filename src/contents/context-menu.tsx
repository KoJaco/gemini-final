// @ts-expect-error
import cssText from "data-text:@/style.css";
import {
    AudioLines,
    Languages,
    List,
    ListChecks,
    ListFilter,
    ListRestart,
    Mic,
    ScanSearch
} from "lucide-react";
import type { PlasmoCSConfig } from "plasmo";
import React, { useCallback, useEffect, useRef, useState } from "react";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
};

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = cssText;
    return style;
};

console.log("content script loaded");

type MenuOptionTitle =
    | "Describe"
    | "Describe and Translate"
    | "Summarize"
    | "Simplify"
    | "Explain"
    | "Translate"
    | "Summarize and Translate";

const ContextMenu = () => {
    // TODO: Add personal prompt that someone can ask about a certain hovered section.
    // TODO: edge cases :: 1. hovering over a section that includes multiple images, 2. describing multiple images,
    // TODO: fix styling bugs (with context menu popup, text colour taking on websites, inline-script blocked by CORS, )
    const [hoverMode, setHoverMode] = useState(false);
    const [listening, setListening] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [menuOptions, setMenuOptions] = useState<{
        [key: string]: { title: MenuOptionTitle; icon: React.ReactNode }[];
    }>({});

    const mediaRecorderElementRef = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const [isOverMenu, setIsOverMenu] = useState(false);

    const highlightedElementRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const handleToggleHoverMode = useCallback(async (value) => {
        const { hoverMode, voiceCommands } = value;

        setHoverMode(hoverMode);
        setListening(voiceCommands);
        if (voiceCommands) {
            try {
                const micRes = await getUserMicPermission();

                if (micRes.success) {
                    console.log("Microphone permission granted.");
                    startRecording();
                } else {
                    console.warn("Microphone permission denied.");
                }
            } catch (error) {
                console.error("Error getting microphone permission:", error);
            }
        }
        // if (voiceCommands !== null) {
        //     setHoverMode(hoverMode);
        //     setListening(voiceCommands);
        //     if (voiceCommands) {
        //         const micRes = await getUserMicPermission();

        //         if (micRes.success) {
        //             setHoverMode(hoverMode);
        //             setListening(voiceCommands);

        //             console.log("Mic Perm. Res success");
        //             startRecording();
        //         }
        //     }
        // } else {
        //     setHoverMode(hoverMode);
        // }
    }, []);

    async function getUserMicPermission(): Promise<{ success: boolean }> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            stream.getTracks().forEach((track) => track.stop()); // Stop the tracks to prevent the recording indicator
            return { success: true };
        } catch (error) {
            console.error("Error requesting microphone permission", error);
            return { success: false };
        }
    }

    async function startRecording(): Promise<void> {
        try {
            console.log("Start recording hit");
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderElementRef.current = mediaRecorder; // Store the mediaRecorder instance in the ref

            console.log("Recorder initialized:", mediaRecorder);

            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                audioChunks.current.push(event.data);
                console.log("Data available:", event.data);
            };

            mediaRecorder.start();
            console.log("Recording started.");
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    }

    // function stopRecording(): void {
    //     const mediaRecorder = mediaRecorderElementRef.current;

    //     if (mediaRecorder && mediaRecorder.state === "recording") {
    //         console.log("Stopping recording...");
    //         mediaRecorder.stop();

    //         // Fallback: if onstop doesn't trigger, manually process the audio
    //         setTimeout(() => {
    //             if (mediaRecorder.state === "inactive") {
    //                 console.warn("Fallback: Processing audio chunks manually.");
    //                 processAudioChunks();
    //             }
    //         }, 100);
    //     } else {
    //         console.warn("MediaRecorder is not in a recording state.");
    //     }
    // }

    // function processAudioChunks() {
    //     if (audioChunks.current.length > 0) {
    //         const audioBlob = new Blob(audioChunks.current, {
    //             type: "audio/wav"
    //         });
    //         console.log("Processed audio:", audioBlob);

    //         chrome.runtime.sendMessage({
    //             action: "AUDIO_DATA",
    //             payload: { blob: audioBlob }
    //         });

    //         audioChunks.current = [];
    //         mediaRecorderElementRef.current = null;
    //     } else {
    //         console.warn("No audio chunks to process.");
    //     }
    // }

    const handleStopRecording = async () => {
        const element = highlightedElementRef.current;
        if (!element) return;

        let data = {
            title: "voiceCommand",
            content: element.outerHTML,
            inlineData: { audioBuffer: null }, // Default to null
            elementType: element.tagName
        };

        setListening(false);
        setHoverMode(false);
        setIsVisible(false);

        const mediaRecorder = mediaRecorderElementRef.current;

        console.log("media recorder", mediaRecorder);

        if (mediaRecorder && mediaRecorder.state === "recording") {
            console.log("Stopping recording...");
            mediaRecorder.stop();

            mediaRecorder.onstop = () => {
                processAndSendAudio(data);
            };

            // Fallback: if onstop doesn't trigger, manually process the audio
            setTimeout(() => {
                if (mediaRecorder.state === "inactive") {
                    console.warn("Fallback: Processing audio chunks manually.");
                    processAndSendAudio(data);
                }
            }, 100);
        } else {
            console.warn("MediaRecorder is not in a recording state.");

            // Send the data without the audio buffer if not recording
            chrome.runtime.sendMessage(
                {
                    action: "STOP_RECORDING",
                    payload: data
                },
                (response) => {
                    console.log("Stop recording triggered", response);
                }
            );
        }

        if (highlightedElementRef.current) {
            highlightedElementRef.current.style.border = "";
            highlightedElementRef.current = null;
        }
    };

    function processAndSendAudio(data) {
        if (audioChunks.current.length > 0) {
            const audioBlob = new Blob(audioChunks.current, {
                type: "audio/wav"
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result;

                chrome.runtime.sendMessage(
                    {
                        action: "STOP_RECORDING",
                        payload: {
                            ...data,
                            inlineData: { audioBuffer: arrayBuffer }
                        }
                    },
                    (response) => {
                        console.log("Stop recording triggered", response);
                    }
                );
            };

            reader.readAsArrayBuffer(audioBlob);

            console.log("Processed audio:", audioBlob);

            // Clear the audio chunks and media recorder reference
            audioChunks.current = [];
            mediaRecorderElementRef.current = null;
        } else {
            console.warn("No audio chunks to process.");
            // Even if no audio, we should send the data without audio buffer
            chrome.runtime.sendMessage(
                {
                    action: "STOP_RECORDING",
                    payload: data
                },
                (response) => {
                    console.log(
                        "Stop recording triggered without audio",
                        response
                    );
                }
            );
        }
    }

    // async function getUserMicPermission(): Promise<{ success: boolean }> {
    //     return new Promise((resolve, reject) => {
    //         // Using navigator.mediaDevices.getUserMedia to request microphone access
    //         navigator.mediaDevices
    //             .getUserMedia({ audio: true })
    //             .then((stream) => {
    //                 // Permission granted, handle the stream if needed
    //                 console.log("Microphone access granted");

    //                 // Stop the tracks to prevent the recording indicator from being shown
    //                 stream.getTracks().forEach(function (track) {
    //                     track.stop();
    //                 });

    //                 resolve({ success: true });
    //             })
    //             .catch((error) => {
    //                 console.error(
    //                     "Error requesting microphone permission",
    //                     error
    //                 );

    //                 reject(error);
    //             });
    //     });
    // }

    // async function startRecording(): Promise<void> {
    //     try {
    //         console.log("Start recording hit");
    //         const stream: MediaStream =
    //             await navigator.mediaDevices.getUserMedia({ audio: true });
    //         const mediaRecorder = new MediaRecorder(stream);
    //         mediaRecorderElementRef.current = mediaRecorder; // Store the mediaRecorder instance in the ref

    //         console.log("recorder", mediaRecorder);

    //         mediaRecorder.ondataavailable = (event: BlobEvent) => {
    //             audioChunks.push(event.data);
    //             console.log("Data available:", event.data);
    //         };

    //         mediaRecorder.onstop = async () => {
    //             console.log("Recording stopped.");
    //             processAudioChunks();
    //             mediaRecorderElementRef.current = null;
    //         };

    //         mediaRecorder.start();
    //         console.log("Recording started.");
    //     } catch (error) {
    //         console.error("Error starting recording:", error);
    //     }
    // }

    // function stopRecording(): void {
    //     const mediaRecorder = mediaRecorderElementRef.current; // Access the mediaRecorder from the ref

    //     if (mediaRecorder && mediaRecorder.state === "recording") {
    //         console.log("Stopping recording...");
    //         mediaRecorder.stop();

    //         // Fallback: if onstop doesn't trigger, manually process the audio
    //         setTimeout(() => {
    //             if (mediaRecorder.state === "inactive") {
    //                 console.warn("Fallback: Processing audio chunks manually.");
    //                 processAudioChunks();
    //             }
    //         }, 100);
    //     } else {
    //         console.warn("MediaRecorder is not in a recording state.");
    //     }
    // }

    // function processAudioChunks() {
    //     if (audioChunks.length > 0) {
    //         const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    //         console.log("Processed audio:", audioBlob);

    //         chrome.runtime.sendMessage({
    //             action: "AUDIO_DATA",
    //             payload: { blob: audioBlob }
    //         });

    //         audioChunks = [];
    //         mediaRecorderElementRef.current === null;
    //     } else {
    //         console.warn("No audio chunks to process.");
    //     }
    // }

    // const handleStopRecording = async () => {
    //     const element = highlightedElementRef.current;
    //     if (!element) return;

    //     const data = {
    //         title: "voiceCommand",
    //         content: element.outerHTML,
    //         inlineData: null,
    //         elementType: element.tagName
    //     };

    //     setListening(false);
    //     setHoverMode(false);
    //     setIsVisible(false);

    //     stopRecording(); // Call the stopRecording function here

    //     chrome.runtime.sendMessage(
    //         {
    //             action: "STOP_RECORDING",
    //             payload: data
    //         },
    //         (response) => {
    //             console.log("Stop recording triggered", response);
    //         }
    //     );

    //     highlightedElementRef.current.style.border = "";
    //     highlightedElementRef.current = null;
    // };

    const handleSetIsOverMenu = useCallback((value: boolean) => {
        setIsOverMenu(value);
    }, []);

    function getPageTextContent() {
        const meaningfulTags = [
            "P",
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "UL",
            "OL",
            "LI",
            "DIV"
        ];

        const elementsWithText: string[] = [];

        function hasDirectTextNode(element: Element) {
            for (const node of element.childNodes) {
                if (
                    node.nodeType === Node.TEXT_NODE &&
                    node.textContent &&
                    node.textContent.trim().length > 3 // arbitrary, how to go about this???
                ) {
                    return true;
                }
            }
            return false;
        }

        function traverse(element: Element) {
            if (
                meaningfulTags.includes(element.tagName) &&
                hasDirectTextNode(element)
            ) {
                elementsWithText.push(element.outerHTML);
            }

            for (const child of element.children) {
                traverse(child);
            }
        }

        traverse(document.body);

        return elementsWithText.join("<br/>");
    }

    const fetchImageData = async (url: string) => {
        // convert to base64 string
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const mimeType = blob.type;

            return new Promise<{ data: string; mimeType: string }>(
                (resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result as string;

                        const base64Data = base64String.split(",")[1];

                        // Remove the data URL prefix ... need to find out the format that gemini expects... no docs???
                        resolve({ data: base64Data, mimeType: mimeType });
                    };
                    reader.onerror = () =>
                        reject(new Error("Failed to read the blob as base64"));
                    reader.readAsDataURL(blob);
                }
            );
        } catch (error) {
            // TODO: handle this properly
            console.warn("Error in fetching image... report this");
            return { data: "", mimeType: "" };
        }
    };

    const sendMessage = async (menuOption: MenuOptionTitle) => {
        const element = highlightedElementRef.current;
        // TODO: add proper error handling, probably another message or a toast.
        if (!element) return;

        const data = {
            title: menuOption,
            content: "",
            inlineData: null,
            elementType: element.tagName
        };

        if (element.tagName === "IMG") {
            const src = element.getAttribute("src");
            if (src && src.length > 1) {
                const base64Image = await fetchImageData(src);
                const imageGenData = base64Image;
                data.inlineData = imageGenData;
            } else {
                data.content = element.innerText;
                // TODO: handle this case properly.
            }
        } else {
            switch (menuOption) {
                case "Summarize":
                case "Simplify":
                case "Translate":
                case "Summarize and Translate":
                    data.content = element.innerText;
                    break;
                case "Explain":
                    data.content = element.outerHTML;
                    break;
                default:
                    data.content = element.innerText;
                    break;
            }
        }

        chrome.runtime.sendMessage(
            { action: "MENU_OPTION_CLICKED", payload: data },
            (response) => {
                // TODO: visibly handle a successful message (maybe show a green tick or something, or maybe just handle success in the sidepanel.)
                console.log("Response from context menu: ", response);
            }
        );
    };

    // Listeners
    useEffect(() => {
        const messageListener = (message, sender, sendResponse) => {
            // content menu specific
            if (message.action === "TOGGLE_HOVER_MODE") {
                handleToggleHoverMode(message.payload);

                // TODO: handle edge case - when hover mode is to be turned off, reset styling.

                sendResponse({ success: true });

                // Full page data
            } else if (
                message.action === "TOGGLE_HOVER_MODE_WITH_VOICE_COMMANDS"
            ) {
                handleToggleHoverMode(message.payload);

                sendResponse({ success: true });
            } else if (message.action === "GET_PAGE_TEXT_CONTENT") {
                const data = getPageTextContent();

                sendResponse({ success: true, content: data });
                // send to BGSW and parse into a prompt for Gemini
            } else {
                sendResponse({
                    success: false,
                    message: `No such action exists. Action: ${message.action}`
                });
            }

            return true; // async send response
        };

        // add onMessage listeners

        chrome.runtime.onMessage.addListener(messageListener);

        // remove on dismount
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    // mouse move && hover effects
    useEffect(() => {
        if (!hoverMode || isOverMenu) return;

        let hoverTimeout: ReturnType<typeof setTimeout>;
        let lastPosition = { x: 0, y: 0 };

        const handleMouseMove = (event: MouseEvent) => {
            const { clientX, clientY } = event;

            if (highlightedElementRef.current) {
                highlightedElementRef.current.style.border = "";
                highlightedElementRef.current = null;
            }

            const underCursor: HTMLElement = document.elementFromPoint(
                clientX,
                clientY
            ) as HTMLElement;

            if (underCursor && underCursor !== highlightedElementRef.current) {
                highlightedElementRef.current = underCursor;
                underCursor.style.border = "1px solid red";

                if (underCursor.tagName === "IMG") {
                    setMenuOptions({
                        Image: [
                            {
                                title: "Describe",
                                icon: <ScanSearch className="w-4 h-4" />
                            },

                            {
                                title: "Describe and Translate",
                                icon: <Languages className="w-4 h-4" />
                            }
                        ]
                    });
                } else {
                    setMenuOptions({
                        Text: [
                            {
                                title: "Summarize",
                                icon: <List className="w-4 h-4" />
                            },
                            {
                                title: "Simplify",
                                icon: <ListFilter className="w-4 h-4" />
                            },
                            {
                                title: "Explain",
                                icon: <ListChecks className="w-4 h-4" />
                            }
                        ],
                        Translation: [
                            {
                                title: "Translate",
                                icon: <Languages className="w-4 h-4" />
                            },
                            {
                                title: "Summarize and Translate",
                                icon: <ListRestart className="w-4 h-4" />
                            }
                        ]
                    });
                }
            }

            if (clientX !== lastPosition.x || clientY !== lastPosition.y) {
                lastPosition = { x: clientX, y: clientY };

                clearTimeout(hoverTimeout);
                setIsVisible(false);

                hoverTimeout = setTimeout(() => {
                    setMousePosition({ x: clientX, y: clientY });

                    setIsVisible(true);
                    handleSetIsOverMenu(true);
                    console.log(highlightedElementRef.current?.tagName);
                }, 1000);
            }
        };

        const handleMouseLeave = (event: MouseEvent) => {
            // TODO: fix bug when mouse leave window and goes into sidebar.
            if (
                !menuRef.current ||
                (menuRef.current &&
                    !menuRef.current.contains(event.relatedTarget as Node))
            ) {
                setIsVisible(false);
                clearTimeout(hoverTimeout);
                if (highlightedElementRef.current) {
                    highlightedElementRef.current.style.border = "";
                    highlightedElementRef.current = null;
                }
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [hoverMode, isOverMenu]);

    // reposition menu
    useEffect(() => {
        // TODO: fix this so it styles correctly
        if (isVisible && menuRef.current) {
            const { innerWidth, innerHeight } = window;
            const menuRect = menuRef.current.getBoundingClientRect();

            let newX = mousePosition.x;
            let newY = mousePosition.y;

            if (menuRect.right > innerWidth) {
                newX = innerWidth - menuRect.width;
            }
            if (menuRect.bottom > innerHeight) {
                newY = innerHeight - menuRect.height / 2;
            }
            if (menuRect.left < 0) {
                newX = menuRect.width / 2;
            }
            if (menuRect.top < 0) {
                newY = menuRect.height / 2;
            }

            setMousePosition({ x: newX, y: newY });
        }
    }, [isVisible]);

    if (!hoverMode) return null;

    return (
        <>
            {isVisible && (
                <div
                    ref={menuRef}
                    className="fixed z-[9999] rounded-[8px] border shadow-2xl transition-all duration-300 py-2 px-4 gap-y-[30px] text-sm bg-[#0c0a09]/75 backdrop-blur-lg border-[#292524] w-[200px] h-auto flex flex-col"
                    style={{
                        top: mousePosition.y,
                        left: mousePosition.x,
                        transform: "translate(-50%, 0)"
                    }}
                    onMouseLeave={() => handleSetIsOverMenu(false)}>
                    <div className="font-bold text-[14px] -mb-2 rounded-t-[8px] bg-[#0c0a09]/90 -mx-4 -mt-2 py-2 px-4 border-[#292524]">
                        <h1 className="text-[#ede5e1] text-[16px]">
                            Current Tag:{" "}
                            {highlightedElementRef.current?.tagName.toLocaleUpperCase()}
                        </h1>
                    </div>
                    {listening ? (
                        <div className="w-full h-auto flex items-center justify-center pb-6">
                            <button
                                title="Stop Recording Voice Command"
                                className="relative w-16 h-16 flex items-center justify-center bg-[#ef4444]/75 rounded-full focus:outline-none"
                                onClick={() => {
                                    handleStopRecording();
                                }}>
                                <span className="absolute w-20 h-20 rounded-full bg-[#ef4444] opacity-25 animate-ping"></span>
                                <Mic className="h-8 w-8 text-white" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {Object.keys(menuOptions).map((header, index) => (
                                <div
                                    key={index}
                                    className="divide-y divide space-y-2 divide-opacity-50">
                                    <h2 className="text-[16px] font-bold mb-1 text-[#e4dcd7]">
                                        {header}
                                    </h2>
                                    <ul className="text-[#a8a29e] pt-2">
                                        {menuOptions[header].map(
                                            (option, subIndex) => (
                                                <li key={subIndex}>
                                                    <button
                                                        // variant="ghost"
                                                        name={`${header}-${option.title}`}
                                                        className="gap-x-2 justify-start whitespace-normal h-auto w-full text-start p-2 hover:bg-[#292524]/75 hover:text-[#fafaf9] inline-flex items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 rounded-[6px]"
                                                        onClick={() =>
                                                            sendMessage(
                                                                option.title
                                                            )
                                                        }>
                                                        <span className="whitespace-normal">
                                                            {option.title}
                                                        </span>

                                                        <span className="ml-auto text-[12px]">
                                                            {option.icon}
                                                        </span>
                                                    </button>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ContextMenu;
