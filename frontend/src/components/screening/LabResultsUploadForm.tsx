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

            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-colors hover:bg-slate-100">
                {!preview ? (
                    <div className="flex flex-col items-center">
                        <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Upload Lab Report</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Take a photo of the blood test report. Our AI will automatically extract Glucose and Cholesterol values.
                        </p>
                        <Button asChild>
                            <label className="cursor-pointer">
                                Select Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-sm aspect-video mb-6 rounded-lg overflow-hidden border shadow-sm">
                            <img src={preview} alt="Lab Report" className="object-cover w-full h-full" />
                            {isScanning && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                                    <span className="font-medium">Scanning with OCR...</span>
                                </div>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => { setPreview(null); updateData({ ...data, glucose_level: "", cholesterol_level: "" }) }}>
                            Remove & Retake
                        </Button>
                    </div>
                )}
            </div>

            {/* Extracted Data Fields */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="glucose">Fasting Glucose (mg/dL)</Label>
                    <div className="relative">
                        <Input
                            id="glucose"
                            type="number"
                            value={data.glucose_level || ""}
                            onChange={(e) => updateData({ ...data, glucose_level: e.target.value })}
                            className={cn(data.glucose_level && "border-green-500 ring-green-500/20")}
                        />
                        {data.glucose_level && (
                            <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">Normal range: 70-99 mg/dL</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cholesterol">Total Cholesterol (mg/dL)</Label>
                    <div className="relative">
                        <Input
                            id="cholesterol"
                            type="number"
                            value={data.cholesterol_level || ""}
                            onChange={(e) => updateData({ ...data, cholesterol_level: e.target.value })}
                            className={cn(data.cholesterol_level && "border-green-500 ring-green-500/20")}
                        />
                        {data.cholesterol_level && (
                            <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">Normal: &lt; 200 mg/dL</p>
                </div>
            </div>

        </div>
    )
}
