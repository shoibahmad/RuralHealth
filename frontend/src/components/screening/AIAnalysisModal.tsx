import { Button } from "../ui/button";
import { X, Sparkles, Activity, AlertTriangle, CheckCircle2, FlaskConical, ClipboardCheck, ArrowRight, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { useState, useEffect, useRef } from "react";
import { translations } from "../../lib/translations";

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: any;
    patientName?: string;
    language?: 'en' | 'hi';
}

export function AIAnalysisModal({ isOpen, onClose, analysis, patientName, language = 'en' }: AIAnalysisModalProps) {
    const [localLanguage, setLocalLanguage] = useState<'en' | 'hi'>(language);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSpeakingRef = useRef(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const t = translations[localLanguage];

    // Pre-load voices immediately
    useEffect(() => {
        const load = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) setAvailableVoices(v);
        };
        load();
        window.speechSynthesis.onvoiceschanged = load;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    useEffect(() => {
        setLocalLanguage(language);
    }, [language, isOpen]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            isSpeakingRef.current = false;
            setIsSpeaking(false);
        };
    }, []);

    useEffect(() => {
        let interval: any;
        if (isSpeaking) {
            interval = setInterval(() => {
                if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [isSpeaking]);

    if (!isOpen || !analysis) return null;

    const handleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        // Clean up text for synthesis (remove markdown **)
        const clean = (txt: string) => txt.replace(/\*\*/g, '').replace(/[\n\r]/g, ' ').trim();

        const rawText = localLanguage === 'en'
            ? `${analysis.summary}. Concerns: ${analysis.concerns.join(', ')}. Recommendations: ${analysis.recommendations.join(', ')}`
            : `${analysis.summary_hi || analysis.summary}. मुख्य समस्याएं: ${(analysis.concerns_hi || analysis.concerns).join(', ')}. सलाह: ${(analysis.recommendations_hi || analysis.recommendations).join(', ')}`;

        const textToSpeak = clean(rawText);
        if (!textToSpeak) return;

        // Reset memory-locked utterance
        window.speechSynthesis.cancel();
        
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = localLanguage === 'en' ? 'en-US' : 'hi-IN';
            
            // Critical Chrome Fix: Keep a reference to prevent garbage collection
            utteranceRef.current = utterance;

            const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
            let voice: SpeechSynthesisVoice | undefined;

            if (localLanguage === 'hi') {
                voice = voices.find(v => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) && v.name.includes('Google')) ||
                        voices.find(v => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) && v.name.includes('Microsoft')) ||
                        voices.find(v => v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) ||
                        voices.find(v => v.lang.toLowerCase().includes('in') && (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hin')));
            } else {
                voice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) ||
                        voices.find(v => v.lang.includes('en-US')) ||
                        voices.find(v => v.lang.includes('en'));
            }
            
            if (voice) utterance.voice = voice;
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                setIsSpeaking(true);
                isSpeakingRef.current = true;
            };
            utterance.onend = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                utteranceRef.current = null;
            };
            utterance.onerror = (e) => {
                console.error("Critical Speech Error Code:", e.error);
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                utteranceRef.current = null;
            };

            window.speechSynthesis.speak(utteranceRef.current);
            window.speechSynthesis.resume();
        }, 50); // 50ms delay after cancel and before speak avoids most interruptions
    };

    const getRiskStyles = (level: string) => {
        switch (level) {
            case 'High': return {
                text: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
                gradient: 'from-red-500/20 to-transparent',
                label: localLanguage === 'hi' ? 'उच्च' : 'High'
            };
            case 'Medium': return {
                text: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                icon: <Activity className="h-6 w-6 text-amber-400" />,
                gradient: 'from-amber-500/20 to-transparent',
                label: localLanguage === 'hi' ? 'मध्यम' : 'Medium'
            };
            case 'Low': return {
                text: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                icon: <ShieldCheck className="h-6 w-6 text-green-400" />,
                gradient: 'from-green-500/20 to-transparent',
                label: localLanguage === 'hi' ? 'कम' : 'Low'
            };
            default: return {
                text: 'text-slate-400',
                bg: 'bg-slate-500/10',
                border: 'border-slate-500/20',
                icon: <Activity className="h-6 w-6 text-slate-400" />,
                gradient: 'from-slate-500/20 to-transparent',
                label: level
            };
        }
    };

    const risk = getRiskStyles(analysis.risk_level);

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                damping: 25,
                stiffness: 300,
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-slate-900/90 border border-white/10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col"
                    >
                        {/* Background Decorative Glow */}
                        <div className={cn("absolute -top-24 -right-24 h-64 w-64 blur-[100px] rounded-full opacity-20 bg-gradient-to-br", risk.gradient)} />

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between p-8 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-inner">
                                    <Sparkles className="h-6 w-6 text-teal-400 animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">
                                        {localLanguage === 'hi' ? 'Gemini AI विश्लेषण' : 'Gemini AI Analysis'}
                                    </h2>
                                    {patientName && (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                            <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
                                                {localLanguage === 'hi' ? `रोगी: ${patientName}` : `Patient: ${patientName}`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setLocalLanguage('en')}
                                        className={cn(
                                            "text-[10px] h-7 px-3 rounded-lg transition-all font-bold tracking-widest",
                                            localLanguage === 'en' ? "bg-teal-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        EN
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setLocalLanguage('hi')}
                                        className={cn(
                                            "text-[10px] h-7 px-3 rounded-lg transition-all font-bold tracking-widest",
                                            localLanguage === 'hi' ? "bg-teal-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        हिन्दी
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all h-10 w-10 border border-white/5"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="relative z-10 flex-1 overflow-y-auto p-8 pt-4 space-y-6 custom-scrollbar">

                            {/* Top Grid: Risk & Summary */}
                            <div className="grid md:grid-cols-5 gap-6">
                                {/* Risk Score Card */}
                                <motion.div variants={itemVariants} className={cn("md:col-span-2 p-6 rounded-[1.5rem] border relative overflow-hidden flex flex-col justify-between group transition-all hover:shadow-lg", risk.bg, risk.border)}>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60">
                                                {localLanguage === 'hi' ? 'स्वास्थ्य गंभीरता' : 'Health Severity'}
                                            </span>
                                            {risk.icon}
                                        </div>
                                        <h3 className={cn("text-4xl font-black tracking-tighter mb-1", risk.text)}>
                                            {risk.label}
                                        </h3>
                                        <p className="text-xs font-bold opacity-70 uppercase tracking-wider">
                                            {localLanguage === 'hi' ? 'नैदानिक जोखिम स्थिति' : 'Clinical Risk Status'}
                                        </p>
                                    </div>
                                    <div className="mt-8 relative z-10">
                                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: analysis.risk_level === 'High' ? '90%' : analysis.risk_level === 'Medium' ? '50%' : '20%' }}
                                                className={cn("h-full rounded-full", analysis.risk_level === 'High' ? 'bg-red-500' : analysis.risk_level === 'Medium' ? 'bg-amber-500' : 'bg-green-500')}
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Clinical Summary */}
                                <motion.div variants={itemVariants} className="md:col-span-3 p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 flex flex-col group hover:bg-white/[0.05] transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ClipboardCheck className="h-4 w-4 text-teal-400/70" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">
                                            {localLanguage === 'hi' ? 'कार्यकारी सारांश' : 'Executive Summary'}
                                        </span>
                                    </div>
                                    <p className="text-slate-200 text-sm leading-relaxed font-medium">
                                        {localLanguage === 'hi' ? (analysis.summary_hi || analysis.summary) : analysis.summary}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Lab Observations if available */}
                            {analysis.formatted_insights && (
                                <motion.div variants={itemVariants} className="p-1 rounded-[1.5rem] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent border border-white/5">
                                    <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[1.4rem]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <FlaskConical className="h-5 w-5 text-purple-400" />
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest">
                                                {localLanguage === 'hi' ? 'नैदानिक अंतर्दृष्टि' : 'Diagnostic Deep-Dive'}
                                            </h4>
                                        </div>
                                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                            <div className="grid gap-3 opacity-90 leading-relaxed italic border-l-2 border-purple-500/30 pl-4 py-1">
                                                {(localLanguage === 'hi' ? (analysis.formatted_insights_hi || analysis.formatted_insights) : analysis.formatted_insights).split('\n').map((line: string, i: number) => (
                                                    <p key={i} className={cn(line.startsWith('**') ? "font-bold text-white not-italic mt-2" : "")}>
                                                        {line.replace(/\*\*/g, '')}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Section: Critical Concerns & Actions */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Concerns */}
                                <motion.div variants={itemVariants} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <AlertTriangle className="h-4 w-4 text-red-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {localLanguage === 'hi' ? 'प्रमुख चिंताएं' : 'Priority Concerns'}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {(localLanguage === 'hi' ? (analysis.concerns_hi || analysis.concerns) : analysis.concerns)?.map((item: string, i: number) => (
                                            <div key={i} className="group p-4 rounded-2xl bg-red-500/[0.03] border border-red-500/10 flex items-start gap-3 transition-all hover:bg-red-500/[0.06]">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                                <span className="text-xs font-bold text-red-200/80 leading-snug">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Recommendations */}
                                <motion.div variants={itemVariants} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <CheckCircle2 className="h-4 w-4 text-teal-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {localLanguage === 'hi' ? 'उपचार योजना' : 'Treatment Plan'}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {(localLanguage === 'hi' ? (analysis.recommendations_hi || analysis.recommendations) : analysis.recommendations)?.map((item: string, i: number) => (
                                            <div key={i} className="group p-4 rounded-2xl bg-teal-500/[0.03] border border-teal-500/10 flex items-start gap-3 transition-all hover:bg-teal-500/[0.06]">
                                                <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-teal-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                                                <span className="text-xs font-bold text-teal-100/80 leading-snug">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="relative z-10 p-8 pt-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={() => handleSpeech()}
                                    variant="outline"
                                    className={cn(
                                        "rounded-xl px-6 py-5 border-white/10 transition-all flex items-center gap-2",
                                        isSpeaking ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-teal-400 hover:bg-white/10"
                                    )}
                                >
                                    {isSpeaking ? (
                                        <>
                                            <VolumeX className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{t.stop_narration}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{t.narrate}</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                            <Button
                                onClick={onClose}
                                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-black uppercase tracking-widest text-[10px] px-8 py-6 rounded-2xl shadow-xl shadow-teal-500/20 border-0 transition-all hover:scale-105 active:scale-95 h-auto"
                            >
                                {localLanguage === 'hi' ? 'पुष्टि करें और समाप्त करें' : 'Confirm & Finalize'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
