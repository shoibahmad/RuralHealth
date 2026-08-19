import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that manages Web Speech API synthesis, including voice loading,
 * Chrome keep-alive workaround, and cleanup.
 */
export function useSpeechSynthesis() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSpeakingRef = useRef(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Pre-load voices immediately
    useEffect(() => {
        const load = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) setAvailableVoices(v);
        };
        load();
        window.speechSynthesis.onvoiceschanged = load;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            isSpeakingRef.current = false;
            setIsSpeaking(false);
        };
    }, []);

    // Chrome workaround: resume synthesis every 10s to prevent it from stopping
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isSpeaking) {
            interval = setInterval(() => {
                if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [isSpeaking]);

    /** Find the best voice for the given language. */
    const findVoice = useCallback(
        (lang: "en" | "hi"): SpeechSynthesisVoice | undefined => {
            const voices =
                availableVoices.length > 0
                    ? availableVoices
                    : window.speechSynthesis.getVoices();

            if (lang === "hi") {
                return (
                    voices.find(
                        (v) =>
                            (v.lang.toLowerCase().includes("hi") ||
                                v.name.toLowerCase().includes("hindi")) &&
                            v.name.includes("Google"),
                    ) ||
                    voices.find(
                        (v) =>
                            (v.lang.toLowerCase().includes("hi") ||
                                v.name.toLowerCase().includes("hindi")) &&
                            v.name.includes("Microsoft"),
                    ) ||
                    voices.find(
                        (v) =>
                            v.lang.toLowerCase().includes("hi") ||
                            v.name.toLowerCase().includes("hindi"),
                    ) ||
                    voices.find(
                        (v) =>
                            v.lang.toLowerCase().includes("in") &&
                            (v.lang.toLowerCase().includes("hi") ||
                                v.name.toLowerCase().includes("hin")),
                    )
                );
            }
            return (
                voices.find((v) => v.lang.includes("en") && v.name.includes("Google")) ||
                voices.find((v) => v.lang.includes("en-US")) ||
                voices.find((v) => v.lang.includes("en"))
            );
        },
        [availableVoices],
    );

    /** Speak the given text in the specified language. */
    const speak = useCallback(
        (text: string, lang: "en" | "hi") => {
            if (!text) return;

            // Reset memory-locked utterance
            window.speechSynthesis.cancel();

            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang === "en" ? "en-US" : "hi-IN";

                // Critical Chrome Fix: Keep a reference to prevent garbage collection
                utteranceRef.current = utterance;

                const voice = findVoice(lang);
                if (voice) utterance.voice = voice;
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                utterance.onstart = () => {
                    setIsSpeaking(true);
                    isSpeakingRef.current = true;
                };
                utterance.onend = () => {
                    setIsSpeaking(false);
                    isSpeakingRef.current = false;
                    utteranceRef.current = null;
                };
                utterance.onerror = () => {
                    setIsSpeaking(false);
                    isSpeakingRef.current = false;
                    utteranceRef.current = null;
                };

                window.speechSynthesis.speak(utterance);
            }, 50);
        },
        [findVoice],
    );

    /** Stop any in-progress speech. */
    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
        setIsSpeaking(false);
    }, []);

    return { isSpeaking, speak, stop };
}
