import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionOptions {
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
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
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs up to date without re-triggering effects
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
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

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
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
        } catch (e) {
          // Ignore errors on cleanup
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
    isSupported: !!(
      // @ts-ignore
      typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    ),
  };
}
