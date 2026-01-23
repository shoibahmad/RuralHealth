
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
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                        id="full_name"
                        value={data.full_name || ""}
                        onChange={(e) => updateData({ ...data, full_name: e.target.value })}
                        placeholder="e.g. Ram Singh"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                        id="age"
                        type="number"
                        value={data.age || ""}
                        onChange={(e) => updateData({ ...data, age: parseInt(e.target.value) || "" })}
                        placeholder="Years"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                        value={data.gender || ""}
                        onValueChange={(val) => updateData({ ...data, gender: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="village">Village / Community</Label>
                    <Input
                        id="village"
                        value={data.village || ""}
                        onChange={(e) => updateData({ ...data, village: e.target.value })}
                        placeholder="Village Name"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                        id="phone"
                        value={data.phone || ""}
                        onChange={(e) => updateData({ ...data, phone: e.target.value })}
                        placeholder="+91..."
                    />
                </div>
            </div>
        </div>
    )
}
