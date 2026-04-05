import { Activity } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { VoiceEntryBanner } from "./VoiceEntryBanner";

interface VitalsEntryFormProps {
    data: any;
    updateData: (data: any) => void;
}

export function VitalsEntryForm({ data, updateData }: VitalsEntryFormProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <VoiceEntryBanner
                data={data}
                updateData={updateData}
                title="AI Vitals Assistant"
                description="Speak BP and Heart Rate (e.g., '120 over 80, pulse 72')."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="height_cm" className="text-slate-300">Height (cm) / ऊंचाई (सेमी)</Label>
                    <div className="relative">
                        <Input
                            id="height_cm"
                            type="number"
                            value={data.height_cm || ""}
                            onChange={(e) => updateData({ ...data, height_cm: e.target.value })}
                            placeholder="cm / सेमी"
                            className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500">CM</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="weight_kg" className="text-slate-300">Weight (kg) / वजन (किलोग्राम)</Label>
                    <div className="relative">
                        <Input
                            id="weight_kg"
                            type="number"
                            value={data.weight_kg || ""}
                            onChange={(e) => updateData({ ...data, weight_kg: e.target.value })}
                            placeholder="kg / किलोग्राम"
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
                Cardiovascular Vitals / हृदय संबंधी महत्वपूर्ण संकेत
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="systolic_bp" className="text-slate-300">Systolic BP / सिस्टोलिक बीपी</Label>
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
                    <Label htmlFor="diastolic_bp" className="text-slate-300">Diastolic BP / डायस्टोलिक बीपी</Label>
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
                    <Label htmlFor="heart_rate" className="text-slate-300">Heart Rate / Pulse / हृदय गति / पल्स</Label>
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
        </div >
    )
}
