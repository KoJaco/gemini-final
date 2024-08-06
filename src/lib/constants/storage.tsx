import type { Preferences } from "../types";

export const defaultPreferences: Preferences = {
    aiSettings: [
        {
            characteristics: {
                label: "simplicity",
                value: "Express things as simply as possible, be kind and empathetic, be patient."
            }
        },
        {
            interactions: {
                description:
                    "When you summarize, explain, or simply information please provide additional questions that I can ask to further understand the content.",
                label: "follow-up-questions",
                value: true
            }
        }
    ],
    applicationSettings: [
        {
            translateToLanguage: {
                // international spanish (would need to include es-ES *spain, es-013 *CA, es *international)
                value: { id: "es", language: "spanish" }
            }
        }
    ]
};
