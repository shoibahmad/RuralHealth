import { useContext } from "react";

import { OfflineContext } from "./contexts";

/**
 * Access the OfflineContext value.
 *
 * Lives outside OfflineContext.tsx so that module only exports components,
 * which is what keeps fast refresh working for the provider.
 */
export function useOffline() {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error("useOffline must be used within an OfflineProvider");
    }
    return context;
}
