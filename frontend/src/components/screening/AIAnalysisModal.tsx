
import { Button } from "../ui/button";
import { X, Sparkles, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: any;
    patientName?: string;
}

export function AIAnalysisModal({ isOpen, onClose, analysis, patientName }: AIAnalysisModalProps) {
    if (!isOpen || !analysis) return null;

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'High': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Low': return 'text-green-400 bg-green-500/10 border-green-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-teal-500/30 rounded-2xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-teal-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">AI Health Assessment</h2>
                                    {patientName && <p className="text-sm text-slate-400">For {patientName}</p>}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                                <X className="h-5 w-5 text-slate-400" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Risk Banner */}
                            <div className={`p-4 rounded-xl border flex items-center gap-4 ${getRiskColor(analysis.risk_level)}`}>
                                <Activity className="h-6 w-6" />
                                <div>
                                    <p className="text-sm font-medium opacity-80">Calculated Risk Level</p>
                                    <p className="text-lg font-bold">{analysis.risk_level} Risk</p>
                                </div>
                            </div>

                            {/* Clinical Summary */}
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                    Clinical Summary
                                </h3>
                                <p className="text-slate-300 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
                                    {analysis.summary}
                                </p>
                            </div>

                            {/* Key Concerns */}
                            {analysis.concerns && analysis.concerns.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-base font-semibold text-red-300 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Key Concerns
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.concerns.map((concern: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                                {concern}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-base font-semibold text-teal-300 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Recommendations
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end">
                            <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-500 text-white">
                                Save & Close
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
