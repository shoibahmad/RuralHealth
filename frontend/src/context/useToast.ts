import { useContext } from "react";

import { ToastContext } from "./contexts";

/**
 * Access the ToastContext value.
 *
 * Lives outside ToastContext.tsx so that module only exports components,
 * which is what keeps fast refresh working for the provider.
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
