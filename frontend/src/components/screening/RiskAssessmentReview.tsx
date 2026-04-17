import { translations } from "../../lib/translations";
import { AlertTriangle, Activity, Thermometer, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface RiskAssessmentReviewProps {
    data: any;
    language: "en" | "hi";
}

export function RiskAssessmentReview({ data, language }: RiskAssessmentReviewProps) {
    const t = translations[language];
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{t.review_submit}</h3>
                <p className="text-slate-400">{t.verify_info}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Details */}
                <Card className="glass-card border-none bg-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white flex items-center gap-2">
                            <User className="h-5 w-5 text-teal-400" /> {t.patient_profile}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400 text-xs">{t.full_name}</span>
                            <span className="text-white font-medium text-xs">{data.full_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400 text-xs text-left">{t.age} / {t.gender}</span>
                            <span className="text-white font-medium text-xs">{data.age} / {data.gender}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400 text-xs">{t.location}</span>
                            <span className="text-white font-medium text-xs">{data.village || "N/A"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Vitals Summary */}
                <Card className="glass-card border-none bg-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-400" /> {t.clinical_vitals}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400 text-xs">{t.blood_pressure}</span>
                            <span className="text-white font-medium text-xs">{data.systolic_bp}/{data.diastolic_bp} mmHg</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">BMI</span>
                            <span className="text-white font-medium">
                                {data.weight_kg && data.height_cm
                                    ? (data.weight_kg / ((data.height_cm / 100) ** 2)).toFixed(1)
                                    : "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400 text-xs">{t.pulse_hr}</span>
                            <span className="text-white font-medium text-xs">{data.heart_rate || "N/A"} bpm</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Lab & Lifestyle */}
                <Card className="glass-card border-none bg-white/5 md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-purple-400" /> {t.lab_lifestyle}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">{t.glucose}</span>
                            <span className="text-white font-medium">{data.glucose_level ? `${data.glucose_level} mg/dL` : "Not Provided"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">{t.cholesterol}</span>
                            <span className="text-white font-medium">{data.cholesterol_level ? `${data.cholesterol_level} mg/dL` : "Not Provided"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">{t.tobacco_status}</span>
                            <span className={`font-medium ${data.smoking_status === 'Current' ? 'text-red-400' : 'text-slate-200'}`}>
                                {data.smoking_status || "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-400">{t.physical_activity}</span>
                            <span className={`font-medium ${data.physical_activity === 'Low' ? 'text-amber-400' : 'text-slate-200'}`}>
                                {data.physical_activity || "N/A"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-blue-200 font-semibold text-sm">AI Prediction Ready</h4>
                    <p className="text-blue-300/70 text-sm">
                        Upon submission, Gemini 1.5 Pro will process these 12 parameters to generate a WHO CVD Risk Score and provide personalized intervention guidelines.
                    </p>
                </div>
            </div>
        </div>
    )
}
