import { supabase } from '../supabaseClient';

export interface SupabaseUser {
  uid: string;
  email: string;
  displayName: string;
}

export function formatSupabaseAuthError(error: any, mode: 'login' | 'signup'): string {
  if (!error) return 'An error occurred during authentication.';
  
  const code = (error.code || '').toLowerCase();
  const message = error.message || '';

  if (mode === 'login') {
    if (
      code === 'invalid_credentials' ||
      message.toLowerCase().includes('invalid login credentials') ||
      message.toLowerCase().includes('invalid password') ||
      message.toLowerCase().includes('user not found')
    ) {
      return 'Email or password is incorrect. Please check your credentials.';
    }
    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Check your email and confirm your account before logging in.';
    }
  }

  if (mode === 'signup') {
    if (
      code === 'user_already_exists' ||
      message.toLowerCase().includes('user already registered') ||
      message.toLowerCase().includes('already exists')
    ) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'weak_password' || message.toLowerCase().includes('password should be at least 6 characters')) {
      return 'Password must be at least 6 characters long.';
    }
    if (code === 'email_address_invalid' || message.toLowerCase().includes('email address') || message.toLowerCase().includes('invalid email')) {
      return 'Please provide a valid email address (e.g. name@domain.com).';
    }
    if (code === 'over_email_send_rate_limit') {
      return 'Too many sign-up emails sent. Please wait a few minutes before trying again.';
    }
  }

  if (message.toLowerCase().includes('rate limit')) {
    return 'Too many requests. Please wait a few moments and try again.';
  }

  if (message.toLowerCase().includes('firebase') || message.includes('api-key-not-valid')) {
    return 'Session expired or configuration refreshed. Please sign in with your email and password.';
  }

  return message || 'Authentication failed. Please try again.';
}

export async function signInWithSupabase(email: string, password: string): Promise<{ user: SupabaseUser; session: any }> {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session || !data.user) {
    throw new Error('Check your email and confirm your account before logging in.');
  }

  return {
    user: {
      uid: data.user.id,
      email: data.user.email || cleanEmail,
      displayName: data.user.user_metadata?.name || cleanEmail.split('@')[0],
    },
    session: data.session,
  };
}

export async function signUpWithSupabase(
  name: string,
  email: string,
  password: string
): Promise<{
  user: SupabaseUser | null;
  session: any | null;
  requiresEmailConfirmation: boolean;
  message: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        name: cleanName,
      },
    },
  });

  if (error) {
    throw error;
  }

  const session = data.session || null;
  const user = data.user
    ? {
        uid: data.user.id,
        email: data.user.email || cleanEmail,
        displayName: data.user.user_metadata?.name || cleanName,
      }
    : null;

  const requiresEmailConfirmation = !session;
  const message = requiresEmailConfirmation
    ? 'Check your email and confirm your account before logging in.'
    : 'Account created successfully!';

  return {
    user,
    session,
    requiresEmailConfirmation,
    message,
  };
}

export async function signOutFromSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
}

export async function getSupabaseSession(): Promise<{ session: any | null; user: SupabaseUser | null }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.user) {
      return { session: null, user: null };
    }
    const u = data.session.user;
    return {
      session: data.session,
      user: {
        uid: u.id,
        email: u.email || '',
        displayName: u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'User'),
      },
    };
  } catch (err) {
    console.warn('Error reading Supabase session:', err);
    return { session: null, user: null };
  }
}

export async function getInitialSupabaseUser(): Promise<SupabaseUser | null> {
  const { user } = await getSupabaseSession();
  return user;
}

export function subscribeToSupabaseAuth(
  callback: (user: SupabaseUser | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
    if (session?.user) {
      const u = session.user;
      callback({
        uid: u.id,
        email: u.email || '',
        displayName: u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'User'),
      });
    } else {
      callback(null);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
