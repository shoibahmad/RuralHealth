
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface PatientDemographicsFormProps {
    data: any;
    updateData: (data: any) => void;
}

export function PatientDemographicsForm({ data, updateData }: PatientDemographicsFormProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
                    <Input
                        id="full_name"
                        value={data.full_name || ""}
                        onChange={(e) => updateData({ ...data, full_name: e.target.value })}
                        placeholder="e.g. Ram Singh"
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="age" className="text-slate-300">Age</Label>
                    <Input
                        id="age"
                        type="number"
                        value={data.age || ""}
                        onChange={(e) => updateData({ ...data, age: parseInt(e.target.value) || "" })}
                        placeholder="Years"
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender" className="text-slate-300">Gender</Label>
                    <Select
                        value={data.gender || ""}
                        onValueChange={(val) => updateData({ ...data, gender: val })}
                    >
                        <SelectTrigger className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="Male" className="focus:bg-teal-500/20 focus:text-white">Male</SelectItem>
                            <SelectItem value="Female" className="focus:bg-teal-500/20 focus:text-white">Female</SelectItem>
                            <SelectItem value="Other" className="focus:bg-teal-500/20 focus:text-white">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="village" className="text-slate-300">Village / Community</Label>
                    <Input
                        id="village"
                        value={data.village || ""}
                        onChange={(e) => updateData({ ...data, village: e.target.value })}
                        placeholder="Village Name"
                        className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone Number (Optional)</Label>
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
