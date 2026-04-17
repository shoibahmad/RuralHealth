
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { VoiceEntryBanner } from "./VoiceEntryBanner";
import { translations } from "../../lib/translations";

interface PatientDemographicsFormProps {
    data: any;
    updateData: (data: any) => void;
    language: "en" | "hi";
}

export function PatientDemographicsForm({ data, updateData, language }: PatientDemographicsFormProps) {
    const t = translations[language];
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <VoiceEntryBanner
                data={data}
                updateData={updateData}
                language={language}
                title={language === 'en' ? "Voice Identity Check" : "आवाज पहचान जांच"}
                description={language === 'en' ? "Speak patient name, age, and village to auto-fill." : "ऑटो-फिल करने के लिए रोगी का नाम, आयु और गांव बोलें।"}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-slate-300">{t.full_name}</Label>
                    <Input
                        id="full_name"
                        value={data.full_name || ""}
                        onChange={(e) => updateData({ ...data, full_name: e.target.value })}
                        placeholder={language === 'en' ? "e.g. Ram Singh" : "जैसे: राम सिंह"}
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="age" className="text-slate-300">{t.age}</Label>
                    <Input
                        id="age"
                        type="number"
                        value={data.age || ""}
                        onChange={(e) => updateData({ ...data, age: e.target.value })}
                        placeholder={t.years}
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender" className="text-slate-300">{t.gender}</Label>
                    <Select
                        value={data.gender || ""}
                        onValueChange={(val) => updateData({ ...data, gender: val })}
                    >
                        <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                            <SelectValue placeholder={t.select_gender} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="Male" className="focus:bg-teal-500/20 focus:text-white">{t.male}</SelectItem>
                            <SelectItem value="Female" className="focus:bg-teal-500/20 focus:text-white">{t.female}</SelectItem>
                            <SelectItem value="Other" className="focus:bg-teal-500/20 focus:text-white">{t.other}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="village" className="text-slate-300">{t.village}</Label>
                    <Input
                        id="village"
                        value={data.village || ""}
                        onChange={(e) => updateData({ ...data, village: e.target.value })}
                        placeholder={t.village_placeholder}
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">{t.phone}</Label>
                    <Input
                        id="phone"
                        value={data.phone || ""}
                        onChange={(e) => updateData({ ...data, phone: e.target.value })}
                        placeholder="+91..."
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
            </div>
        </div>
    )
}
