import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/* ── Preference shape ───────────────────────────────────────────────────────── */

export interface UserPreferences {
  default_priority: 'high' | 'med' | 'low'
  week_starts_on:   'monday' | 'sunday'
  focus_mode:       boolean
  notifications:    boolean
}

export const DEFAULT_PREFS: UserPreferences = {
  default_priority: 'med',
  week_starts_on:   'monday',
  focus_mode:       false,
  notifications:    true,
}

/* ── Store shape ────────────────────────────────────────────────────────────── */

interface AuthState {
  user:     User    | null
  session:  Session | null
  /** true while checking the stored session on first load */
  loading:  boolean
  error:    string  | null

  initialize:       () => Promise<void>
  signIn:           (email: string, password: string) => Promise<void>
  signUp:           (email: string, password: string, fullName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut:          () => Promise<void>
  updateProfile:    (data: {
    full_name?:    string
    preferences?:  Partial<UserPreferences>
  }) => Promise<void>
  clearError:       () => void
}

/* ── Store ──────────────────────────────────────────────────────────────────── */

export const useAuthStore = create<AuthState>((set, get) => ({
  user:    null,
  session: null,
  loading: true,
  error:   null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false, error: error?.message ?? null })
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null })
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() || undefined, preferences: DEFAULT_PREFS },
      },
    })
    set({ loading: false, error: error?.message ?? null })
  },

  signInWithGoogle: async () => {
    set({ error: null })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin },
    })
    if (error) set({ error: error.message })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  updateProfile: async ({ full_name, preferences }) => {
    set({ loading: true, error: null })
    const existing = get().user?.user_metadata ?? {}
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...existing,
        ...(full_name    !== undefined ? { full_name }    : {}),
        ...(preferences  !== undefined
          ? { preferences: { ...(existing.preferences ?? DEFAULT_PREFS), ...preferences } }
          : {}),
      },
    })
    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ user: data.user, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

/* ── Selector helpers ───────────────────────────────────────────────────────── */

export function getDisplayName(user: User | null): string {
  return (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name       ??
    user?.email?.split('@')[0]      ??
    'User'
  )
}

export function getInitials(user: User | null): string {
  return getDisplayName(user)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

export function getAvatarUrl(user: User | null): string | null {
  return (
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture     ??
    null
  )
}

export function getPreferences(user: User | null): UserPreferences {
  return { ...DEFAULT_PREFS, ...(user?.user_metadata?.preferences ?? {}) }
}
