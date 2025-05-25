"use client";
import type { User as FirebaseUser } from 'firebase/auth';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>; // Simplified login
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Firebase User type
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other properties your app might use from FirebaseUser
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking auth state
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser) as FirebaseUser);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (username === "testuser" && pass === "password") {
      const mockUser: MockUser = { uid: '123', email: 'testuser@example.com', displayName: 'Test User' };
      // This is a hack. In a real app, you'd get a FirebaseUser object.
      // For mock purposes, we cast our MockUser to FirebaseUser.
      setUser(mockUser as FirebaseUser); 
      localStorage.setItem('authUser', JSON.stringify(mockUser));
    } else {
      throw new Error("Invalid credentials");
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    localStorage.removeItem('authUser');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
