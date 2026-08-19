import { useContext } from "react";

import { AuthContext } from "./contexts";

/**
 * Access the AuthContext value.
 *
 * Lives outside AuthContext.tsx so that module only exports components,
 * which is what keeps fast refresh working for the provider.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
