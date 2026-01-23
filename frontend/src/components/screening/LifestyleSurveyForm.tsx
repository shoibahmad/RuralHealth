import { Activity, Wine, Cigarette } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface LifestyleSurveyFormProps {
    data: any;
    updateData: (data: any) => void;
}

export function LifestyleSurveyForm({ data, updateData }: LifestyleSurveyFormProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Smoking */}
                <div className="space-y-4 p-4 border border-white/5 rounded-xl glass-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-orange-400 bg-orange-500/20 rounded-full flex items-center justify-center">
                            <Cigarette className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-white">Tobacco Use</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Do you currently smoke tobacco?</Label>
                        <Select
                            value={data.smoking_status || ""}
                            onValueChange={(val) => updateData({ ...data, smoking_status: val })}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="Never" className="focus:bg-teal-500/20 focus:text-white">Never</SelectItem>
                                <SelectItem value="Former" className="focus:bg-teal-500/20 focus:text-white">Former Smoker</SelectItem>
                                <SelectItem value="Current" className="focus:bg-teal-500/20 focus:text-white">Current Smoker</SelectItem>
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
                        <h3 className="font-semibold text-white">Alcohol Consumption</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Alcohol intake frequency?</Label>
                        <Select
                            value={data.alcohol_usage || ""}
                            onValueChange={(val) => updateData({ ...data, alcohol_usage: val })}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="None" className="focus:bg-teal-500/20 focus:text-white">None / Rare</SelectItem>
                                <SelectItem value="Moderate" className="focus:bg-teal-500/20 focus:text-white">Moderate (1-2 drinks/day)</SelectItem>
                                <SelectItem value="Heavy" className="focus:bg-teal-500/20 focus:text-white">Heavy ({'>'}2 drinks/day)</SelectItem>
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
                        <h3 className="font-semibold text-white">Physical Activity</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Weekly physical activity level (WHO Guidelines)</Label>
                        <Select
                            value={data.physical_activity || ""}
                            onValueChange={(val) => updateData({ ...data, physical_activity: val })}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                                <SelectValue placeholder="Select activity level" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="Low" className="focus:bg-teal-500/20 focus:text-white">Low (Sedentary lifestyle)</SelectItem>
                                <SelectItem value="Moderate" className="focus:bg-teal-500/20 focus:text-white">Moderate (150 mins/week)</SelectItem>
                                <SelectItem value="High" className="focus:bg-teal-500/20 focus:text-white">High (Active job/exercise)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    )
}
