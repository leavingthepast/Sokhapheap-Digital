// Firebase is decommissioned in favor of Supabase (PostgreSQL + Supabase Auth + Supabase Storage).
// This file provides safe mock stubs to prevent legacy code from making unauthorized network calls.

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
}

export const auth = {
  currentUser: null as FirebaseUser | null,
  signOut: async () => {},
  onAuthStateChanged: (_cb: any) => () => {},
};

export const db = {} as any;

export const signInWithEmailAndPassword = async () => {
  throw new Error('Firebase Auth is disabled. Please use Supabase authentication.');
};

export const createUserWithEmailAndPassword = async () => {
  throw new Error('Firebase Auth is disabled. Please use Supabase authentication.');
};

export const signOut = async () => {};
export const onAuthStateChanged = (_auth: any, _cb: any) => () => {};



