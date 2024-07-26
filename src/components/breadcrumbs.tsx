import clsx from "clsx";
import React from "react";

type Props = {
    segments: string[];
    separator: "/" | ">" | "|";
};

const Breadcrumbs = ({ segments, separator }: Props) => {
    function handleClick(
        event: React.MouseEvent<HTMLAnchorElement>,
        segment: string
    ) {
        event.preventDefault();
        chrome.tabs.query(
            {
                active: true,
                currentWindow: true,
            },
            (tabs) => {
                if (!tabs[0].id) return;
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "navigate", segment: segment },
                    (response) => {
                        console.log(response.status);
                    }
                );
            }
        );
    }

    return (
        <nav aria-label="breadcrumbs">
            <ol className="flex list-none p-0 m-0">
                {segments.map((segment, index) => (
                    <li
                        key={index}
                        aria-current={
                            index === segments.length - 1 ? "page" : undefined
                        }
                        className={clsx("mr-2 text-muted-foreground text-md")}
                    >
                        <a href={"#"} onClick={(e) => handleClick(e, segment)}>
                            {segment}
                        </a>

                        {index < segments.length - 1 && (
                            <span className="mx-2 opacity-50">{separator}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
