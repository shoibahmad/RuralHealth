import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

describe("useSpeechSynthesis", () => {
    const mockCancel = vi.fn();
    const mockSpeak = vi.fn();
    const mockResume = vi.fn();
    const mockGetVoices = vi.fn();

    const voices = [
        { name: "Google Hindi", lang: "hi-IN" } as unknown as SpeechSynthesisVoice,
        { name: "Google US English", lang: "en-US" } as unknown as SpeechSynthesisVoice,
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        mockGetVoices.mockReturnValue(voices);

        // Global SpeechSynthesis stub
        Object.defineProperty(window, "speechSynthesis", {
            writable: true,
            value: {
                getVoices: mockGetVoices,
                cancel: mockCancel,
                speak: mockSpeak,
                resume: mockResume,
                speaking: false,
                paused: false,
                onvoiceschanged: null,
            },
        });

        // Global SpeechSynthesisUtterance stub
        (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
            text = "";
            lang = "";
            voice = null;
            rate = 1;
            pitch = 1;
            volume = 1;
            onstart: (() => void) | null = null;
            onend: (() => void) | null = null;
            onerror: (() => void) | null = null;
            constructor(text: string) {
                this.text = text;
            }
        } as unknown as typeof SpeechSynthesisUtterance;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("initializes and loads voices", () => {
        const { result } = renderHook(() => useSpeechSynthesis());
        expect(result.current.isSpeaking).toBe(false);
    });

    it("handles speech trigger with speak and stop", () => {
        const { result } = renderHook(() => useSpeechSynthesis());

        act(() => {
            result.current.speak("Test diagnosis text", "en");
        });

        expect(mockCancel).toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(mockSpeak).toHaveBeenCalled();
        const utterance = mockSpeak.mock.calls[0][0];
        act(() => {
            utterance.onstart?.();
        });
        expect(result.current.isSpeaking).toBe(true);

        act(() => {
            utterance.onend?.();
        });
        expect(result.current.isSpeaking).toBe(false);

        act(() => {
            result.current.stop();
        });

        expect(result.current.isSpeaking).toBe(false);
    });

    it("supports Hindi voice selection and error handler", () => {
        const { result } = renderHook(() => useSpeechSynthesis());

        act(() => {
            result.current.speak("नमस्ते परीक्षण", "hi");
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(mockSpeak).toHaveBeenCalled();
        const utterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
        expect(utterance.lang).toBe("hi-IN");

        act(() => {
            utterance.onerror?.();
        });
        expect(result.current.isSpeaking).toBe(false);
    });

    it("cleans up on unmount", () => {
        const { unmount } = renderHook(() => useSpeechSynthesis());
        unmount();
        expect(mockCancel).toHaveBeenCalled();
    });
});
