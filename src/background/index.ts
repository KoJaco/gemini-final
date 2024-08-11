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

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "VOICE_COMMAND_PORT") {
        port.onMessage.addListener((msg) => {
            const { payload } = msg;

            console.log("background payload: ", payload);

            // Send the audioBlob to the side panel
            chrome.runtime.sendMessage({
                action: "VOICE_COMMAND_DATA_TO_SIDEPANEL",
                payload: {
                    payload
                }
            });
        });
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // console.log("Message Fired: ", message.action);

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

                case "TOGGLE_HOVER_MODE_WITH_VOICE_COMMANDS":
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        (tabs) => {
                            chrome.tabs.sendMessage(
                                tabs[0].id,
                                {
                                    action: "TOGGLE_HOVER_MODE_WITH_VOICE_COMMANDS",
                                    payload: message.payload // {hoverMode: boolean, voiceCommands: boolean}
                                },
                                (response) => {
                                    if (chrome.runtime.lastError) {
                                        console.error(
                                            chrome.runtime.lastError.message
                                        );

                                        sendResponse({
                                            success: false,
                                            message:
                                                chrome.runtime.lastError.message
                                        });
                                    }
                                    sendResponse({ success: true });
                                }
                            );
                        }
                    );

                    return true;

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

                case "STOP_RECORDING":
                    chrome.runtime.sendMessage({
                        action: "STOP_RECORDING",
                        payload: message.payload
                    });
                    sendResponse({ success: true });
                    console.log("send from background script", message.payload);
                    return true;

                // case "AUDIO_DATA":
                //     // Relay the audio data to the side panel
                //     chrome.runtime.sendMessage({
                //         action: "AUDIO_DATA",
                //         payload: message.payload
                //     });

                //     console.log("from background payload:", message.payload);
                //     sendResponse({ success: true });
                //     return true;

                case "MENU_OPTION_CLICKED":
                    sendResponse({ success: true });
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
});
