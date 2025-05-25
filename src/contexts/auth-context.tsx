
"use client";
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // Import the auth instance

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user
    } catch (error) {
      setLoading(false); // Ensure loading is false on error
      throw error; // Re-throw error to be caught by the form
    }
    // setLoading(false) will be handled by onAuthStateChanged listener indirectly
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting the user to null
    } catch (error) {
      console.error("Error signing out: ", error);
      // Still set loading to false, user might still be technically logged in if signOut fails
      setLoading(false); 
    }
    // setLoading(false) will be handled by onAuthStateChanged listener indirectly
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
