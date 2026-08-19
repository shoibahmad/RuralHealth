import { useState, useEffect } from "react";
import {
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { firestoreService } from "../services/firestoreService";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { createLogger } from "../lib/logger";
import { errorMessage } from "../lib/errors";

const log = createLogger("SettingsPage");

export interface ProfileData {
    full_name: string;
    email: string;
    age: string;
    gender: string;
    village: string;
    phone: string;
}

export interface PasswordData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export interface FormMessage {
    type: "success" | "error";
    text: string;
}

export interface UseSettingsFormResult {
    user: ReturnType<typeof useAuth>["user"];
    loading: boolean;
    message: FormMessage | null;
    profileData: ProfileData;
    setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
    passwordData: PasswordData;
    setPasswordData: React.Dispatch<React.SetStateAction<PasswordData>>;
    handleProfileUpdate: (e: React.FormEvent) => Promise<void>;
    handlePasswordUpdate: (e: React.FormEvent) => Promise<void>;
}

export function useSettingsForm(): UseSettingsFormResult {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<FormMessage | null>(null);

    const [profileData, setProfileData] = useState<ProfileData>({
        full_name: "",
        email: "",
        age: "",
        gender: "",
        village: "",
        phone: "",
    });

    const [passwordData, setPasswordData] = useState<PasswordData>({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                // Load Auth Data
                const baseData: ProfileData = {
                    full_name: user.displayName || user.full_name || "",
                    email: user.email || "",
                    age: "",
                    gender: "",
                    village: "",
                    phone: "",
                };

                // Load Clinical Data from 'patients' collection
                try {
                    const patientDoc = await firestoreService.getPatient(user.uid);
                    if (patientDoc) {
                        baseData.age = patientDoc.age?.toString() || "";
                        baseData.gender = patientDoc.gender || "";
                        baseData.village = patientDoc.village || "";
                        baseData.phone = patientDoc.phone || "";
                    }
                } catch (err) {
                    log.error("Failed to load clinical profile", err);
                }

                setProfileData(baseData);
            }
        };
        loadData();
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!auth.currentUser) throw new Error("No user logged in");

            // Update Auth Profile
            if (profileData.full_name !== auth.currentUser.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: profileData.full_name,
                });
            }

            // Update Firestore Doc (users collection)
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                full_name: profileData.full_name,
            });

            // Update Clinical Profile (patients collection)
            // Linked by UID
            await firestoreService.setPatient(auth.currentUser.uid, {
                full_name: profileData.full_name,
                age: parseInt(profileData.age) || 0,
                gender: profileData.gender,
                village: profileData.village,
                phone: profileData.phone,
                // created_at will be handled by setPatient if new
            });

            showToast("Profile updated successfully!", "success");
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error: unknown) {
            const msg = errorMessage(error, "Failed to update profile");
            log.error("Profile update failed", error);
            showToast(msg, "error");
            setMessage({ type: "error", text: msg });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: "error", text: "New passwords do not match!" });
            setLoading(false);
            return;
        }

        if (passwordData.new_password.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters long!" });
            setLoading(false);
            return;
        }

        try {
            if (!auth.currentUser || !auth.currentUser.email)
                throw new Error("No user logged in");

            // Re-authenticate first
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                passwordData.current_password,
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update Password
            await updatePassword(auth.currentUser, passwordData.new_password);

            showToast("Password changed successfully!", "success");
            setMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (error: unknown) {
            log.error("Password change failed", error);
            showToast(errorMessage(error, "Failed to change password"), "error");
            setMessage({
                type: "error",
                text: errorMessage(error, "Failed to change password. Check current password."),
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        message,
        profileData,
        setProfileData,
        passwordData,
        setPasswordData,
        handleProfileUpdate,
        handlePasswordUpdate,
    };
}
