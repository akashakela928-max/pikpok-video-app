import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, type Session } from './supabase';
import type { Profile } from './types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithName: (name: string, password: string) => Promise<{ error: string | null }>;
  signUpWithName: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NAME_LOGIN_KEY = 'pikpok_name_login_email';

async function findEmailByName(name: string): Promise<string | null> {
  const { data } = await supabase
    .from('name_logins')
    .select('hidden_email')
    .eq('display_name', name.trim())
    .maybeSingle();
  return data?.hidden_email || null;
}

async function isEmailTaken(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('name_logins')
    .select('hidden_email')
    .ilike('hidden_email', email.trim())
    .maybeSingle();
  return !!data?.hidden_email;
}

async function createNameLogin(name: string, email: string): Promise<{ email: string; displayName: string } | { error: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: 'Please enter a valid name.' };
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { error: 'Please enter a valid email.' };

  const existingEmail = await findEmailByName(trimmedName);
  if (existingEmail) return { error: 'This name is already taken. Try a different name.' };

  if (await isEmailTaken(trimmedEmail)) return { error: 'An account with this email already exists. Try signing in.' };

  const { error: insertError } = await supabase
    .from('name_logins')
    .insert({ display_name: trimmedName, hidden_email: trimmedEmail });

  if (insertError) {
    if (insertError.code === '23505') return { error: 'This name or email is already taken.' };
    return { error: 'Could not create account. Please try again.' };
  }
  return { email: trimmedEmail, displayName: trimmedName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUserId: string, metadata?: Record<string, unknown>): Promise<Profile | null> => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (existing) {
      localStorage.setItem('pikpok_auth_profile_id', existing.id);
      return existing as Profile;
    }

    const displayName = typeof metadata?.display_name === 'string' && metadata.display_name.trim()
      ? metadata.display_name.trim()
      : 'PikPok User';
    const username = displayName.toLowerCase().replace(/[^a-z0-9_.]/g, '_').replace(/^_+|_+$/g, '') || `user_${Math.floor(Math.random() * 99999)}`;

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        username,
        display_name: displayName,
        avatar_url: '',
        bio: '',
      })
      .select()
      .maybeSingle();

    if (error || !newProfile) return null;

    const createdProfile = newProfile as Profile;
    localStorage.setItem('pikpok_auth_profile_id', createdProfile.id);
    await supabase.rpc('ensure_wallet', { p_user_id: createdProfile.id });
    return createdProfile;
  }, []);

  const applySession = useCallback(async (nextSession: Session | null): Promise<void> => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setProfile(null);
      setLoading(false);
      localStorage.removeItem('pikpok_auth_profile_id');
      localStorage.removeItem(NAME_LOGIN_KEY);
      return;
    }
    setLoading(true);
    const loadedProfile = await loadProfile(nextSession.user.id, nextSession.user.user_metadata);
    setProfile(loadedProfile);
    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void applySession(currentSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        await applySession(nextSession);
      })();
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const signInWithName = useCallback(async (name: string, password: string) => {
    const email = await findEmailByName(name);
    if (!email) return { error: 'No account found with this name. Try signing up instead.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Wrong name or password. Try again or sign up.' };
    localStorage.setItem(NAME_LOGIN_KEY, email);
    return { error: null };
  }, []);

  const signUpWithName = useCallback(async (name: string, email: string, password: string) => {
    const result = await createNameLogin(name, email);
    if ('error' in result) return { error: result.error };

    const { data, error } = await supabase.auth.signUp({
      email: result.email,
      password,
      options: {
        data: {
          display_name: result.displayName,
        },
      },
    });
    if (error) {
      const friendly: Record<string, string> = {
        'User already registered': 'An account with this email already exists. Try signing in.',
      };
      return { error: friendly[error.message] || error.message };
    }
    if (data.user && !data.session) return { error: 'Account created. Please sign in with your name and password.' };
    localStorage.setItem(NAME_LOGIN_KEY, result.email);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    localStorage.removeItem('pikpok_auth_profile_id');
    localStorage.removeItem(NAME_LOGIN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signInWithName, signUpWithName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
