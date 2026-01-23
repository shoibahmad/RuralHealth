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
            <div className={cn(
                "rounded-xl border p-4 flex items-center justify-between transition-colors duration-300",
                isListening ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                        isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-100 text-blue-600"
                    )}>
                        <Mic className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            {isListening ? "Listening..." : "Voice Entry Available"}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {isListening
                                ? "Speak vitals clearly (e.g., 'BP 120 over 80, Heart Rate 72')"
                                : "Tap microphone to auto-fill vitals by voice."}
                        </p>
                    </div>
                </div>
                <Button
                    variant={isListening ? "destructive" : "secondary"}
                    onClick={toggleListening}
                >
                    {isListening ? "Stop" : "Start"}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="height_cm">Height (cm)</Label>
                    <div className="relative">
                        <Input
                            id="height_cm"
                            type="number"
                            value={data.height_cm || ""}
                            onChange={(e) => updateData({ ...data, height_cm: e.target.value })}
                            placeholder="cm"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">CM</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <div className="relative">
                        <Input
                            id="weight_kg"
                            type="number"
                            value={data.weight_kg || ""}
                            onChange={(e) => updateData({ ...data, weight_kg: e.target.value })}
                            placeholder="kg"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">KG</span>
                    </div>
                </div>

                {/* BMI Auto Calc Display (Could be added here) */}
            </div>

            <div className="h-px bg-slate-100 w-full" />

            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Cardiovascular Vitals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="systolic_bp">Systolic BP</Label>
                    <Input
                        id="systolic_bp"
                        type="number"
                        value={data.systolic_bp || ""}
                        onChange={(e) => updateData({ ...data, systolic_bp: e.target.value })}
                        placeholder="mmHg"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="diastolic_bp">Diastolic BP</Label>
                    <Input
                        id="diastolic_bp"
                        type="number"
                        value={data.diastolic_bp || ""}
                        onChange={(e) => updateData({ ...data, diastolic_bp: e.target.value })}
                        placeholder="mmHg"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="heart_rate">Heart Rate / Pulse</Label>
                    <div className="relative">
                        <Input
                            id="heart_rate"
                            type="number"
                            value={data.heart_rate || ""}
                            onChange={(e) => updateData({ ...data, heart_rate: e.target.value })}
                            placeholder="BPM"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">BPM</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
