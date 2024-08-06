## TODO 7/08/2024

1. Fix loading skeletons
 <!-- 2. Add actions to prompts so I can add a 'system' message and style to the messages -->
2. Get image comprehension working (500 internal server error on google side??)
3. Get basic web speech working.
4. Work on providing summary / context => the LLM should receive a summary of the conversation so far but be told that the last few messages (to be attached to the prompt) are the most relevant for answering the provided question... if the question is unrelated to the provided summary, please simply address the question without referring to the summary... summary objects should be listed as more of bullet points of what has taken place.. keep the previous messages as more pertinent towards the cumulative summary.
5. Full preferences (all forms complete and labelled, retrieve from sync storage and save to sync storage... on initial load, load these preferences into local state. Fallback on defaults)
6. fix bugs (see todos)
7. refactor IndexDB stuff... I need to have a separate store for messages so that I can add either media files and/or audio files / transcripts for natural speech synthesis.
8. get markdown parsing of code working...

## Goal for today.

1. Preferences and preferences object done, correctly accessed, and loaded into global state.
2. Loading skeletons done and nice (Main page load in, message skeleton, audio player skeleton -- not yet but after doing whisper api stuff.)
3. General tidy up of application
4. fix bugs (1. Context menu styling, 2. local state not updating correctly on context menu option hit, audio player -- make a provider with context to set playing correctly)

-   If I have time

5. Refactor indexdb stuff.
6. Work on audio player (add stop + pause func, make skips go to next sentence -- would mean keeping a transcript of sentences too, whisper API and audio player)
7. Implement dark/light mode (this will annoyingly include sending a message to the context menu and changing state within that to affect dark/light mode.)

## Preferences: - saved to sync chrome storage.

-   API Keys (change your api keys)
-   Gemini Behaviour (Add your own prompt for how you want Gemini to interact with you, what kind of personality do you want Gemini to have, how do you want Gemini to speak to you.)
-   Whisper API Behaviour
