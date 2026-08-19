import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showToast = vi.fn();
const authState: { user: { uid: string; displayName?: string; full_name?: string; email?: string } | null } = {
    user: null,
};

vi.mock("../context/useAuth", () => ({
    useAuth: () => authState,
}));

vi.mock("../context/useToast", () => ({
    useToast: () => ({ showToast }),
}));

vi.mock("../lib/firebase", () => ({
    auth: { currentUser: { uid: "u1", email: "test@example.com", displayName: "Old Name" } },
    db: {},
}));

vi.mock("firebase/auth", () => ({
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    reauthenticateWithCredential: vi.fn(),
    EmailAuthProvider: { credential: vi.fn() },
}));

vi.mock("firebase/firestore", () => ({
    doc: vi.fn(),
    updateDoc: vi.fn(),
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatient: vi.fn(),
        setPatient: vi.fn(),
    },
}));

import { firestoreService } from "../services/firestoreService";
import { updateProfile, updatePassword, reauthenticateWithCredential } from "firebase/auth";
import { updateDoc } from "firebase/firestore";
import { useSettingsForm } from "./useSettingsForm";

describe("useSettingsForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = {
            uid: "u1",
            full_name: "Test User",
            displayName: "Test User",
            email: "test@example.com",
        };
        vi.mocked(firestoreService.getPatient).mockResolvedValue({
            id: "u1",
            full_name: "Test User",
            age: 35,
            gender: "Female",
            village: "Village A",
            phone: "9876543210",
        } as unknown as Awaited<ReturnType<typeof firestoreService.getPatient>>);
    });

    it("loads profile data on mount when user is present", async () => {
        const { result } = renderHook(() => useSettingsForm());

        await waitFor(() => {
            expect(result.current.profileData.age).toBe("35");
        });

        expect(result.current.profileData.full_name).toBe("Test User");
        expect(result.current.profileData.gender).toBe("Female");
        expect(result.current.profileData.village).toBe("Village A");
    });

    it("handles profile update successfully", async () => {
        const { result } = renderHook(() => useSettingsForm());

        await waitFor(() => {
            expect(result.current.profileData.age).toBe("35");
        });

        act(() => {
            result.current.setProfileData((prev) => ({ ...prev, full_name: "Updated Name" }));
        });

        const syntheticEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

        await act(async () => {
            await result.current.handleProfileUpdate(syntheticEvent);
        });

        expect(updateProfile).toHaveBeenCalled();
        expect(updateDoc).toHaveBeenCalled();
        expect(firestoreService.setPatient).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith("Profile updated successfully!", "success");
        expect(result.current.message?.type).toBe("success");
    });

    it("validates password matching and length before update", async () => {
        const { result } = renderHook(() => useSettingsForm());

        act(() => {
            result.current.setPasswordData({
                current_password: "old",
                new_password: "pass1",
                confirm_password: "pass2",
            });
        });

        const syntheticEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

        await act(async () => {
            await result.current.handlePasswordUpdate(syntheticEvent);
        });

        expect(result.current.message?.text).toBe("New passwords do not match!");

        act(() => {
            result.current.setPasswordData({
                current_password: "old",
                new_password: "123",
                confirm_password: "123",
            });
        });

        await act(async () => {
            await result.current.handlePasswordUpdate(syntheticEvent);
        });

        expect(result.current.message?.text).toBe("Password must be at least 6 characters long!");
    });

    it("updates password successfully when valid", async () => {
        const { result } = renderHook(() => useSettingsForm());

        act(() => {
            result.current.setPasswordData({
                current_password: "oldPassword123",
                new_password: "newPassword456",
                confirm_password: "newPassword456",
            });
        });

        const syntheticEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

        await act(async () => {
            await result.current.handlePasswordUpdate(syntheticEvent);
        });

        expect(reauthenticateWithCredential).toHaveBeenCalled();
        expect(updatePassword).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith("Password changed successfully!", "success");
    });
});
