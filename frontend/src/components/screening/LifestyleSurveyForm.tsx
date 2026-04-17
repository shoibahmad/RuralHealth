import { Activity, Wine, Cigarette } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { VoiceEntryBanner } from "./VoiceEntryBanner";
import { translations } from "../../lib/translations";

interface LifestyleSurveyFormProps {
    data: any;
    updateData: (data: any) => void;
    language: "en" | "hi";
}

export function LifestyleSurveyForm({ data, updateData, language }: LifestyleSurveyFormProps) {
    const t = translations[language];
    
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <VoiceEntryBanner
                data={data}
                updateData={updateData}
                language={language}
                title={language === 'en' ? "Lifestyle AI Assistant" : "जीवनशैली AI सहायक"}
                description={language === 'en' ? "Speak habits (e.g., 'I am a smoker, I exercise regularly')." : "आदतें बोलें (जैसे, 'मैं धूम्रपान करता हूँ, मैं नियमित रूप से व्यायाम करता हूँ')।"}
            />
            <div className="grid md:grid-cols-2 gap-8">
                {/* Smoking */}
                <div className="space-y-4 p-4 border border-white/5 rounded-xl glass-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-orange-400 bg-orange-500/20 rounded-full flex items-center justify-center">
                            <Cigarette className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-white">{t.tobacco_use}</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">{t.smoke_question}</Label>
                        <Select
                            value={data.smoking_status || ""}
                            onValueChange={(val) => updateData({ ...data, smoking_status: val })}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                                <SelectValue placeholder={t.select_status} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="Never" className="focus:bg-teal-500/20 focus:text-white">{t.never}</SelectItem>
                                <SelectItem value="Former" className="focus:bg-teal-500/20 focus:text-white">{t.former}</SelectItem>
                                <SelectItem value="Current" className="focus:bg-teal-500/20 focus:text-white">{t.current}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Alcohol */}
                <div className="space-y-4 p-4 border border-white/5 rounded-xl glass-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-purple-400 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <Wine className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-white">{t.alcohol_consumption}</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">{t.alcohol_question}</Label>
                        <Select
                            value={data.alcohol_usage || ""}
                            onValueChange={(val) => updateData({ ...data, alcohol_usage: val })}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                                <SelectValue placeholder={t.select_frequency} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="None" className="focus:bg-teal-500/20 focus:text-white">{t.none_rare}</SelectItem>
                                <SelectItem value="Moderate" className="focus:bg-teal-500/20 focus:text-white">{t.moderate}</SelectItem>
                                <SelectItem value="Heavy" className="focus:bg-teal-500/20 focus:text-white">{t.heavy}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Physical Activity */}
                <div className="space-y-4 p-4 border border-white/5 rounded-xl glass-card md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-green-400 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-white">{t.physical_activity}</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">{t.activity_question}</Label>
                        <Select
                            value={data.physical_activity || ""}
                            onValueChange={(val) => updateData({ ...data, physical_activity: val })}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                                <SelectValue placeholder={t.select_activity} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="Low" className="focus:bg-teal-500/20 focus:text-white">{t.low_activity}</SelectItem>
                                <SelectItem value="Moderate" className="focus:bg-teal-500/20 focus:text-white">{t.moderate_activity}</SelectItem>
                                <SelectItem value="High" className="focus:bg-teal-500/20 focus:text-white">{t.high_activity}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    )
}
