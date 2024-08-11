import "./tab-style.css";

const navigation = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "Timeline", href: "#timeline" }
];

const features = [
    {
        name: "Content Summarization and Simplification",
        description:
            "Instantly simplify context content or generate concise summaries to make information more digestible and easier to understand."
    },
    {
        name: "Smart Image Descriptions",
        description:
            "Harness the power of AI to generate accurate and detailed image descriptions, making visual content accessible to those with visual impairments."
    },
    {
        name: "Customizable interaction settings",
        description:
            "Customize the extension's behavior with options to modify response characteristics, request follow-up questions for deeper understanding, and adjust translation settings to your preferred language."
    },
    {
        name: "Exact content targeting",
        description:
            "Activate a hover mode to target specific content on the web and give Gemini access to it for its responses."
    },
    {
        name: "Full Chat Functionality",
        description:
            "Chat thread and message storage within your own browser, context aware conversations, and full database access functionality."
    },
    {
        name: "Contextual Read-Aloud",
        description:
            "Use our text-to-speech features to have webpage content summarized and read aloud with real-time word highlighting to aid comprehension and focus."
    }
];

const timeline = [
    {
        name: "Sign-Up Process",
        label: ["1", "Pre-launch"],
        description:
            "Introduce a streamlined sign-up process, eliminating the need for users to provide their own API keys.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="w-12 h-12">
                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>
        )
    },
    {
        name: "Extended Preferences",
        label: ["2", "Pre-launch"],

        description:
            "Expand user preferences, allowing for greater customization of the app's behavior and tailoring Gemini's interactions to individual needs.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="w-12 h-12">
                <line x1="21" x2="14" y1="4" y2="4" />
                <line x1="10" x2="3" y1="4" y2="4" />
                <line x1="21" x2="12" y1="12" y2="12" />
                <line x1="8" x2="3" y1="12" y2="12" />
                <line x1="21" x2="16" y1="20" y2="20" />
                <line x1="12" x2="3" y1="20" y2="20" />
                <line x1="14" x2="14" y1="2" y2="6" />
                <line x1="8" x2="8" y1="10" y2="14" />
                <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
        )
    },
    {
        name: "Voice Commands",
        label: ["3", "Pre-launch"],
        description:
            "Implement voice-activated commands for full or specific website content, enabling hands-free browsing and interaction, ideal for users with mobility impairments.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="w-12 h-12">
                <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" />
            </svg>
        )
    },
    {
        name: "Multi-Modality",
        label: ["4", "Beta"],
        description:
            "Enhance support for multi-modality with Gemini, including features like concept illustration with images, content interpretation involving multiple media types, and analysis of complex figures such as tables.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="w-12 h-12">
                <path d="m11 16-5 5" />
                <path d="M11 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6.5" />
                <path d="M15.765 22a.5.5 0 0 1-.765-.424V13.38a.5.5 0 0 1 .765-.424l5.878 3.674a1 1 0 0 1 0 1.696z" />
                <circle cx="9" cy="9" r="2" />
            </svg>
        )
    },
    {
        name: "General Feature Expansion",
        label: ["5", "Release"],
        description:
            "Expand support for speech-to-text, improve highlighting of spoken text and message segments, introduce custom prompt engineering, and add actions within Gemini responses.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="w-12 h-12">
                <path d="M6 3v12" />
                <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path d="M15 6a9 9 0 0 0-9 9" />
                <path d="M18 15v6" />
                <path d="M21 18h-6" />
            </svg>
        )
    }
];

export default function WelcomePage() {
    return (
        <div className="bg-background">
            <header className="absolute inset-x-0 top-0 z-50">
                <nav
                    aria-label="Global"
                    className="flex items-center justify-center p-6 lg:px-8 w-full sticky">
                    <div className="flex gap-x-6 md:gap-x-8 lg:gap-x-12 rounded-full border px-8 py-2 shadow border-background bg-background/25 backdrop-blur-lg">
                        {navigation.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-semibold leading-6 text-foreground">
                                {item.name}
                            </a>
                        ))}
                    </div>
                </nav>
            </header>

            <section id="home">
                <div className="relative isolate px-6 pt-14 lg:px-8">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            style={{
                                clipPath:
                                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#e180ff] to-[#8993fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                    <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 min-h-[80vh] h-auto flex flex-col items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
                                Companion, simplifying the web one click at a
                                time.
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-muted-foreground text-center">
                                Empower your browsing experience with our
                                cutting-edge Chrome extension. Seamlessly relay
                                website content to Google Gemini to summarize,
                                explain, and simplify it in an intuitive and
                                user-friendly way.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <a
                                    target="_blank"
                                    href="https://ai.google.dev/gemini-api/docs/api-key"
                                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50">
                                    Get your Gemini API Key{" "}
                                    <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                        <div
                            style={{
                                clipPath:
                                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                </div>
            </section>

            <section id="features">
                <div className="relative isolate px-6 pt-14 lg:px-8">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            style={{
                                clipPath:
                                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#e180ff] to-[#8993fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                    <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 min-h-[80vh] h-auto flex flex-col items-center justify-center">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl lg:mx-0">
                                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                    Features
                                </h2>
                                <p className="mt-6 text-lg leading-8 text-gray-600">
                                    Powerful tools to elevate your browsing
                                    experience
                                </p>
                            </div>
                            <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                                {features.map((feature) => (
                                    <div key={feature.name}>
                                        <dt className="font-semibold text-gray-900">
                                            {feature.name}
                                        </dt>
                                        <dd className="mt-1 text-gray-600">
                                            {feature.description}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                        <div
                            style={{
                                clipPath:
                                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                </div>
            </section>

            <section id="timeline">
                <div className="relative isolate px-6 pt-14 lg:px-8">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            style={{
                                clipPath:
                                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#e180ff] to-[#8993fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                    <div className="mx-auto py-32 sm:py-48 lg:py-56 min-h-[80vh] h-auto flex flex-col items-center justify-center gap-y-16">
                        <div className="text-center max-w-4xl">
                            <h2 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
                                Timeline
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-muted-foreground">
                                Looking Ahead: Continuous innovation geared
                                toward Web Accessibility.
                            </p>
                        </div>

                        <div className="flex flex-col max-w-2xl gap-y-16 w-full relative items-center">
                            {timeline.map((card, index) => {
                                return (
                                    <div
                                        key={index}
                                        className={`flex w-96 relative min-h-96 border shadow rounded-2xl p-8 hover:shadow-lg hover:bg-gray-100/10 transition-all duration-300  ${index % 2 === 0 ? "place-self-end" : "place-self-start"}`}>
                                        <div className="flex w-full flex-col gap-y-6">
                                            <div
                                                className={`p-2 w-16 h-16 bg-primary text-primary-foreground/90 rounded-full ${index % 2 === 0 && "rounded-lg"}`}>
                                                {card.icon && card.icon}
                                            </div>
                                            <div className="text-sm font-light leading-1 flex gap-x-2 items-center text-muted-foreground ">
                                                {card.label[0]}
                                                <span className="opacity-50">
                                                    /
                                                </span>
                                                <span className="opacity-75">
                                                    {card.label[1]}
                                                </span>
                                            </div>
                                            <h3 className="text-xl text-primary font-semibold">
                                                {card.name}
                                            </h3>
                                            <p className="text-lg text-muted-foreground">
                                                {card.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                        <div
                            style={{
                                clipPath:
                                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
