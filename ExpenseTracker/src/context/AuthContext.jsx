import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    // Restore existing session on load so refreshing stays on current page instantly
    const getInitialSession = async () => {
      // 1. Instant synchronous check from localStorage
      const savedDemoUser = localStorage.getItem('demo_user');
      if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          if (parsed) {
            setUser(parsed);
            setLoading(false);
          }
        } catch {
          localStorage.removeItem('demo_user');
        }
      }

      try {
        // 2. Fast timeout for Supabase cloud session check (1.5s max)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 1500)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          localStorage.setItem('demo_user', JSON.stringify(session.user));
        }
      } catch (err) {
        console.warn('Initial session check notice:', err.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Ignore background auth state changes during registration to prevent route guard redirects
      if (isRegisteringRef.current) {
        setLoading(false);
        return;
      }

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        localStorage.setItem('demo_user', JSON.stringify(newSession.user));
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        localStorage.removeItem('demo_user');
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Register with Email, Password, Full Name, & Birth Date
  const signUp = async ({ email, password, fullName, birthDate }) => {
    isRegisteringRef.current = true;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            birth_date: birthDate || '',
          },
        },
      });

      if (error) throw error;

      // Ensure user is NOT automatically signed in / redirected on registration
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore signout errors
      }
      setUser(null);
      setSession(null);

      // Save user to registered_users list for local demo persistence
      const uniqueUserId = data?.user?.id || ('usr_' + cleanEmail.replace(/[^a-z0-9]/g, '_'));
      const registeredUser = {
        id: uniqueUserId,
        email: cleanEmail,
        user_metadata: { 
          full_name: fullName || cleanEmail.split('@')[0],
          birth_date: birthDate || ''
        }
      };

      const existing = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const updated = [...existing.filter(u => u.email !== cleanEmail), registeredUser];
      localStorage.setItem('registered_users', JSON.stringify(updated));

      // Mark newly registered email for first-time onboarding tutorial
      localStorage.setItem(`new_registration_${cleanEmail}`, 'true');
      localStorage.removeItem(`onboarding_completed_${cleanEmail}`);

      return { data, error: null };
    } catch (error) {
      console.warn('Supabase signUp notice:', error.message);
      const msg = error.message?.toLowerCase() || '';

      if (msg.includes('already registered') || msg.includes('user_already_exists') || msg.includes('already exists')) {
        return { data: null, error: { message: 'An account with this email address is already registered. Please sign in or use a different email.' } };
      }

      if (msg.includes('rate limit') || error.code === 'over_email_send_rate_limit' || error.status === 429) {
        return { 
          data: null, 
          error: { message: 'Supabase email rate limit exceeded. Please wait a few minutes before trying again.' } 
        };
      }

      // If connection fails, check local storage duplicate or save locally as fallback
      const existing = JSON.parse(localStorage.getItem('registered_users') || '[]');
      if (existing.some(u => u.email === cleanEmail)) {
        return { 
          data: null, 
          error: { message: 'An account with this email address is already registered. Please sign in or use a different email.' } 
        };
      }

      const uniqueUserId = 'usr_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      const mockUser = {
        id: uniqueUserId,
        email: cleanEmail,
        user_metadata: { 
          full_name: fullName || cleanEmail.split('@')[0],
          birth_date: birthDate || ''
        }
      };

      const updated = [...existing.filter(u => u.email !== cleanEmail), mockUser];
      localStorage.setItem('registered_users', JSON.stringify(updated));

      // Mark newly registered email for first-time onboarding tutorial
      localStorage.setItem(`new_registration_${cleanEmail}`, 'true');
      localStorage.removeItem(`onboarding_completed_${cleanEmail}`);

      return { data: { user: mockUser }, error: null };
    } finally {
      setTimeout(() => {
        isRegisteringRef.current = false;
      }, 100);
    }
  };

  // Login with Email & Password
  const signIn = async ({ email, password }) => {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        localStorage.setItem('demo_user', JSON.stringify(data.user));
      }
      return { data, error: null };
    } catch (error) {
      console.warn('Supabase signIn notice:', error.message);

      // Check fallback in local registered_users storage
      const registered = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const match = registered.find(u => u.email === cleanEmail);
      if (match) {
        setUser(match);
        localStorage.setItem('demo_user', JSON.stringify(match));
        return { data: { user: match }, error: null };
      }
      
      // Never reveal whether email or password was wrong
      return { 
        data: null, 
        error: { message: 'Invalid email or password.', code: 'invalid_credentials' } 
      };
    }
  };

  // Update Profile Details (Full Name, Birth Date, Avatar URL)
  const updateProfile = async ({ fullName, birthDate, avatarUrl }) => {
    try {
      const metadataToUpdate = {
        full_name: fullName,
        birth_date: birthDate,
      };
      if (avatarUrl !== undefined) {
        metadataToUpdate.avatar_url = avatarUrl;
      }

      const { data, error } = await supabase.auth.updateUser({
        data: metadataToUpdate,
      });

      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
      }
      return { success: true };
    } catch (err) {
      console.warn('Supabase profile update fallback to local:', err.message);
      if (user) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: fullName,
            birth_date: birthDate,
            ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
          },
        };
        setUser(updatedUser);
        localStorage.setItem('demo_user', JSON.stringify(updatedUser));

        const cleanEmail = user.email?.toLowerCase().trim();
        if (cleanEmail) {
          const registered = JSON.parse(localStorage.getItem('registered_users') || '[]');
          const idx = registered.findIndex(u => u.email === cleanEmail);
          if (idx !== -1) {
            registered[idx].user_metadata = updatedUser.user_metadata;
            localStorage.setItem('registered_users', JSON.stringify(registered));
          }
        }
      }
      return { success: true };
    }
  };

  // Logout
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err.message);
    } finally {
      localStorage.removeItem('demo_user');
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
