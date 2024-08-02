import ShadowWrapper from "@/components/shadow-wrapper";
import cssText from "data-text:@/style.css";
import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect, useRef, useState } from "react";

import { sendToBackground } from "@plasmohq/messaging";

// import { CountButton } from "~features/count-button"

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

const ContextMenu = () => {
    const [hoverMode, setHoverMode] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [menuOptions, setMenuOptions] = useState<{ [key: string]: string[] }>(
        {}
    );

    const [menuHovered, setMenuHovered] = useState(false);

    const highlightedElementRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hoverMode) return;

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
                        "Image Options": [
                            "Describe this",
                            "Describe and read aloud",
                            "Describe and translate"
                        ]
                    });
                } else {
                    setMenuOptions({
                        "Text Options": [
                            "Summarize",
                            "Simplify this for me",
                            "Explain this to me"
                        ],
                        "Translation Options": [
                            "Translate",
                            "Summarize and Translate"
                        ],
                        "Reading Options": ["Read aloud"]
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
                    setMenuHovered(true);
                }, 1000);
            }
        };

        const handleMouseLeave = (event: MouseEvent) => {
            if (
                !menuRef.current &&
                !menuRef.current.contains(event.relatedTarget as Node)
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
    }, []);

    useEffect(() => {
        if (isVisible && menuRef.current) {
            const { innerWidth, innerHeight } = window;
            const menuRect = menuRef.current.getBoundingClientRect();

            let newX = mousePosition.x;
            let newY = mousePosition.y;

            if (menuRect.right > innerWidth) {
                newX = innerWidth - menuRect.width / 2;
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

    // const response = await sendToBackground({
    //   name: "ping",
    //   body: {
    //     id: "123"
    //   },
    //   extensionId: "jmdmdppbobnhekmijbdebjhoeflddbii" // details in web extension manager
    // })

    // console.log("Visible: ", isVisible);
    // dark:bg-[#292524]/75 bg-[#f5f5f4]/75 text-muted-foreground

    if (!hoverMode) return null;

    return (
        <>
            {/* <ShadowWrapper> */}
            {isVisible && (
                <div
                    ref={menuRef}
                    className="fixed z-[9999] rounded-[8px] border border-slate-700 shadow-lg transition-all duration-300 py-2 px-4 flex gap-x-4 text-sm bg-[#141414]"
                    style={{
                        top: mousePosition.y,
                        left: mousePosition.x,
                        transform: "translate(-50%, 0)"
                        // opacity: isVisible ? "100%" : "0%"
                    }}
                    // onMouseEnter={() => setMenuHovered(true)}
                    // onMouseLeave={() => setMenuHovered(false)}
                >
                    {Object.keys(menuOptions).map((header, index) => (
                        <div key={index}>
                            <h3 className="text-md font-bold mb-1">{header}</h3>
                            <ul className="">
                                {menuOptions[header].map((option, subIndex) => (
                                    <li
                                        key={subIndex}
                                        className="py-1 cursor-pointer text-opacity-50">
                                        {option}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {/* {isVisible && (
                <ShadowWrapper>
                <div className="h-screen w-screen z-[1000] flex items-center justify-center bg-black">
                I'm A content script
                </div>
                </ShadowWrapper>
                )} */}
                </div>
            )}
            {/* </ShadowWrapper> */}
        </>
    );
};

export default ContextMenu;
