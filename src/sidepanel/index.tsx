import React from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook"

const Sidepanel = () => {
  //   const resp = await sendToBackground({
  //     name: "ping",
  //     body: {
  //       id: "123"
  //     }
  //   })

  const openWelcomePage = () => {
    const tabUrl = chrome.runtime.getURL("tabs/welcome.html")
    chrome.tabs.create({ url: tabUrl })
  }

  return (
    <div>
      Sidepanel<button onClick={openWelcomePage}>Open Welcome Page</button>
    </div>
  )
}

export default Sidepanel
