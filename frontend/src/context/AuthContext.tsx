import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export interface User extends FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: string;
    full_name?: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isHealthOfficer: boolean;
    isHealthWorker: boolean;
    isPatient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch additional user data from Firestore
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({
                            ...firebaseUser,
                            role: userData.role,
                            full_name: userData.full_name,
                            phone: userData.phone
                        });
                    } else {
                        // Fallback if user doc doesn't exist yet
                        setUser(firebaseUser);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            logout,
            isAuthenticated: !!user,
            isHealthOfficer: user?.role === 'health_officer' || user?.role === 'admin',
            isHealthWorker: user?.role === 'health_worker' || !user?.role, // Default to worker if undefined for now
            isPatient: user?.role === 'patient'
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
