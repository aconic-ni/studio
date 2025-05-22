
// src/lib/localUsers.ts
import type { UserRole } from './schemas';

export interface LocalUser {
  email: string;
  password: string; // IMPORTANT: For local testing only. Do not use plain text passwords in production.
  role: UserRole;
}

/**
 * IMPORTANT: This file is for local development and testing convenience only.
 * It allows defining users that can bypass Firebase authentication for quick role testing.
 * DO NOT commit sensitive or real user credentials here.
 * Plain text passwords are used here strictly for local, isolated testing scenarios.
 * Firebase Authentication and Firestore remain the primary source of truth for user management in production.
 */
export const localUsers: LocalUser[] = [
  {
    email: 'localadmin@example.com',
    password: 'adminpassword', // Change as needed
    role: 'admin',
  },
  {
    email: 'localejecutivo@example.com',
    password: 'ejecutivopassword', // Change as needed
    role: 'ejecutivo',
  },
  {
    email: 'localgestor@example.com',
    password: 'gestorpassword', // Change as needed
    role: 'gestor',
  },
];

