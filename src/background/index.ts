import { Storage } from "@plasmohq/storage";

// TODO: Implement all api key retrieval and storage here upon message, update CORS policy in manifest (override)

export {};
console.log("Background service worker loaded.");

// sidepanel behaviour

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// onInstalled behaviour
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        const welcomeUrl = chrome.runtime.getURL("tabs/welcome.html");
        chrome.tabs.create({ url: welcomeUrl });
    }
});

chrome.action.onClicked.addListener(() => {
    const tabUrl = chrome.runtime.getURL("tabs/welcome.html");
    chrome.tabs.create({ url: tabUrl });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Message Fired: ", message.action);

    try {
        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (tabs[0].id) {
            switch (message.action) {
                // Application function
                case "TOGGLE_HOVER_MODE":
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        (tabs) => {
                            chrome.tabs.sendMessage(
                                tabs[0].id,
                                {
                                    action: "TOGGLE_HOVER_MODE",
                                    payload: message.payload
                                },
                                (response) => {
                                    if (chrome.runtime.lastError) {
                                        console.error(
                                            chrome.runtime.lastError.message
                                        );
                                        sendResponse({
                                            success: false,
                                            error: chrome.runtime.lastError
                                                .message
                                        });
                                    }
                                    sendResponse({ success: true });
                                }
                            );
                        }
                    );
                    return true; // async res

                case "GET_PAGE_TEXT_CONTENT":
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        (tabs) => {
                            chrome.tabs.sendMessage(
                                tabs[0].id,
                                { action: "GET_PAGE_TEXT_CONTENT" },
                                (response) => {
                                    if (chrome.runtime.lastError) {
                                        console.error(
                                            chrome.runtime.lastError.message
                                        );
                                        sendResponse({
                                            success: false,
                                            error: chrome.runtime.lastError
                                                .message
                                        });
                                    } else {
                                        sendResponse(response);
                                    }
                                }
                            );
                        }
                    );
                    return true;

                default:
                    sendResponse({
                        success: false,
                        message: `No such action exists '${message.action}'.`
                    });
                    break;
            }
        } else {
            sendResponse({ success: false, error: "No active tab found" });
        }
    } catch (error) {
        sendResponse({
            success: false,
            error: `Error in querying the active tab. The error response message is as follows: ${error.message}`
        });
    }

    // case "deactivateHoverMode":
    //     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //         chrome.tabs.sendMessage(tabs[0].id, {
    //             action: "deactivateHoverMode"
    //         });
    //     });
    //     return true;
});

// const storage = new Storage()

// await storage.set("serial-number", 47)

// storage.watch({
//   "serial-number": (c) => {
//     console.log(c.newValue)
//   },
//   make: (c) => {
//     console.log(c.newValue)
//   }
// })

// await storage.set("serial-number", 96)
