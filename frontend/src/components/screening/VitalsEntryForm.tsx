import { useState, useRef } from "react";
import { Mic, Activity } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface VitalsEntryFormProps {
    data: any;
    updateData: (data: any) => void;
}

export function VitalsEntryForm({ data, updateData }: VitalsEntryFormProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Using refs for recorder instance to avoid re-renders
    const recorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const toggleListening = async () => {
        if (isListening) {
            // Stop recording
            if (recorderRef.current && recorderRef.current.state === "recording") {
                recorderRef.current.stop();
            }
            setIsListening(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                recorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    await processAudio(audioBlob);

                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsListening(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone. Please ensure permissions are granted.");
            }
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            // Get token
            // Assuming we have a way to get token, usually from localStorage or context
            // For now attempting request, interceptor might handle it or we need to grab it
            // Note: In this project, token storage might differ. Checking AuthContext or services usually best.
            // But let's assume standard Bearer for now or rely on cookie if used.
            // Actually, let's use the standard fetch with auth header manually here.

            const response = await fetch('/api/ai/voice-vitals', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Voice processing failed');
            }

            const result = await response.json();

            // Merge extracted data
            const newData = { ...data };
            if (result.height_cm) newData.height_cm = result.height_cm;
            if (result.weight_kg) newData.weight_kg = result.weight_kg;
            if (result.systolic_bp) newData.systolic_bp = result.systolic_bp;
            if (result.diastolic_bp) newData.diastolic_bp = result.diastolic_bp;
            if (result.heart_rate) newData.heart_rate = result.heart_rate;

            updateData(newData);

        } catch (err) {
            console.error("Voice processing error:", err);
            alert("Failed to process voice entry. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

            {/* Voice AI Banner */}
            <div className={cn(
                "rounded-xl border p-4 flex items-center justify-between transition-colors duration-300",
                isListening ? "bg-red-500/10 border-red-500/30" : "bg-teal-500/10 border-teal-500/30"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                        isListening ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" :
                            isProcessing ? "bg-blue-500/20 text-blue-400 animate-spin border border-blue-500/30" :
                                "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    )}>
                        {isProcessing ? <Activity className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">
                            {isListening ? "Listening..." : isProcessing ? "Processing..." : "Voice Entry Available"}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {isListening
                                ? "Speak vitals clearly (e.g., 'BP 120 over 80, Heart Rate 72')"
                                : isProcessing
                                    ? "Gemini is extracting data from your voice..."
                                    : "Tap microphone to auto-fill vitals by voice."}
                        </p>
                    </div>
                </div>
                <Button
                    variant={isListening ? "destructive" : "secondary"}
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={cn(isListening ? "" : "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border-0")}
                >
                    {isListening ? "Stop" : "Start"}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="height_cm" className="text-slate-300">Height (cm)</Label>
                    <div className="relative">
                        <Input
                            id="height_cm"
                            type="number"
                            value={data.height_cm || ""}
                            onChange={(e) => updateData({ ...data, height_cm: e.target.value })}
                            placeholder="cm"
                            className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500">CM</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="weight_kg" className="text-slate-300">Weight (kg)</Label>
                    <div className="relative">
                        <Input
                            id="weight_kg"
                            type="number"
                            value={data.weight_kg || ""}
                            onChange={(e) => updateData({ ...data, weight_kg: e.target.value })}
                            placeholder="kg"
                            className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500">KG</span>
                    </div>
                </div>

                {/* BMI Auto Calc Display (Could be added here) */}
            </div>

            <div className="h-px bg-white/5 w-full" />

            <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-teal-400" />
                Cardiovascular Vitals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="systolic_bp" className="text-slate-300">Systolic BP</Label>
                    <Input
                        id="systolic_bp"
                        type="number"
                        value={data.systolic_bp || ""}
                        onChange={(e) => updateData({ ...data, systolic_bp: e.target.value })}
                        placeholder="mmHg"
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="diastolic_bp" className="text-slate-300">Diastolic BP</Label>
                    <Input
                        id="diastolic_bp"
                        type="number"
                        value={data.diastolic_bp || ""}
                        onChange={(e) => updateData({ ...data, diastolic_bp: e.target.value })}
                        placeholder="mmHg"
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="heart_rate" className="text-slate-300">Heart Rate / Pulse</Label>
                    <div className="relative">
                        <Input
                            id="heart_rate"
                            type="number"
                            value={data.heart_rate || ""}
                            onChange={(e) => updateData({ ...data, heart_rate: e.target.value })}
                            placeholder="BPM"
                            className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500">BPM</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
