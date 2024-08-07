import {
    AI_CHARACTERISTICS,
    AI_CHARACTERISTICS_VALUE,
    AI_INTERACTIONS,
    AI_INTERACTIONS_VALUE,
    TRANSLATE_LANGUAGES,
    type Preferences
} from "../types";

export const defaultPreferences: Preferences = {
    aiSettings: [
        {
            characteristics: {
                label: AI_CHARACTERISTICS.SIMPLICITY,
                value: AI_CHARACTERISTICS_VALUE.SIMPLICITY
            }
        },
        {
            interactions: {
                label: AI_INTERACTIONS.FOLLOW_UP_QUESTIONS,
                value: AI_INTERACTIONS_VALUE.FOLLOW_UP_QUESTIONS
            }
        }
    ],
    applicationSettings: [
        {
            translateToLanguage: null
            // {
            //     // international spanish (would need to include es-ES *spain, es-013 *CA, es *international)
            //     value: TRANSLATE_LANGUAGES.SPANISH
            // }
        }
    ]
};
