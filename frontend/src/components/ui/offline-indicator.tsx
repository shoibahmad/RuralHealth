import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOfflineStorage } from "../../hooks/useOfflineStorage";
import { Button } from "./button";

export function OfflineIndicator() {
  const { isOnline, isSyncing, syncNow } = useOfflineStorage();

  if (isOnline && !isSyncing) {
    return null; // Don't show anything when online and not syncing
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
        isOnline 
          ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' 
          : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
      }`}>
        {isSyncing ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Syncing data...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <span className="text-sm font-medium">Back online</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={syncNow}
              className="h-7 px-2 text-xs hover:bg-teal-500/20"
            >
              Sync Now
            </Button>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        )}
      </div>
    </div>
  );
}
