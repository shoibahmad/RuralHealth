import { createLogger } from "../lib/logger";
import { useState, useCallback, useRef, useEffect } from "react";

const log = createLogger("useSpeechRecognition");

/**
 * Resolve the browser's SpeechRecognition constructor.
 *
 * Chromium exposes it only under the webkit prefix and TypeScript's DOM lib
 * declares neither, so the lookup is narrowed here once instead of being
 * silenced at each call site.
 */
/**
 * The slice of the Web Speech API this hook uses.
 *
 * TypeScript's DOM lib does not declare SpeechRecognition at all, so the
 * handful of members touched here are declared locally rather than pulling in
 * a dependency for ambient types.
 */
export interface SpeechRecognitionAlternative {
    transcript: string;
}

export interface SpeechRecognitionResult {
    readonly length: number;
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
    error: string;
    message?: string;
}

export interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
    if (typeof window === "undefined") return undefined;

    const globalWindow = window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
}

interface SpeechRecognitionOptions {
    onResult?: (text: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    lang?: string;
}

export function useSpeechRecognition({
    onResult,
    onError,
    lang = "en-US",
}: SpeechRecognitionOptions = {}) {
    // Hooks MUST be at the top and in a consistent order
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const onResultRef = useRef(onResult);
    const onErrorRef = useRef(onError);

    // Keep refs up to date without re-triggering effects
    useEffect(() => {
        onResultRef.current = onResult;
        onErrorRef.current = onError;
    }, [onResult, onError]);

    useEffect(() => {
        const SpeechRecognition = getSpeechRecognition();

        if (!SpeechRecognition) {
            log.warn("Speech recognition is not supported in this browser");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let currentTranscript = "";
            let isFinalResult = false;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                currentTranscript += result[0].transcript;
                if (result.isFinal) {
                    isFinalResult = true;
                }
            }

            setTranscript(currentTranscript);
            if (onResultRef.current) {
                onResultRef.current(currentTranscript, isFinalResult);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            log.error("Speech recognition failed", event.error);
            setIsListening(false);
            if (onErrorRef.current) {
                onErrorRef.current(event.error);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    // Already stopped; nothing to clean up.
                }
            }
        };
    }, [lang]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript("");
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.error("Failed to stop recognition:", err);
            }
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSupported: !!getSpeechRecognition(),
    };
}
