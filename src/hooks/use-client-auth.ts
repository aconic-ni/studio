"use client";
import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';

export const useClientAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within an AuthProvider');
  }
  return context;
};
