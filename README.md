# Companion Chrome Extension (Development)

**Companion** is a Chrome extension designed to make the web more accessible by simplifying complex content, providing detailed image descriptions, and offering customizable interaction settings. Whether you need content summarized, translated, or read aloud, Companion leverages the power of the Gemini API to deliver a personalized and inclusive browsing experience.

## Built With

-   **Plasmo** - A framework for building browser extensions with ease.
-   **React** - A JavaScript library for building user interfaces.
-   **TailwindCSS** - A utility-first CSS framework for rapid UI development.

## Getting Started

### Prerequisites

To run this project locally, ensure you have the following installed on your machine:

-   **Node.js** - You can download it from [here](https://nodejs.org/).
-   **npm** - Node package manager, usually comes with Node.js.
-   **Git** - Version control system, you can install it from [here](https://git-scm.com/).

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/KoJaco/gemini-final.git
    ```

2. **Install dependencies:**

    ```bash
    cd ./gemini-final
    pnpm install
    ```

3. **Setup environment Variables:**

    - Create a .env.development file, copy over the .env.example content, and then set your own password. This will be used to save and retrieve your api keys from Chrome sync storage. 

4. **Run the Dev server:**

    ```bash
    pnpm dev
    # or
    npm run dev
    ```

5. **Load package:**

    - Open your browser and navigate to `chrome://extensions/`.
    - Enable developer mode by toggling the switch in the top right corner.
    - Click on "Load unpacked" and select the `dist` directory within your project folder: `build/chrome-mv3-dev`.

### Preface and About

Hi, I'm Kori, a passionate developer (although I’m not yet working in the industry) focused on creating technology that provides tangible value to people’s everyday lives. With Companion, my goal is to bridge the gap between complex web content and the diverse needs of users around the world (and also just to make something interesting!). This extension is still in development, and I will continuously work to enhance its features, capabilities, and overall performance and usability.

I’ve been chipping away at this project over the last few months after my day job as a marine electrician. Fortunately, I had the last week of the competition to really put in some time before the submission deadline. Despite this, there’s still a long way to go! So, expect some bugs, performance bottlenecks, and breaking changes over the next few months.

Please feel free to reach out or contribute to the project `:)`
