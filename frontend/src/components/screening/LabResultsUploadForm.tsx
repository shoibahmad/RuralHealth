import { useState } from "react";
import { Upload, Loader2, CheckCircle2, FlaskConical, Beaker, Activity } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

import { translations } from "../../lib/translations";

interface LabResultsUploadFormProps {
    data: any;
    updateData: (data: any) => void;
    language: "en" | "hi";
}

export function LabResultsUploadForm({ data, updateData, language }: LabResultsUploadFormProps) {
    const t = translations[language];
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        setIsScanning(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            const response = await fetch('/api/ai/lab-extract', {
                method: 'POST',
                body: uploadFormData
            });

            if (response.ok) {
                const result = await response.json();
                const extractedData = result.data || result;
                
                const newData = { ...data };
                Object.keys(extractedData).forEach(key => {
                    if (extractedData[key] !== null && extractedData[key] !== undefined && extractedData[key] !== "") {
                        if (Object.prototype.hasOwnProperty.call(newData, key)) {
                            newData[key] = String(extractedData[key]);
                        }
                    }
                });
                updateData(newData);
            }
        } catch (err) {
            console.error("Lab extraction failed:", err);
        } finally {
            setIsScanning(false);
        }
    };

    const renderField = (id: string, labelKey: string, unit: string, placeholder = "---") => (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{translations[language][labelKey] || labelKey} ({unit})</Label>
            <div className="relative group">
                <Input
                    id={id}
                    type="number"
                    step="0.01"
                    placeholder={placeholder}
                    value={data[id] || ""}
                    onChange={(e) => updateData({ ...data, [id]: e.target.value })}
                    className={cn(
                        data[id] ? "border-teal-500/50 bg-teal-500/5 text-teal-100" : "border-white/10 bg-slate-900/50 text-slate-300",
                        "h-9 text-sm focus:border-purple-500/50 focus:ring-purple-500/10 transition-all"
                    )}
                />
                {data[id] && (
                    <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-teal-400 opacity-60" />
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">

            <div className="glass-card border-dashed border border-white/10 rounded-2xl p-6 text-center transition-all hover:bg-white/[0.02] group relative overflow-hidden bg-slate-900/20">
                {!preview ? (
                    <div className="flex flex-col items-center relative z-10 py-4">
                        <div className="h-16 w-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/5">
                            <Upload className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{translations[language].lab_reports}</h3>
                        <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                            {translations[language].upload_description}
                        </p>
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 text-white shadow-xl shadow-blue-500/20 px-8 py-6 rounded-xl font-bold">
                            <label className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Select Report Image / रिपोर्ट छवि चुनें
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center relative z-10">
                        <div className="relative w-full max-w-md aspect-[16/10] mb-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                            <img src={preview} alt="Lab Report" className="object-contain w-full h-full opacity-60" />
                            {isScanning && (
                                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white backdrop-blur-md">
                                    <div className="relative">
                                        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
                                        <div className="absolute inset-0 animate-ping opacity-20 bg-purple-500 rounded-full scale-150"></div>
                                    </div>
                                    <span className="mt-4 font-bold tracking-widest uppercase text-xs text-purple-300 animate-pulse">{t.ocr_scanning}</span>
                                    <div className="mt-2 w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 animate-progress-indeterminate"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" onClick={() => { setPreview(null); }} className="text-slate-500 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest">
                            Remove & Retake
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Hematology Panel */}
                <div className="glass-card rounded-2xl border border-white/5 bg-slate-900/40 p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                            <Beaker className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-white tracking-tight">Hematology Panel</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        {renderField("hemoglobin", "hemoglobin", "g/dL")}
                        {renderField("rbc_count", "rbc", "10^6/uL")}
                        {renderField("wbc_count", "wbc", "10^3/uL")}
                        {renderField("platelet_count", "platelets", "10^3/uL")}
                    </div>
                </div>

                {/* Metabolic Panel */}
                <div className="glass-card rounded-2xl border border-white/5 bg-slate-900/40 p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <FlaskConical className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-white tracking-tight">Metabolic Panel</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        {renderField("glucose_level", "glucose", "mg/dL")}
                        {renderField("cholesterol_level", "cholesterol", "mg/dL")}
                        {renderField("blood_urea_nitrogen", "BUN / बून", "mg/dL")}
                        {renderField("creatinine", "creatinine", "mg/dL")}
                        {renderField("sodium", "Sodium / सोडियम", "mmol/L")}
                        {renderField("potassium", "Potassium / पोटेशियम", "mmol/L")}
                        {renderField("chloride", "Chloride / क्लोराइड", "mmol/L")}
                        {renderField("calcium", "Calcium / कैल्शियम", "mg/dL")}
                    </div>
                </div>

                {/* Liver Function */}
                <div className="glass-card rounded-2xl border border-white/5 bg-slate-900/40 p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Activity className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-white tracking-tight">Liver Function</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        {renderField("alt_sgpt", "ALT (SGPT)", "U/L")}
                        {renderField("ast_sgot", "AST (SGOT)", "U/L")}
                        {renderField("albumin", "Albumin / एल्ब्यूमिन", "g/dL")}
                        {renderField("total_bilirubin", "bilirubin", "mg/dL")}
                    </div>
                </div>
            </div>
        </div>
    );
}

