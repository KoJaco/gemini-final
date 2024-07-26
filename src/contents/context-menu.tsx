import cssText from "data-text:@/style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

// import { CountButton } from "~features/count-button"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN"
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const ContextMenu = () => {
  const [isVisible, setIsVisible] = useState(false)

  // const response = await sendToBackground({
  //   name: "ping",
  //   body: {
  //     id: "123"
  //   },
  //   extensionId: "jmdmdppbobnhekmijbdebjhoeflddbii" // details in web extension manager
  // })

  return (
    <>
      {isVisible && (
        <div className="h-screen w-screen z-50 flex items-center justify-center bg-black/50">
          {/* <CountButton /> */} I'm A content script
        </div>
      )}
    </>
  )
}

export default ContextMenu
