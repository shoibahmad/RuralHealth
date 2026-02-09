
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, FileText, Share2, Printer, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { firestoreService } from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";
import { riskUtils } from "../lib/riskUtils";

export function ScreeningDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [screening, setScreening] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScreening = async () => {
            if (id) {
                try {
                    const data = await firestoreService.getScreening(id);
                    setScreening(data);
                } catch (error) {
                    console.error("Failed to fetch screening:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchScreening();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading screening details...</div>;
    if (!screening) return <div className="p-8 text-center text-red-400">Screening not found.</div>;

    const getRiskColor = (level: string) => {
        switch (level) {
            case "High": return "text-red-400 border-red-500/50 bg-red-500/10";
            case "Medium": return "text-amber-400 border-amber-500/50 bg-amber-500/10";
            default: return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-300">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Screening Report</h1>
                        <p className="text-slate-400">
                            ID: #{screening.id?.slice(0, 8)} • {new Date(screening.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
            </div>

            {/* AI Insights Section - Main Highlight */}
            <Card className="glass-card p-0 overflow-hidden border-teal-500/30 shadow-lg shadow-teal-900/10">
                <div className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 p-4 border-b border-teal-500/20 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-300" />
                    <h2 className="font-semibold text-teal-100">AI Health Insights</h2>
                </div>
                <div className="p-6">
                    {screening.ai_insights ? (
                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-slate-200 leading-relaxed font-light">
                                {screening.ai_insights.split('**').map((part: string, i: number) =>
                                    i % 2 === 1 ? <span key={i} className="font-bold text-white">{part}</span> : part
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 italic">No AI insights generated for this screening.</p>
                    )}
                </div>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={`glass-card p-6 border-l-4 ${screening.risk_level === 'High' ? 'border-l-red-500' : screening.risk_level === 'Medium' ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
                    <p className="text-slate-400 text-sm">Overall Risk Level</p>
                    <p className={`text-3xl font-bold mt-2 ${getRiskColor(screening.risk_level).split(' ')[0]}`}>
                        {screening.risk_level}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Score: {screening.risk_score}</p>
                </Card>

                <Card className="glass-card p-6 border-white/5">
                    <Activity className="h-5 w-5 text-pink-400 mb-2" />
                    <p className="text-slate-400 text-sm">Blood Pressure</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                        {screening.systolic_bp || '--'}/{screening.diastolic_bp || '--'} <span className="text-sm text-slate-500">mmHg</span>
                    </p>
                </Card>

                <Card className="glass-card p-6 border-white/5">
                    <FileText className="h-5 w-5 text-blue-400 mb-2" />
                    <p className="text-slate-400 text-sm">BMI Score</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                        {riskUtils.calculateBMI(screening.height_cm, screening.weight_kg) || '--'}
                    </p>
                </Card>
            </div>

            {/* Detailed Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card p-6 border-white/5">
                    <h3 className="font-semibold text-white mb-4 border-b border-white/10 pb-2">Vitals & Measurements</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-slate-500">Height</dt>
                            <dd className="text-slate-200">{screening.height_cm || 'N/A'} cm</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Weight</dt>
                            <dd className="text-slate-200">{screening.weight_kg || 'N/A'} kg</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Heart Rate</dt>
                            <dd className="text-slate-200">{screening.heart_rate || 'N/A'} bpm</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Glucose</dt>
                            <dd className="text-slate-200">{screening.glucose_level || 'N/A'} mg/dL</dd>
                        </div>
                    </dl>
                </Card>

                <Card className="glass-card p-6 border-white/5">
                    <h3 className="font-semibold text-white mb-4 border-b border-white/10 pb-2">Lifestyle & History</h3>
                    <dl className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Smoking Status</dt>
                            <dd className="text-slate-200 capitalize">{screening.smoking_status || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Alcohol Consumption</dt>
                            <dd className="text-slate-200 capitalize">{screening.alcohol_usage || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Physical Activity</dt>
                            <dd className="text-slate-200 capitalize">{screening.physical_activity || 'N/A'}</dd>
                        </div>
                    </dl>
                </Card>
            </div>
        </div>
    );
}
