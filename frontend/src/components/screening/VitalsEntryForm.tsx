import { useState } from "react";
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
    const [isListening, setIsListening] = useState(false);

    // Mock Voice AI Handler
    const toggleListening = () => {
        setIsListening(!isListening);
        if (!isListening) {
            // Simulate AI capture after 2 seconds
            setTimeout(() => {
                updateData({
                    ...data,
                    height_cm: 175,
                    weight_kg: 70,
                    systolic_bp: 120,
                    diastolic_bp: 80,
                    heart_rate: 72
                });
                setIsListening(false);
            }, 2000);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

            {/* Voice AI Banner */}
            {/* Voice AI Banner */}
            <div className={cn(
                "rounded-xl border p-4 flex items-center justify-between transition-colors duration-300",
                isListening ? "bg-red-500/10 border-red-500/30" : "bg-teal-500/10 border-teal-500/30"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                        isListening ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    )}>
                        <Mic className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">
                            {isListening ? "Listening..." : "Voice Entry Available"}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {isListening
                                ? "Speak vitals clearly (e.g., 'BP 120 over 80, Heart Rate 72')"
                                : "Tap microphone to auto-fill vitals by voice."}
                        </p>
                    </div>
                </div>
                <Button
                    variant={isListening ? "destructive" : "secondary"}
                    onClick={toggleListening}
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
