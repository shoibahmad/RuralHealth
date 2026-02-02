/**
 * Offline Indicator Component
 * Shows connection status and sync progress
 */

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Check, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';
import { Button } from './ui/button';

export function OfflineIndicator() {
    const { isOnline, pendingSyncCount, syncStatus, syncNow } = useOffline();

    return (
        <>
            {/* Offline Banner */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <WifiOff className="h-4 w-4" />
                        <span>You're offline. Data will be saved locally and synced when connected.</span>
                    </motion.div>
                )}
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
