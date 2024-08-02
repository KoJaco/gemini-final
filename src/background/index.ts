import { Storage } from "@plasmohq/storage";

// TODO: Implement all api key retrieval and storage here upon message, update CORS policy in manifest (override)

// export {}
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
