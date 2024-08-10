import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState
} from "react";

// interface SpeechRecognitionEvent extends Event {
//     readonly results: SpeechRecognitionResultList;
//     readonly interpretation: any;
//     readonly emma: Document;
// }

interface SpeechToTextProps {
    stopRecording: boolean;
    setStopRecording: (value: boolean) => void;
    saveTranscript: (value: string) => void;
}

interface SpeechToTextRef {
    isListening: boolean;
    buttonRef: HTMLDivElement | null;
}

const WebSTT = forwardRef<SpeechToTextRef, SpeechToTextProps>((props, ref) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const buttonRef = useRef<HTMLDivElement | null>(null);

    // destructure
    const { stopRecording, setStopRecording, saveTranscript } = props;

    useImperativeHandle(ref, () => ({
        isListening,
        buttonRef: buttonRef.current
    }));

    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        // Grab this from preferences.
        recognition.lang = "en-AU";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptSegment = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptSegment;
                } else {
                    interimTranscript += transcriptSegment;
                }
            }

            setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        return () => {
            recognition.stop();
        };
    }, []);

    const handleStartListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleStopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            saveTranscript(transcript);
            console.log(transcript);
            setIsListening(false);
        }
    };

    return (
        <div
            ref={buttonRef}
            onClick={isListening ? handleStopListening : handleStartListening}>
            {isListening ? "Stop Listening" : "Start Listening"}
        </div>
    );
});

export default WebSTT;
