import { useState } from "react";
import { Check, Activity, Wine, Cigarette } from "lucide-react";
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
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-orange-600 bg-orange-100 rounded-full flex items-center justify-center">
                            <Cigarette className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Tobacco Use</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>Do you currently smoke tobacco?</Label>
                        <Select
                            value={data.smoking_status || ""}
                            onValueChange={(val) => updateData({ ...data, smoking_status: val })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Never">Never</SelectItem>
                                <SelectItem value="Former">Former Smoker</SelectItem>
                                <SelectItem value="Current">Current Smoker</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Alcohol */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-purple-600 bg-purple-100 rounded-full flex items-center justify-center">
                            <Wine className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Alcohol Consumption</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>Alcohol intake frequency?</Label>
                        <Select
                            value={data.alcohol_usage || ""}
                            onValueChange={(val) => updateData({ ...data, alcohol_usage: val })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">None / Rare</SelectItem>
                                <SelectItem value="Moderate">Moderate (1-2 drinks/day)</SelectItem>
                                <SelectItem value="Heavy">Heavy ({'>'}2 drinks/day)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Physical Activity */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 text-green-600 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Physical Activity</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>Weekly physical activity level (WHO Guidelines)</Label>
                        <Select
                            value={data.physical_activity || ""}
                            onValueChange={(val) => updateData({ ...data, physical_activity: val })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select activity level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low (Sedentary lifestyle)</SelectItem>
                                <SelectItem value="Moderate">Moderate (150 mins/week)</SelectItem>
                                <SelectItem value="High">High (Active job/exercise)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

            </div>
        </div>
    )
}
