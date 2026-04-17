import { useState, useCallback } from "react";
import { Mic, Activity } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

import { translations } from "../../lib/translations";

interface VoiceEntryBannerProps {
    data: any;
    updateData: (data: any) => void;
    title?: string;
    description?: string;
    language: "en" | "hi";
}

export function VoiceEntryBanner({
    data,
    updateData,
    title,
    description,
    language
}: VoiceEntryBannerProps) {
    const t = translations[language];
    const defaultTitle = language === 'en' ? "Real-time Voice Entry" : "रीयल-टाइम वॉयस एंट्री";
    const defaultDesc = language === 'en' ? "Tap microphone to auto-fill fields in real-time." : "रीयल-टाइम में फ़ील्ड भरने के लिए माइक्रोफ़ोन टैप करें।";
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSpeechResult = useCallback(async (text: string, isFinal: boolean) => {
        if (isFinal && text.trim().length > 3) {
            await processTranscription(text);
        }
    }, [data, updateData]);

    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition({
        onResult: handleSpeechResult,
        onError: (err: any) => {
            console.error("Speech error:", err);
        }
    });

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const processTranscription = async (text: string) => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/ai/text-vitals', {
                method: 'POST',
                headers,
                body: JSON.stringify({ text })
            });

            const result = await response.json();

            // Merge all potential fields
            const newData = { ...data };
            let updated = false;

            const fields = [
                'full_name', 'age', 'gender', 'village', 'phone',
                'height_cm', 'weight_kg', 'systolic_bp', 'diastolic_bp', 'heart_rate',
                'smoking_status', 'alcohol_usage', 'physical_activity',
                'glucose_level', 'cholesterol_level'
            ];

            fields.forEach(field => {
                if (result[field] !== undefined && result[field] !== null) {
                    newData[field] = result[field];
                    updated = true;
                }
            });

            if (updated) {
                updateData(newData);
            }

        } catch (err) {
            console.error("Processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 text-sm mb-6">
                Voice entry is not supported in this browser. Please use Chrome or Edge for the best experience.
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-xl border p-4 flex flex-col gap-4 transition-colors duration-300 mb-6",
            isListening ? "bg-red-500/10 border-red-500/30" : "bg-teal-500/10 border-teal-500/30"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300",
                        isListening ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30 scale-110" :
                            isProcessing ? "bg-blue-500/20 text-blue-400 animate-spin border border-blue-500/30" :
                                "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    )}>
                        {isProcessing ? <Activity className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">
                            {isListening ? (language === 'en' ? "Listening..." : "सुन रहा हूँ...") : isProcessing ? (language === 'en' ? "Processing..." : "प्रोसेसिंग...") : (title || defaultTitle)}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {isListening
                                ? (language === 'en' ? "Speak clearly (e.g., 'Weight 70, BP 120 over 80')" : "साफ बोलें (जैसे, 'वजन 70, बीपी 120 ओवर 80')")
                                : isProcessing
                                    ? (language === 'en' ? "Gemini is extracting data..." : "Gemini डेटा निकाल रहा है...")
                                    : (description || defaultDesc)}
                        </p>
                    </div>
                </div>
                <Button
                    variant={isListening ? "destructive" : "secondary"}
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={cn(isListening ? "shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border-0")}
                >
                    {isListening ? (language === 'en' ? "Stop" : "रोकें") : (language === 'en' ? "Start" : "शुरू करें")}
                </Button>
            </div>

            {/* Real-time transcription display */}
            {(transcript || isListening) && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5 min-h-[40px]">
                    <p className={cn(
                        "text-sm italic",
                        isListening ? "text-white" : "text-slate-400"
                    )}>
                        {transcript || (language === 'en' ? "Waiting for speech..." : "आवाज की प्रतीक्षा...")}
                        {isListening && <span className="inline-block w-1 h-4 ml-1 bg-teal-400 animate-pulse" />}
                    </p>
                </div>
            )}
        </div>
    );
}
