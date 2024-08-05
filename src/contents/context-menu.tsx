// import { Button } from "@/components/ui/button";
// import { sluggify } from "@/lib/utils";
// @ts-expect-error
import cssText from "data-text:@/style.css";
import {
    AudioLines,
    CornerUpLeft,
    Languages,
    List,
    ListChecks,
    ListFilter,
    ListRestart,
    ScanSearch,
    ScrollText
} from "lucide-react";
import type { PlasmoCSConfig } from "plasmo";
import React, { useCallback, useEffect, useRef, useState } from "react";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
    // world: "MAIN" // are we modifying the window object yet?
};

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = cssText;
    return style;
};

console.log("content script loaded");

// I want to return text content with their associative tags. I also only want to return meaningful tags to be analysed... very difficult to also consider span and div content as this can result in many single character strings returned... :/
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

    const elementsWithText = [];

    function hasDirectTextNode(element) {
        for (const node of element.childNodes) {
            if (
                node.nodeType === Node.TEXT_NODE &&
                node.textContent.trim().length > 3 // arbitrary, how to go about this???
            ) {
                return true;
            }
        }
        return false;
    }

    function traverse(element) {
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

const ContextMenu = () => {
    const [hoverMode, setHoverMode] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [menuOptions, setMenuOptions] = useState<{
        [key: string]: { title: string; icon: React.ReactNode }[];
    }>({});

    const [isOverMenu, setIsOverMenu] = useState(false);

    const highlightedElementRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const handleToggleHoverMode = useCallback((value) => {
        setHoverMode(value);
    }, []);

    const handleSetIsOverMenu = useCallback((value: boolean) => {
        setIsOverMenu(value);
    }, []);

    // Listeners
    useEffect(() => {
        const messageListener = (message, sender, sendResponse) => {
            // content menu specific
            if (message.action === "TOGGLE_HOVER_MODE") {
                console.log(message.payload);
                handleToggleHoverMode(message.payload);
                // setHoverMode(message.payload);

                // TODO: handle edge case - when hover mode is to be turned off, reset styling.

                sendResponse({ success: true });

                // Full page data
            } else if (message.action === "GET_PAGE_TEXT_CONTENT") {
                const data = getPageTextContent();
                console.log(data);
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

            // console.log(menuRef.current);

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
                                title: "Describe and Read Aloud",
                                icon: <ScrollText className="w-4 h-4" />
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
                        ],
                        Reading: [
                            {
                                title: "Read aloud",
                                icon: <AudioLines className="w-4 h-4" />
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
                    console.log(highlightedElementRef.current);
                    // console.log({ isOverMenu: isOverMenu });
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
                    className="fixed z-[9999] rounded-[8px] border shadow-2xl transition-all duration-300 py-2 px-4 gap-y-[30px] text-sm bg-[#0c0a09] border-[#292524] w-[200px] h-auto flex flex-col"
                    style={{
                        top: mousePosition.y,
                        left: mousePosition.x,
                        transform: "translate(-50%, 0)"
                    }}
                    onMouseLeave={() => handleSetIsOverMenu(false)}>
                    {Object.keys(menuOptions).map((header, index) => (
                        <div key={index} className="divide-y divide">
                            <h3 className="text-md font-bold mb-1">{header}</h3>
                            <ul className="text-[#a8a29e] my-2">
                                {menuOptions[header].map((option, subIndex) => (
                                    <button
                                        key={subIndex}
                                        // variant="ghost"
                                        name={`${header}-${option.title}`}
                                        className=" gap-x-2 justify-start whitespace-normal h-auto w-full text-start p-2 hover:bg-[#292524] hover:text-[#fafaf9] inline-flex items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 rounded-[6px]">
                                        <span className="whitespace-normal">
                                            {option.title}
                                        </span>

                                        <span className="ml-auto">
                                            {option.icon}
                                        </span>
                                    </button>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default ContextMenu;
