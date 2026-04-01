"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // 14-Tage Trial für neuen Nutzer initialisieren
    try {
      await fetch("/api/user/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: cred.user.uid, email }),
      });
    } catch {
      // Trial-Init im Hintergrund — kein blocking Error
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Trial für neue Google-Nutzer initialisieren (ignoriert wenn bereits vorhanden)
    try {
      await fetch("/api/user/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: cred.user.uid, email: cred.user.email }),
      });
    } catch {
      //
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, register, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  return ctx;
}
