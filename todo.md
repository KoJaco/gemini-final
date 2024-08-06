## TODO 6/08/2024

1. Fix loading skeletons
 <!-- 2. Add actions to prompts so I can add a 'system' message and style to the messages -->
2. Get image comprehension working (500 internal server error on google side??)
3. Get basic web speech working.
4. Work on providing summary / context => the LLM should receive a summary of the conversation so far but be told that the last few messages (to be attached to the prompt) are the most relevant for answering the provided question... if the question is unrelated to the provided summary, please simply address the question without referring to the summary... summary objects should be listed as more of bullet points of what has taken place.. keep the previous messages as more pertinent towards the cumulative summary.
5. Full preferences (all forms complete and labelled, retrieve from sync storage and save to sync storage... on initial load, load these preferences into local state. Fallback on defaults)

## Preferences: - saved to sync chrome storage.

-   API Keys (change your api keys)
-   Gemini Behaviour (Add your own prompt for how you want Gemini to interact with you, what kind of personality do you want Gemini to have, how do you want Gemini to speak to you.)
-   Whisper API Behaviour
