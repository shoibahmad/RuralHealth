import { useState, useRef } from "react";
import { Upload, FileText, Camera, AlertCircle, CheckCircle2, Loader2, FastForward } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { translations } from "../../lib/translations";

interface InitialScanStepProps {
    onDataExtracted: (data: any) => void;
    onSkip: () => void;
    language: "en" | "hi";
}

export function InitialScanStep({ onDataExtracted, onSkip, language }: InitialScanStepProps) {
    const t = translations[language];
    const [isScanning, setIsScanning] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isPdf, setIsPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        if (selectedFile.type === "application/pdf") {
            setIsPdf(true);
            setPreview(null);
        } else {
            setIsPdf(false);
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreview(objectUrl);
        }
    };

    const startScan = async () => {
        if (!file) return;

        setIsScanning(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/ai/lab-extract", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to process document");
            }

            const result = await response.json();
            // console.log("Extracted result:", result); // Debugging
            onDataExtracted(result);
        } catch (err: any) {
            console.error("Scanning error:", err);
            setError(language === 'en' 
                ? "Could not extract data. Tesseract engine encountered an error. Please enter manually." 
                : "डेटा नहीं निकाला जा सका। टेसेरैक्ट इंजन में त्रुटि हुई। कृपया मैन्युअल रूप से दर्ज करें।");
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">{t.initial_scan_title}</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    {t.initial_scan_subtitle}
                </p>
            </div>

            <div className="flex flex-col items-center">
                {!file ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-xl aspect-[16/10] glass-card border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group"
                    >
                        <div className="h-16 w-16 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-semibold text-white mb-1">{t.click_to_upload}</p>
                        <p className="text-sm text-slate-500">{t.supports_formats}</p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                        />
                    </div>
                ) : (
                    <div className="w-full max-w-xl space-y-4">
                        <div className="relative aspect-[16/10] glass-card rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                            {isPdf ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <FileText className="h-20 w-20 mb-4 opacity-20" />
                                    <span className="font-medium">{file.name}</span>
                                    <span className="text-xs opacity-50">PDF Document</span>
                                </div>
                            ) : (
                                <img src={preview!} alt="Preview" className="w-full h-full object-contain opacity-50" />
                            )}

                            {isScanning && (
                                <>
                                    <div className="scan-line" />
                                    <div className="absolute inset-0 bg-teal-950/20 pointer-events-none" />
                                    {/* Simulated OCR Boxes */}
                                    <div className="ocr-box" style={{ top: '20%', left: '15%', width: '30%', height: '5%' }} />
                                    <div className="ocr-box" style={{ top: '40%', left: '10%', width: '20%', height: '8%' }} />
                                    <div className="ocr-box" style={{ top: '65%', left: '40%', width: '40%', height: '6%' }} />
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <div className="relative">
                                            <Loader2 className="h-12 w-12 animate-spin text-teal-400" />
                                            <div className="absolute inset-0 animate-ping opacity-20 bg-teal-500 rounded-full" />
                                        </div>
                                        <span className="mt-4 font-mono text-xs tracking-widest uppercase text-teal-300 animate-pulse">
                                            {t.ocr_scanning}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {!isScanning && (
                            <div className="flex gap-3">
                                <Button 
                                    onClick={() => setFile(null)} 
                                    variant="outline" 
                                    className="flex-1 border-white/10 text-slate-400 hover:text-white"
                                >
                                    {t.reselect}
                                </Button>
                                <Button 
                                    onClick={startScan} 
                                    className="flex-[2] bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-teal-500/25"
                                >
                                    {t.start_extraction}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="max-w-xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="pt-8 border-t border-white/5 flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={onSkip}
                    disabled={isScanning}
                    className="h-14 px-8 border-2 border-teal-500/50 bg-teal-500/5 text-teal-400 hover:bg-teal-500/10 hover:border-teal-400 transition-all group rounded-xl shadow-lg shadow-teal-500/10"
                >
                    <FastForward className="mr-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    <span className="text-base font-bold">{t.skip_manual}</span>
                </Button>
            </div>
        </div>
    );
}
