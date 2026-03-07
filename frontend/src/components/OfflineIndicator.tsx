import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Check, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';
import { Button } from './ui/button';

export function OfflineIndicator() {
    const { isOnline, pendingSyncCount, syncStatus, syncNow } = useOffline();
    const [showOnlineBanner, setShowOnlineBanner] = useState(false);
    const prevOnlineRef = useRef(isOnline);

    useEffect(() => {
        // Only show "Back Online" if we were previously offline
        if (isOnline && !prevOnlineRef.current) {
            setShowOnlineBanner(true);
            const timer = setTimeout(() => {
                setShowOnlineBanner(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
        prevOnlineRef.current = isOnline;
    }, [isOnline]);

    return (
        <>
            {/* Connection Status Banner */}
            <AnimatePresence mode="wait">
                {!isOnline ? (
                    <motion.div
                        key="offline"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-md text-white py-3 px-6 flex items-center justify-center gap-3 text-sm font-bold shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
                    >
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        <WifiOff className="h-4 w-4" />
                        <span>Offline Mode: Data will be synced automatically when connection returns.</span>
                    </motion.div>
                ) : showOnlineBanner ? (
                    <motion.div
                        key="online"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-[100] bg-teal-500/95 backdrop-blur-md text-white py-3 px-6 flex items-center justify-center gap-3 text-sm font-bold shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
                    >
                        <Wifi className="h-4 w-4" />
                        <span>Internet Restored: Connection is back online.</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Sync Status Badge - Show when there's pending data or syncing */}
            <AnimatePresence>
                {(pendingSyncCount > 0 || syncStatus === 'syncing') && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <div className="glass-card rounded-xl p-4 border border-white/10 shadow-2xl min-w-[200px]">
                            <div className="flex items-center gap-3">
                                {syncStatus === 'syncing' ? (
                                    <>
                                        <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                                            <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Syncing...</p>
                                            <p className="text-slate-400 text-xs">{pendingSyncCount} items pending</p>
                                        </div>
                                    </>
                                ) : syncStatus === 'success' ? (
                                    <>
                                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Sync Complete</p>
                                            <p className="text-slate-400 text-xs">All data saved to server</p>
                                        </div>
                                    </>
                                ) : syncStatus === 'error' ? (
                                    <>
                                        <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Sync Failed</p>
                                            <p className="text-slate-400 text-xs">{pendingSyncCount} items pending</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <CloudOff className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Pending Sync</p>
                                            <p className="text-slate-400 text-xs">{pendingSyncCount} items waiting</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sync button when online and has pending items */}
                            {isOnline && pendingSyncCount > 0 && syncStatus !== 'syncing' && (
                                <Button
                                    onClick={syncNow}
                                    size="sm"
                                    className="w-full mt-3 bg-teal-500 hover:bg-teal-600 text-white"
                                >
                                    <Cloud className="h-4 w-4 mr-2" />
                                    Sync Now
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Compact version for header/sidebar
export function OfflineStatusBadge() {
    const { isOnline, pendingSyncCount, syncStatus } = useOffline();

    if (isOnline && pendingSyncCount === 0 && syncStatus === 'idle') {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {!isOnline ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                </div>
            ) : pendingSyncCount > 0 ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                    {syncStatus === 'syncing' ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                        <Cloud className="h-3 w-3" />
                    )}
                    <span>{pendingSyncCount} pending</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                    <Wifi className="h-3 w-3" />
                    <span>Online</span>
                </div>
            )}
        </div>
    );
}
