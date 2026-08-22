import { supabase } from './supabase';

/** Races a promise against a timeout. Rejects with 'Fetch timeout' if ms elapses first. */
export const withTimeout = (promise, ms = 1500) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), ms)),
  ]);

/**
 * Returns the active user from localStorage (demo_user) or a live Supabase session.
 * localStorage is checked first so the app stays responsive when offline.
 */
export const getActiveUser = async () => {
  const saved = localStorage.getItem('demo_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed) return parsed;
    } catch { /* ignore malformed JSON */ }
  }

  try {
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), 1500);
    if (user) return user;
  } catch (err) {
    console.warn('Supabase auth get user error:', err.message);
  }

  return null;
};
