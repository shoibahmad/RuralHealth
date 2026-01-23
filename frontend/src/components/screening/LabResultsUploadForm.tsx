import { useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

interface LabResultsUploadFormProps {
    data: any;
    updateData: (data: any) => void;
}

export function LabResultsUploadForm({ data, updateData }: LabResultsUploadFormProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Simulate OCR Scanning
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            // Mock extracted values
            updateData({
                ...data,
                glucose_level: 110,
                cholesterol_level: 190
            });
        }, 2500);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

            <div className="glass-card border-dashed border border-white/20 rounded-xl p-8 text-center transition-all hover:bg-white/5 group relative overflow-hidden">
                {!preview ? (
                    <div className="flex flex-col items-center relative z-10">
                        <div className="h-16 w-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Upload Lab Report</h3>
                        <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                            Take a photo of the blood test report. Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">Gemini AI</span> will automatically extract Glucose and Cholesterol values.
                        </p>
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 text-white shadow-lg shadow-blue-500/25">
                            <label className="cursor-pointer">
                                Select Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </Button>
                        <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/50 border border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Powered by Gemini 2.5 Flash</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center relative z-10">
                        <div className="relative w-full max-w-sm aspect-video mb-6 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                            <img src={preview} alt="Lab Report" className="object-cover w-full h-full opacity-80" />
                            {isScanning && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                    <Loader2 className="h-10 w-10 animate-spin mb-2 text-purple-400" />
                                    <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">Analyzing with Gemini AI...</span>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" onClick={() => { setPreview(null); updateData({ ...data, glucose_level: "", cholesterol_level: "" }) }} className="text-slate-400 hover:text-white hover:bg-white/10">
                            Remove & Retake
                        </Button>
                    </div>
                )}
            </div>

            {/* Extracted Data Fields */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="glucose" className="text-slate-300">Fasting Glucose (mg/dL)</Label>
                    <div className="relative">
                        <Input
                            id="glucose"
                            type="number"
                            value={data.glucose_level || ""}
                            onChange={(e) => updateData({ ...data, glucose_level: e.target.value })}
                            className={cn(data.glucose_level && "border-green-500/50 ring-green-500/20 bg-green-500/10", "bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20")}
                        />
                        {data.glucose_level && (
                            <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-400" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">Normal range: 70-99 mg/dL</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cholesterol" className="text-slate-300">Total Cholesterol (mg/dL)</Label>
                    <div className="relative">
                        <Input
                            id="cholesterol"
                            type="number"
                            value={data.cholesterol_level || ""}
                            onChange={(e) => updateData({ ...data, cholesterol_level: e.target.value })}
                            className={cn(data.cholesterol_level && "border-green-500/50 ring-green-500/20 bg-green-500/10", "bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20")}
                        />
                        {data.cholesterol_level && (
                            <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-400" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">Normal: &lt; 200 mg/dL</p>
                </div>
            </div>

        </div>
    )
}
