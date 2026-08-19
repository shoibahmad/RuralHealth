import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";

const mockHandleProfileUpdate = vi.fn();
const mockHandlePasswordUpdate = vi.fn();
const mockSetProfileData = vi.fn();
const mockSetPasswordData = vi.fn();

const formHookState = {
    user: { uid: "user-123", role: "health_worker" },
    loading: false,
    message: null as { type: "success" | "error"; text: string } | null,
    profileData: {
        full_name: "Dr. Priya Verma",
        email: "priya@example.com",
        age: "38",
        gender: "Female",
        village: "Chandpur",
        phone: "9876543210",
    },
    setProfileData: mockSetProfileData,
    passwordData: {
        current_password: "",
        new_password: "",
        confirm_password: "",
    },
    setPasswordData: mockSetPasswordData,
    handleProfileUpdate: mockHandleProfileUpdate,
    handlePasswordUpdate: mockHandlePasswordUpdate,
};

vi.mock("../hooks/useSettingsForm", () => ({
    useSettingsForm: () => formHookState,
}));

describe("SettingsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        formHookState.message = null;
        formHookState.loading = false;
    });

    it("renders profile settings and account details correctly", () => {
        render(<SettingsPage />);

        expect(screen.getByText("Settings")).toBeInTheDocument();
        expect(screen.getByText("Profile Information")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Dr. Priya Verma")).toBeInTheDocument();
        expect(screen.getByDisplayValue("priya@example.com")).toBeInTheDocument();
        expect(screen.getByText("Change Password")).toBeInTheDocument();
        expect(screen.getByText("Account Information")).toBeInTheDocument();
        expect(screen.getByText(/health worker/i)).toBeInTheDocument();
    });

    it("displays success message banner when message is present", () => {
        formHookState.message = {
            type: "success",
            text: "Profile updated successfully!",
        };

        render(<SettingsPage />);
        expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
    });

    it("displays error message banner when error occurs", () => {
        formHookState.message = {
            type: "error",
            text: "Failed to update profile",
        };

        render(<SettingsPage />);
        expect(screen.getByText("Failed to update profile")).toBeInTheDocument();
    });

    it("submits profile form when save changes button is clicked", async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        const saveProfileBtn = screen.getByRole("button", { name: /Save Changes/i });
        await user.click(saveProfileBtn);

        expect(mockHandleProfileUpdate).toHaveBeenCalled();
    });

    it("submits password form when update password button is clicked", async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        const updatePasswordBtn = screen.getByRole("button", { name: /Update Password/i });
        await user.click(updatePasswordBtn);

        expect(mockHandlePasswordUpdate).toHaveBeenCalled();
    });
});
